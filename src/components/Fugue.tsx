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
import { FUGUE_STAGE_DATA, type FugueStageId } from "../content/data";
import { Rich, useI18n } from "../i18n";
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
  const { c } = useI18n();
  return (
    <div className="fugue__ruler" aria-hidden="true">
      {Array.from({ length: TOTAL_WEEKS + 1 }).map((_, i) => (
        <span key={i} className={`fugue__tick${i % 2 === 0 ? " is-major" : ""}${i === TOTAL_WEEKS ? " is-end" : ""}`} style={{ left: `${(i / TOTAL_WEEKS) * 100}%` }}>
          {i % 2 === 0 ? <b>{i}</b> : null}
        </span>
      ))}
      <span className="fugue__ruler-label mono">{c.fugue.rulerLabel}</span>
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
  const { c, fill, fmt } = useI18n();
  const stages: Stage[] = useMemo(
    () =>
      (Object.keys(FUGUE_STAGE_DATA) as FugueStageId[]).map((id) => ({
        ...FUGUE_STAGE_DATA[id],
        id,
        ...c.fugue.stages[id],
      })),
    [c],
  );
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
    if (solo) return stages.filter((s) => s.id === solo);
    return stages.filter((s) => {
      const w = pos * TOTAL_WEEKS;
      return w >= s.start - 0.001 && w <= s.end + 0.001;
    });
  }, [pos, solo, stages]);

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
    const next = stages.filter((s) => w >= s.start - 0.001 && w <= s.end + 0.001);
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
      ? c.fugue.status.auditionAll
      : mode === "solo"
        ? fill(c.fugue.status.auditionOne, { name: active[0]?.name ?? "" })
        : fill(c.fugue.status.nowSounding, { count: active.length });

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
              <span className="lit">{c.fugue.eyebrow.plate}</span>
              <span className="sep">/</span>
              <span>{c.fugue.eyebrow.section}</span>
              <span className="sep">/</span>
              <span>{c.fugue.eyebrow.how}</span>
            </p>
            <h2 className="fugue__title" id="fugue-title">
              {c.fugue.title1}
              <br />
              <Rich text={c.fugue.title2} />
            </h2>
          </div>
          <div className="fugue__head-note">
            <p className="lede">
              <Rich text={c.fugue.lede} />
            </p>
            <div className="fugue__meta">
              <span>{c.fugue.meta.duration}</span>
              <span>{c.fugue.meta.tempo}</span>
              <span>{c.fugue.meta.key}</span>
              <span>{c.fugue.meta.form}</span>
            </div>
          </div>
        </header>

        <div className="fugue__score" data-sung={lit ? beatNow.toFixed(2) : "-1"}>
          <div className="fugue__labels">
            <div className="fugue__labels-head mono">{c.fugue.labelsHead}</div>
            {stages.map((s) => (
              <button
                key={s.id}
                type="button"
                data-sfx="tick"
                className={`stave-label${active.some((a) => a.id === s.id) ? " is-on" : ""}${
                  solo === s.id ? " is-solo" : ""
                }`}
                onClick={() => pickStage(s)}
                aria-pressed={solo === s.id}
                data-cursor={solo === s.id ? c.chrome.cursor.clearSolo : c.chrome.cursor.playMovement}
              >
                <span className="stave-label__roman">{s.roman}</span>
                <span className="stave-label__name">{s.name}</span>
                <span className="stave-label__weeks">{s.weeks}</span>
                <span className="stave-label__dot" aria-hidden="true" />
              </button>
            ))}
            <div className="fugue__labels-foot mono">{c.fugue.labelsFoot}</div>
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
            aria-label={c.fugue.timelineAria}
            aria-orientation="horizontal"
            aria-valuemin={0}
            aria-valuemax={TOTAL_WEEKS}
            aria-valuenow={Number(week.toFixed(1))}
            aria-valuetext={fill(c.fugue.timelineValue, { week: fmt.number(week, 1), total: TOTAL_WEEKS })}
            data-cursor={c.chrome.cursor.dragNeedle}
          >
            <ScoreRuler />
            <div className="fugue__staves">
              {stages.map((s) => {
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
                {fill(c.fugue.playhead, { week: fmt.number(week, 1) })}
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
              <span className="fugue__clock">{c.common.bar} {bar}/8</span>
            </span>
            <div className="fugue__console-controls">
              <button
                type="button"
                className={`fugue__play${mode === "piece" ? " is-playing" : ""}`}
                data-sfx="transport"
                onClick={playPiece}
                aria-pressed={mode === "piece"}
                title={c.fugue.controls.playTitle}
              >
                <span className="fugue__play-ico" aria-hidden="true">
                  {mode === "piece" ? "■" : "▶"}
                </span>
                {mode === "piece" ? c.fugue.controls.stop : c.fugue.controls.play}
              </button>
              <button type="button" className={`fugue__sound${sound ? " is-on" : ""}`} data-sfx="switch" onClick={toggleSound} aria-pressed={sound}>
                <span className="fugue__sound-led" /> {sound ? c.fugue.controls.soundOn : c.fugue.controls.soundOff}
              </button>
              <button type="button" className="fugue__sound" data-sfx="tick" onClick={reset}>
                {c.fugue.controls.reset}
              </button>
            </div>
          </div>

          <div className="fugue__program" aria-live="polite">
            {active.length === 0 ? (
              <p className="fugue__quiet">
                {c.fugue.status.roomQuiet}
                <span>{c.fugue.status.moveNeedle}</span>
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
                      <span className="mono">{c.fugue.youGet}</span> {s.deliverable}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="fugue__foot">
          <p className="fugue__quote">
            <Rich text={c.fugue.foot.quote} />
          </p>
          <p className="footnote">
            {c.fugue.foot.footnote}
          </p>
          <span className="stamp fugue__stamp">{c.fugue.foot.stamp}</span>
        </div>
      </div>
    </section>
  );
}
