import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { onTick } from "../lib/ticker";
import { getMusicPlayer } from "../lib/music";
import { playSfx } from "../lib/sfx";
import { FuguePlayer } from "../lib/fugueAudio";
import {
  BEATS_PER_WEEK,
  MOVEMENT_IDS,
  NOTE_COUNT,
  SCORE,
  SEC_PER_BEAT,
  TOTAL_BEATS,
  type MovementId,
} from "../lib/fugueScore";

type Stage = {
  id: MovementId;
  roman: string;
  name: string;
  weeks: string;
  start: number;
  end: number;
  voice: string;
  statement: string;
  detail: string;
  deliverable: string;
};

const TOTAL_WEEKS = TOTAL_BEATS / BEATS_PER_WEEK;

const STAGES: Stage[] = [
  {
    id: "listen",
    roman: "I",
    name: "Listen",
    weeks: "WK 0—2",
    start: 0,
    end: 2.7,
    voice: "Felt piano · the subject, stretched and lifted two octaves",
    statement: "We sit with the problem until it stops being polite.",
    detail:
      "Two calls, one long walk, a shared document nobody performs in. We listen for the sentence you keep repeating when you think no one is scoring it. That sentence is the brief.",
    deliverable: "A one-page brief. Eleven words. We keep it taped to the wall.",
  },
  {
    id: "loop",
    roman: "II",
    name: "Loop",
    weeks: "WK 0—3",
    start: 1.4,
    end: 4.2,
    voice: "Muted plucks · the head of the subject, stuck on repeat",
    statement: "A version exists before the deck does.",
    detail:
      "Seventy-two hours from brief to a thing in your hands. Ugly on purpose. Clickable. We test it with three people who aren’t you, then with you. The loop is the argument.",
    deliverable: "A working loop. Real copy. A list of what to kill.",
  },
  {
    id: "lash",
    roman: "III",
    name: "Lash",
    weeks: "WK 3—7",
    start: 3.0,
    end: 6.8,
    voice: "Saw bass and whip ticks · the subject backwards, cut short, one borrowed E♭",
    statement: "We tie the thing to reality until it holds.",
    detail:
      "Real data, real edge cases, real load. Design and build happen in the same room, in the same file. Every third day we ship to a staging URL you can open on your phone, in a lift, in the rain.",
    deliverable: "A product, not a prototype. Staging access. No surprises in the last week.",
  },
  {
    id: "lift",
    roman: "IV",
    name: "Lift",
    weeks: "WK 5—7",
    start: 5.4,
    end: 7.4,
    voice: "Bells and an open fifth · the subject opened up and harmonised",
    statement: "Ship it, then watch faces.",
    detail:
      "We launch with a soft room, not a countdown. Then we sit and watch five people use it. What they don’t notice is the design. What they linger on is the work. We write the next fix list by ear.",
    deliverable: "A launch. A short film of the first session. A fix list written by ears, not tickets.",
  },
  {
    id: "lull",
    roman: "V",
    name: "Lull",
    weeks: "WK 7—∞",
    start: 6.7,
    end: 8,
    voice: "Warm pad · the subject retrograded, slowed, and the G finally falls to F",
    statement: "We stay, quietly, for a month of Tuesdays.",
    detail:
      "No dashboard, no monthly review theatre. One standing hour a week and a line that is always open. Small corrections while they are still small. Then we leave you a tidy repo and permission to move on.",
    deliverable: "A standing date. A tidy repo. Permission to move on.",
  },
];

/** Pitch → position on a 52 px stave, so the drawing is the actual score. */
const MELODIC = MOVEMENT_IDS.flatMap((id) =>
  SCORE[id].filter((n) => n.voice !== "tick" && n.voice !== "air"),
);
const PITCH_LO = Math.min(...MELODIC.map((n) => n.pitch));
const PITCH_HI = Math.max(...MELODIC.map((n) => n.pitch));
const pitchTop = (pitch: number) =>
  58 - ((pitch - PITCH_LO) / Math.max(1, PITCH_HI - PITCH_LO)) * 52;

type Mark = { key: string; left: number; width: number; top: number; beat: number };

const MARKS = Object.fromEntries(
  MOVEMENT_IDS.map((id) => [
    id,
    SCORE[id]
      .filter((n) => n.voice !== "tick" && n.voice !== "air")
      .map((n, i) => ({
        key: `${id}-${i}-${n.beat}`,
        left: Math.min(99.2, (n.beat / TOTAL_BEATS) * 100),
        width: Math.max(0.9, (n.dur / TOTAL_BEATS) * 100),
        top: pitchTop(n.pitch),
        beat: n.beat,
      })),
  ]),
) as Record<MovementId, Mark[]>;

function ScoreRuler() {
  return (
    <div className="fugue__ruler" aria-hidden="true">
      {Array.from({ length: TOTAL_WEEKS + 1 }).map((_, i) => (
        <span key={i} className={`fugue__tick${i % 2 === 0 ? " is-major" : ""}${i === TOTAL_WEEKS ? " is-end" : ""}`} style={{ left: `${(i / TOTAL_WEEKS) * 100}%` }}>
          {i % 2 === 0 ? <b>{i}</b> : null}
        </span>
      ))}
      <span className="fugue__ruler-label mono">weeks</span>
    </div>
  );
}

type Run = { from: number; to: number; start: number };

export function Fugue({
  soundOn,
  onEnableSound,
}: {
  soundOn: boolean;
  onEnableSound: () => void;
}) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(2.6 / TOTAL_WEEKS);
  const [solo, setSolo] = useState<MovementId | null>(null);
  const [sound, setSound] = useState(false);
  const [mode, setMode] = useState<"idle" | "piece" | "solo">("idle");
  const [held, setHeld] = useState(false);
  const playerRef = useRef<FuguePlayer | null>(null);
  const runRef = useRef<Run | null>(null);
  const prevActive = useRef("");
  const dragging = useRef(false);

  useEffect(() => {
    if (soundOn) return;
    playerRef.current?.stop();
    setMode("idle");
    setHeld(false);
    setSound(false);
  }, [soundOn]);

  const player = () => {
    if (!playerRef.current) playerRef.current = new FuguePlayer();
    return playerRef.current;
  };

  const active = useMemo(() => {
    if (solo) return STAGES.filter((s) => s.id === solo);
    return STAGES.filter((s) => {
      const w = pos * TOTAL_WEEKS;
      return w >= s.start - 0.001 && w <= s.end + 0.001;
    });
  }, [pos, solo]);

  const activeKey = active.map((s) => s.id).join(",");
  const week = pos * TOTAL_WEEKS;
  const beatNow = pos * TOTAL_BEATS;
  const playing = mode !== "idle";
  const lit = playing || held;
  const bar = Math.min(TOTAL_WEEKS, Math.floor(beatNow / BEATS_PER_WEEK) + 1);

  /** The needle follows the audio clock, not the other way round. */
  useEffect(() => {
    if (mode === "idle") return;
    const p = playerRef.current;
    const run = runRef.current;
    if (!p || !run) return;
    const stop = onTick(() => {
      const beat = run.from + (p.now() - run.start) / SEC_PER_BEAT;
      if (beat >= run.to - 0.005) {
        setPos(run.to / TOTAL_BEATS);
        setMode("idle");
        setHeld(true);
        return;
      }
      setPos(Math.max(run.from, Math.min(run.to, beat)) / TOTAL_BEATS);
    });
    return stop;
  }, [mode]);

  /** The Fugue owns the room while it plays; HUNCH FM steps aside. */
  useEffect(() => {
    const music = getMusicPlayer();
    if (mode !== "idle") music.duck();
    else music.release();
  }, [mode]);

  /** Entries while the needle is dragged across a new movement. */
  useEffect(() => {
    const prev = prevActive.current ? prevActive.current.split(",") : [];
    if (mode !== "idle" || !sound || !dragging.current) {
      prevActive.current = activeKey;
      return;
    }
    const fresh = activeKey.split(",").filter((id) => id && !prev.includes(id));
    fresh.forEach((id) => player().entry(id as MovementId));
    if (fresh.length) getMusicPlayer().duckFor(2.6);
    prevActive.current = activeKey;
  }, [activeKey, mode, sound]);

  const audition = (stage: Stage) => {
    if (!soundOn) {
      onEnableSound();
      playSfx("tick");
    }
    const p = player();
    if (!p.ensure()) return;
    setSound(true);
    setHeld(false);
    setSolo(stage.id);
    setPos(stage.start / TOTAL_WEEKS);
    const from = stage.start * BEATS_PER_WEEK;
    const to = stage.end * BEATS_PER_WEEK;
    const res = p.play([stage.id], from, 0.14, to);
    if (!res) {
      setMode("idle");
      return;
    }
    runRef.current = { from, to, start: res.start };
    setMode("solo");
  };

  const playPiece = () => {
    if (!soundOn) {
      onEnableSound();
      playSfx("transport");
    }
    const p = player();
    if (mode === "piece") {
      p.stop();
      setMode("idle");
      setHeld(false);
      return;
    }
    if (!p.ensure()) return;
    setSound(true);
    setHeld(false);
    setSolo(null);
    setPos(0);
    const res = p.play(MOVEMENT_IDS, 0);
    if (!res) {
      setMode("idle");
      return;
    }
    runRef.current = { from: 0, to: TOTAL_BEATS, start: res.start };
    setMode("piece");
  };

  const toggleSound = () => {
    if (!sound) {
      if (!soundOn) {
        onEnableSound();
        playSfx("switch");
      }
      player().ensure();
      setSound(true);
      return;
    }
    playerRef.current?.stop();
    setSound(false);
    setMode("idle");
    setHeld(false);
  };

  const reset = () => {
    playerRef.current?.stop();
    setMode("idle");
    setHeld(false);
    setSolo(null);
    setPos(2.6 / TOTAL_WEEKS);
  };

  const setFromPointer = (clientX: number) => {
    const el = timelineRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos(Math.min(1, Math.max(0, (clientX - r.left) / r.width)));
  };

  const onDown = (e: ReactPointerEvent) => {
    dragging.current = true;
    playerRef.current?.stop();
    setMode("idle");
    setHeld(false);
    setSolo(null);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setFromPointer(e.clientX);
  };
  const onMove = (e: ReactPointerEvent) => {
    if (!dragging.current) return;
    playSfx("needle");
    setFromPointer(e.clientX);
  };
  const onUp = () => {
    dragging.current = false;
  };

  const nudge = (targetWeek: number) => {
    const w = Math.min(TOTAL_WEEKS, Math.max(0, targetWeek));
    playerRef.current?.stop();
    setMode("idle");
    setHeld(false);
    setSolo(null);
    setPos(w / TOTAL_WEEKS);
    if (!sound) return;
    const next = STAGES.filter((s) => w >= s.start - 0.001 && w <= s.end + 0.001);
    const prev = prevActive.current ? prevActive.current.split(",") : [];
    next.filter((s) => !prev.includes(s.id)).forEach((s) => player().entry(s.id));
    prevActive.current = next.map((s) => s.id).join(",");
  };

  const onKey = (e: ReactKeyboardEvent) => {
    const step = e.shiftKey ? 0.5 : 0.1;
    let target: number | null = null;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") target = week - step;
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") target = week + step;
    else if (e.key === "Home") target = 0;
    else if (e.key === "End") target = TOTAL_WEEKS;
    if (target === null) return;
    e.preventDefault();
    playSfx("needle");
    nudge(target);
  };

  const pickStage = (s: Stage) => {
    if (solo === s.id && mode !== "piece") {
      playerRef.current?.stop();
      setMode("idle");
      setHeld(false);
      setSolo(null);
      return;
    }
    audition(s);
  };

  const status =
    mode === "piece"
      ? "Auditioning — all five movements, overlapping"
      : mode === "solo"
        ? `Auditioning — ${active[0]?.name ?? "one movement"}`
        : `Now sounding — ${active.length} of 5 movements`;

  return (
    <section
      className="plate stock-cobalt fugue"
      id="fugue"
      aria-labelledby="fugue-title"
      data-score-notes={NOTE_COUNT}
      data-score-voices={active.length}
      data-score-mode={mode}
    >
      <span className="folio" aria-hidden="true">
        03
      </span>
      <div className="shell plate-pad">
        <header className="fugue__head">
          <div>
            <p className="eyebrow">
              <span className="tick" />
              <span className="lit">Plate 03</span>
              <span className="sep">/</span>
              <span>The Fugue</span>
              <span className="sep">/</span>
              <span>How it’s made</span>
            </p>
            <h2 className="fugue__title" id="fugue-title">
              Five movements,
              <br />
              <em>overlapping.</em>
            </h2>
          </div>
          <div className="fugue__head-note">
            <p className="lede">
              A build doesn’t move in a straight line. Neither does a fugue. Drag the needle:
              several things are always happening at once — listening, looping, lashing, lifting,
              staying. One subject, <b>F–A–C–B♭–A–G</b>, enters five times: stretched, looped, cut
              backwards, harmonised, then slowed until the last note gives up.
            </p>
            <div className="fugue__meta">
              <span>Duration / 25.6 sec</span>
              <span>Tempo / ♩ = 75, 8 bars</span>
              <span>Key / F major, one borrowed E♭</span>
              <span>Form / five entries</span>
            </div>
          </div>
        </header>

        <div className="fugue__score" data-sung={lit ? beatNow.toFixed(2) : "-1"}>
          <div className="fugue__labels">
            <div className="fugue__labels-head mono">Movement</div>
            {STAGES.map((s) => (
              <button
                key={s.id}
                type="button"
                data-sfx="tick"
                className={`stave-label${active.some((a) => a.id === s.id) ? " is-on" : ""}${
                  solo === s.id ? " is-solo" : ""
                }`}
                onClick={() => pickStage(s)}
                aria-pressed={solo === s.id}
                data-cursor={solo === s.id ? "CLEAR SOLO" : "PLAY THIS MOVEMENT"}
              >
                <span className="stave-label__roman">{s.roman}</span>
                <span className="stave-label__name">{s.name}</span>
                <span className="stave-label__weeks">{s.weeks}</span>
                <span className="stave-label__dot" aria-hidden="true" />
              </button>
            ))}
            <div className="fugue__labels-foot mono">tap a movement to hear it</div>
          </div>

          <div
            className="fugue__timeline"
            ref={timelineRef}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onKeyDown={onKey}
            data-sfx="needle"
            role="slider"
            tabIndex={0}
            aria-label="Score needle, in weeks"
            aria-orientation="horizontal"
            aria-valuemin={0}
            aria-valuemax={TOTAL_WEEKS}
            aria-valuenow={Number(week.toFixed(1))}
            aria-valuetext={`week ${week.toFixed(1)} of ${TOTAL_WEEKS}`}
            data-cursor="DRAG THE NEEDLE"
          >
            <ScoreRuler />
            <div className="fugue__staves">
              {STAGES.map((s) => {
                const on = active.some((a) => a.id === s.id);
                return (
                  <div
                    key={s.id}
                    className={`stave-track${on ? " is-on" : ""}${solo === s.id ? " is-solo" : ""}`}
                  >
                    <span className="stave-track__band" style={{ left: `${(s.start / TOTAL_WEEKS) * 100}%`, width: `${((s.end - s.start) / TOTAL_WEEKS) * 100}%` }} />
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="stave-track__line" style={{ top: `${12 + i * 11}px` }} />
                    ))}
                    {MARKS[s.id].map((m) => (
                      <span
                        key={m.key}
                        className={`fugue__note${m.top < 24 ? " is-high" : ""}${lit && m.beat <= beatNow + 0.001 ? " is-sung" : ""}`}
                        style={{
                          left: `${m.left}%`,
                          width: `${m.width}%`,
                          top: `${m.top}px`,
                        }}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                );
              })}
            </div>
            <div className="fugue__playhead" style={{ left: `${pos * 100}%` }}>
              <span className="fugue__playhead-tag mono">
                t + {week.toFixed(1)} <small>wk</small>
              </span>
              <span className="fugue__playhead-line" />
              <span className="fugue__playhead-foot" />
            </div>
          </div>
        </div>

        <div className="fugue__console" data-mode={mode}>
          <div className="fugue__console-head">
            <span className="mono">
              <span className="dot-live" />
              {status}
              <span className="fugue__clock">bar {bar}/8</span>
            </span>
            <div className="fugue__console-controls">
              <button
                type="button"
                className={`fugue__play${mode === "piece" ? " is-playing" : ""}`}
                data-sfx="transport"
                onClick={playPiece}
                aria-pressed={mode === "piece"}
                title="Play the whole piece: five voices entering where their weeks begin"
              >
                <span className="fugue__play-ico" aria-hidden="true">
                  {mode === "piece" ? "■" : "▶"}
                </span>
                {mode === "piece" ? "Stop" : "Play the fugue"}
              </button>
              <button type="button" className={`fugue__sound${sound ? " is-on" : ""}`} data-sfx="switch" onClick={toggleSound} aria-pressed={sound}>
                <span className="fugue__sound-led" /> Sound {sound ? "on" : "off"}
              </button>
              <button type="button" className="fugue__sound" data-sfx="tick" onClick={reset}>
                Reset
              </button>
            </div>
          </div>

          <div className="fugue__program" aria-live="polite">
            {active.length === 0 ? (
              <p className="fugue__quiet">
                The room is quiet.
                <span>Move the needle into a phrase.</span>
              </p>
            ) : (
              active.map((s) => (
                <article key={s.id} className="movement">
                  <div className="movement__no">
                    <span>{s.roman}</span>
                    <span className="movement__week">{s.weeks}</span>
                  </div>
                  <div className="movement__body">
                    <h3 className="movement__name">{s.name}</h3>
                    <p className="movement__voice mono">{s.voice}</p>
                    <p className="movement__statement">{s.statement}</p>
                    <p className="movement__detail">{s.detail}</p>
                    <p className="movement__get">
                      <span className="mono">You get /</span> {s.deliverable}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="fugue__foot">
          <p className="fugue__quote">
            You can’t schedule taste. <em>You can leave room for it.</em>
          </p>
          <p className="footnote">
            The score is honest: nothing starts after the previous thing ends. We overlap because
            attention does. Sound is optional; the feeling isn’t.
          </p>
          <span className="stamp fugue__stamp">By ear</span>
        </div>
      </div>
    </section>
  );
}
