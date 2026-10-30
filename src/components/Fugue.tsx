import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { onTick } from "../lib/ticker";

type Stage = {
  id: string;
  roman: string;
  name: string;
  weeks: string;
  start: number;
  end: number;
  freq: number;
  statement: string;
  detail: string;
  deliverable: string;
  notes: { at: number; len: number; line: number }[];
};

const TOTAL = 8;

const STAGES: Stage[] = [
  {
    id: "listen",
    roman: "I",
    name: "Listen",
    weeks: "WK 0—2",
    start: 0,
    end: 2.7,
    freq: 220,
    statement: "We sit with the problem until it stops being polite.",
    detail:
      "Two calls, one long walk, a shared document nobody performs in. We listen for the sentence you keep repeating when you think no one is scoring it. That sentence is the brief.",
    deliverable: "A one-page brief. Eleven words. We keep it taped to the wall.",
    notes: [
      { at: 0.15, len: 0.5, line: 3 },
      { at: 0.95, len: 0.3, line: 1 },
      { at: 1.5, len: 0.5, line: 4 },
      { at: 2.25, len: 0.3, line: 2 },
    ],
  },
  {
    id: "loop",
    roman: "II",
    name: "Loop",
    weeks: "WK 0—3",
    start: 1.4,
    end: 4.2,
    freq: 277.18,
    statement: "A version exists before the deck does.",
    detail:
      "Seventy-two hours from brief to a thing in your hands. Ugly on purpose. Clickable. We test it with three people who aren’t you, then with you. The loop is the argument.",
    deliverable: "A working loop. Real copy. A list of what to kill.",
    notes: [
      { at: 1.55, len: 0.6, line: 2 },
      { at: 2.4, len: 0.3, line: 0 },
      { at: 2.85, len: 0.6, line: 3 },
      { at: 3.7, len: 0.35, line: 1 },
    ],
  },
  {
    id: "lash",
    roman: "III",
    name: "Lash",
    weeks: "WK 3—7",
    start: 3.0,
    end: 6.8,
    freq: 329.63,
    statement: "We tie the thing to reality until it holds.",
    detail:
      "Real data, real edge cases, real load. Design and build happen in the same room, in the same file. Every third day we ship to a staging URL you can open on your phone, in a lift, in the rain.",
    deliverable: "A product, not a prototype. Staging access. No surprises in the last week.",
    notes: [
      { at: 3.15, len: 0.5, line: 4 },
      { at: 3.9, len: 0.4, line: 1 },
      { at: 4.6, len: 0.8, line: 3 },
      { at: 5.75, len: 0.35, line: 0 },
      { at: 6.2, len: 0.4, line: 2 },
    ],
  },
  {
    id: "lift",
    roman: "IV",
    name: "Lift",
    weeks: "WK 5—7",
    start: 5.4,
    end: 7.4,
    freq: 392,
    statement: "Ship it, then watch faces.",
    detail:
      "We launch with a soft room, not a countdown. Then we sit and watch five people use it. What they don’t notice is the design. What they linger on is the work. We write the next fix list by ear.",
    deliverable: "A launch. A short film of the first session. A fix list written by ears, not tickets.",
    notes: [
      { at: 5.5, len: 0.45, line: 2 },
      { at: 6.1, len: 0.3, line: 4 },
      { at: 6.65, len: 0.5, line: 1 },
      { at: 7.25, len: 0.2, line: 3 },
    ],
  },
  {
    id: "lull",
    roman: "V",
    name: "Lull",
    weeks: "WK 7—∞",
    start: 6.7,
    end: 8,
    freq: 440,
    statement: "We stay, quietly, for a month of Tuesdays.",
    detail:
      "No dashboard, no monthly review theatre. One standing hour a week and a line that is always open. Small corrections while they are still small. Then we leave you a tidy repo and permission to move on.",
    deliverable: "A standing date. A tidy repo. Permission to move on.",
    notes: [
      { at: 6.85, len: 0.5, line: 0 },
      { at: 7.35, len: 0.3, line: 3 },
      { at: 7.7, len: 0.25, line: 1 },
    ],
  },
];

function ScoreRuler() {
  return (
    <div className="fugue__ruler" aria-hidden="true">
      {Array.from({ length: TOTAL + 1 }).map((_, i) => (
        <span key={i} className={`fugue__tick${i % 2 === 0 ? " is-major" : ""}`} style={{ left: `${(i / TOTAL) * 100}%` }}>
          {i % 2 === 0 ? <b>{i}</b> : null}
        </span>
      ))}
      <span className="fugue__ruler-label mono">weeks</span>
    </div>
  );
}

export function Fugue() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(2.6 / TOTAL);
  const [solo, setSolo] = useState<string | null>(null);
  const [sound, setSound] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const prevActive = useRef("");
  const dragging = useRef(false);

  const active = useMemo(() => {
    if (solo) return STAGES.filter((s) => s.id === solo);
    return STAGES.filter((s) => {
      const w = pos * TOTAL;
      return w >= s.start - 0.001 && w <= s.end + 0.001;
    });
  }, [pos, solo]);

  const activeKey = active.map((s) => s.id).join(",");
  const week = pos * TOTAL;

  const playTone = (freq: number, delay = 0) => {
    const ac = audioRef.current;
    if (!ac) return;
    const t = ac.currentTime + delay;
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.045, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    gain.connect(ac.destination);
    const osc = ac.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    const osc2 = ac.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(freq * 2.002, t);
    const g2 = ac.createGain();
    g2.gain.setValueAtTime(0.22, t);
    osc2.connect(g2);
    g2.connect(gain);
    osc.connect(gain);
    osc.start(t);
    osc2.start(t);
    osc.stop(t + 0.75);
    osc2.stop(t + 0.75);
  };

  useEffect(() => {
    if (!sound || playing) {
      prevActive.current = activeKey;
      return;
    }
    const prev = prevActive.current ? prevActive.current.split(",") : [];
    const fresh = active.filter((s) => !prev.includes(s.id));
    fresh.forEach((s, i) => playTone(s.freq, i * 0.09));
    prevActive.current = activeKey;
  }, [activeKey, sound, playing]);

  const ensureAudio = () => {
    if (!audioRef.current) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (Ctx) audioRef.current = new Ctx();
    }
    if (audioRef.current) {
      void audioRef.current.resume().catch(() => {});
    }
  };

  const toggleSound = () => {
    if (!sound) ensureAudio();
    if (playing) setPlaying(false);
    setSound((s) => !s);
  };

  const playFugue = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    ensureAudio();
    setSound(true);
    setSolo(null);
    setPos(0);
    setPlaying(true);
  };

  // Audition the whole score: sweep the needle and sing one note per movement.
  useEffect(() => {
    if (!playing) return;
    let started = 0;
    const sung = new Set<string>();
    const stop = onTick((t) => {
      if (!started) started = t;
      const p = Math.min(1, (t - started) / 8.4);
      setPos(p);
      for (const stage of STAGES) {
        if (!sung.has(stage.id) && p >= stage.start / TOTAL) {
          sung.add(stage.id);
          playTone(stage.freq);
        }
      }
      if (p >= 1) setPlaying(false);
    });
    return stop;
  }, [playing]);

  const setFromPointer = (clientX: number) => {
    const el = timelineRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos(Math.min(1, Math.max(0, (clientX - r.left) / r.width)));
  };

  const onDown = (e: ReactPointerEvent) => {
    dragging.current = true;
    setPlaying(false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setFromPointer(e.clientX);
  };
  const onMove = (e: ReactPointerEvent) => {
    if (!dragging.current) return;
    setFromPointer(e.clientX);
  };
  const onUp = () => {
    dragging.current = false;
  };

  const pickStage = (s: Stage) => {
    setPlaying(false);
    if (solo === s.id) {
      setSolo(null);
      return;
    }
    setSolo(s.id);
    setPos((s.start + s.end) / 2 / TOTAL);
  };

  return (
    <section className="plate stock-cobalt fugue" id="fugue" aria-labelledby="fugue-title">
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
              A build doesn’t move in a straight line. Neither does a fugue. Drag the needle: several
              things are always happening at once — listening, looping, lashing, lifting, staying.
            </p>
            <div className="fugue__meta">
              <span>Duration / 6—10 weeks</span>
              <span>Tempo / ♩ = 72 (loose)</span>
              <span>Key / F major, allegedly</span>
            </div>
          </div>
        </header>

        <div className="fugue__score">
          <div className="fugue__labels">
            <div className="fugue__labels-head mono">Movement</div>
            {STAGES.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`stave-label${active.some((a) => a.id === s.id) ? " is-on" : ""}${
                  solo === s.id ? " is-solo" : ""
                }`}
                onClick={() => pickStage(s)}
                aria-pressed={solo === s.id}
                data-cursor={solo === s.id ? "CLEAR SOLO" : "SOLO THIS MOVEMENT"}
              >
                <span className="stave-label__roman">{s.roman}</span>
                <span className="stave-label__name">{s.name}</span>
                <span className="stave-label__weeks">{s.weeks}</span>
                <span className="stave-label__dot" aria-hidden="true" />
              </button>
            ))}
            <div className="fugue__labels-foot mono">solo / tap a movement</div>
          </div>

          <div
            className="fugue__timeline"
            ref={timelineRef}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
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
                    <span className="stave-track__band" style={{ left: `${(s.start / TOTAL) * 100}%`, width: `${((s.end - s.start) / TOTAL) * 100}%` }} />
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="stave-track__line" style={{ top: `${12 + i * 11}px` }} />
                    ))}
                    {s.notes.map((n, i) => (
                      <span
                        key={i}
                        className="fugue__note"
                        style={{
                          left: `${(n.at / TOTAL) * 100}%`,
                          width: `${(n.len / TOTAL) * 100}%`,
                          top: `${8 + n.line * 11}px`,
                          transitionDelay: `${i * 18}ms`,
                        }}
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

        <div className="fugue__console">
          <div className="fugue__console-head">
            <span className="mono">
              <span className="dot-live" />
              {playing ? "Auditioning — all five movements" : `Now sounding — ${active.length} of 5 movements`}
            </span>
            <div className="fugue__console-controls">
              <button
                type="button"
                className={`fugue__play${playing ? " is-playing" : ""}`}
                onClick={playFugue}
                aria-pressed={playing}
                title="Sweep the needle across the full score and play all five notes"
              >
                <span className="fugue__play-ico" aria-hidden="true">
                  {playing ? "■" : "▶"}
                </span>
                {playing ? "Stop" : "Play the fugue"}
              </button>
              <button type="button" className={`fugue__sound${sound ? " is-on" : ""}`} onClick={toggleSound} aria-pressed={sound}>
                <span className="fugue__sound-led" /> Sound {sound ? "on" : "off"}
              </button>
              <button
                type="button"
                className="fugue__sound"
                onClick={() => {
                  setPlaying(false);
                  setSolo(null);
                  setPos(2.6 / TOTAL);
                }}
              >
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
