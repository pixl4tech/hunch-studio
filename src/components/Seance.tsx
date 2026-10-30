import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";

type Channel = {
  no: string;
  freq: number;
  station: string;
  quote: string;
  who: string;
  role: string;
  rec: string;
  strength: number;
  wave: number[];
};

const CHANNELS: Channel[] = [
  {
    no: "01",
    freq: 88.1,
    station: "The Scheduler",
    quote:
      "We asked for a dashboard. They gave us a drawer that slides out when you need it. Nobody has opened the old dashboard since.",
    who: "M.",
    role: "founder / a scheduling tool",
    rec: "13:04:22 / 00:41",
    strength: 86,
    wave: [4, 12, 7, 20, 9, 15, 5, 22, 6, 13, 4, 18, 8, 11, 3, 17, 6, 21, 9, 12],
  },
  {
    no: "02",
    freq: 91.3,
    station: "The Freight Co.",
    quote:
      "The invoice said ‘one (1) loop, plus feelings.’ I signed it without reading the rest. The thing shipped on a Thursday. I still remember the Thursday.",
    who: "J.",
    role: "COO / a freight company that will remain anonymous",
    rec: "09:12:07 / 01:12",
    strength: 73,
    wave: [7, 4, 16, 9, 22, 5, 12, 18, 3, 10, 19, 6, 14, 4, 21, 8, 11, 17, 5, 13],
  },
  {
    no: "03",
    freq: 94.7,
    station: "The Members’ Club",
    quote:
      "Onboarding used to be a form. Now it’s four questions and a sound. Signups went sideways. In the good direction. We had to stop checking the dashboard hourly.",
    who: "R.",
    role: "head of product / a members’ club",
    rec: "17:48:13 / 00:58",
    strength: 91,
    wave: [9, 21, 12, 5, 18, 7, 22, 14, 4, 19, 8, 16, 3, 11, 20, 6, 13, 9, 17, 5],
  },
  {
    no: "04",
    freq: 99.5,
    station: "The Museum",
    quote:
      "They found a bug in our font. We didn’t know fonts could have bugs. They fixed our font. The guard noticed before we did.",
    who: "A.",
    role: "creative director / a museum",
    rec: "11:26:54 / 00:37",
    strength: 64,
    wave: [3, 14, 8, 19, 5, 12, 21, 7, 16, 4, 10, 18, 6, 13, 9, 20, 5, 15, 8, 11],
  },
  {
    no: "05",
    freq: 102.9,
    station: "The Bakery",
    quote:
      "I still don’t know how the checkout works. Neither do they, I think. It works anyway. The waiting list is now the website.",
    who: "T.",
    role: "owner / a bakery with a waiting list",
    rec: "06:03:41 / 00:29",
    strength: 58,
    wave: [6, 17, 4, 11, 20, 8, 14, 5, 18, 9, 12, 3, 21, 7, 15, 4, 19, 6, 10, 13],
  },
  {
    no: "06",
    freq: 107.1,
    station: "The Quiet One",
    quote:
      "They kept a version of the logo we rejected. It’s on the wall now. I like it more than the one we shipped. I didn’t tell them that.",
    who: "S.",
    role: "founder / a therapy platform",
    rec: "21:19:02 / 00:44",
    strength: 79,
    wave: [11, 4, 19, 7, 14, 22, 5, 12, 3, 18, 8, 15, 6, 20, 4, 13, 9, 17, 7, 10],
  },
];

const DIAL_SPAN = 240;
const STEP = DIAL_SPAN / (CHANNELS.length - 1);
const angleFor = (i: number) => -DIAL_SPAN / 2 + i * STEP;

function ticks() {
  const out: { a: number; major: boolean }[] = [];
  for (let a = -120; a <= 120; a += 6) {
    out.push({ a, major: a % 48 === 0 });
  }
  return out;
}

export function Seance() {
  const [idx, setIdx] = useState(0);
  const [tuning, setTuning] = useState(false);
  const [scan, setScan] = useState(false);
  const dialRef = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const tuner = useRef<number>(0);
  const noiseRef = useRef<HTMLDivElement>(null);

  const channel = CHANNELS[idx];
  const knobAngle = angleFor(idx);

  const tune = (next: number, byUser = true) => {
    const n = (next + CHANNELS.length) % CHANNELS.length;
    if (byUser) setScan(false);
    if (n === idx) return;
    setIdx(n);
    setTuning(true);
    window.clearTimeout(tuner.current);
    tuner.current = window.setTimeout(() => setTuning(false), 420);
  };

  useEffect(() => {
    if (!scan) return;
    const t = window.setTimeout(() => tune((idx + 1) % CHANNELS.length, false), 2100);
    return () => window.clearTimeout(t);
  }, [scan, idx]);

  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = 200;
    c.height = 120;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const d = ctx.createImageData(c.width, c.height);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = Math.random() * 255;
      d.data[i] = v;
      d.data[i + 1] = v;
      d.data[i + 2] = v;
      d.data[i + 3] = 255;
    }
    ctx.putImageData(d, 0, 0);
    if (noiseRef.current) noiseRef.current.style.backgroundImage = `url(${c.toDataURL()})`;
  }, []);

  const fromPointer = (e: ReactPointerEvent) => {
    const el = dialRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    if (Math.hypot(x, y) < 26) return;
    let deg = (Math.atan2(x, -y) * 180) / Math.PI;
    if (deg > 140) deg = 140;
    if (deg < -140) deg = -140;
    const clamped = Math.max(-120, Math.min(120, deg));
    const next = Math.round((clamped + 120) / STEP);
    tune(next);
  };

  const onDialDown = (e: ReactPointerEvent) => {
    drag.current = true;
    setScan(false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    fromPointer(e);
  };
  const onDialMove = (e: ReactPointerEvent) => {
    if (drag.current) fromPointer(e);
  };
  const onDialUp = () => {
    drag.current = false;
  };
  const onDialKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      tune(idx + 1);
    }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      tune(idx - 1);
    }
  };

  const polar = (deg: number, r: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [150 + Math.cos(rad) * r, 150 + Math.sin(rad) * r];
  };

  return (
    <section className="plate stock-ink seance" id="seance" aria-labelledby="seance-title">
      <span className="folio" aria-hidden="true">
        05
      </span>
      <div className="shell plate-pad">
        <header className="seance__head">
          <div>
            <p className="eyebrow">
              <span className="tick" style={{ background: "var(--lime)" }} />
              <span className="lit">Plate 05</span>
              <span className="sep">/</span>
              <span>The Séance</span>
              <span className="sep">/</span>
              <span>Transmissions</span>
            </p>
            <h2 className="seance__title" id="seance-title">
              Six frequencies,
              <br />
              <em>some static.</em>
            </h2>
          </div>
          <div className="seance__head-note">
            <p className="lede">
              Turn the dial. Six clients, six frequencies, lightly edited for swearing and length.
              The static is real. The names are not — mostly.
            </p>
            <div className="seance__head-meta">
              <span className="stamp seance__onair">On air</span>
              <span className="mono">Receiver Nº 05 / HUNCH FM / Stereo</span>
            </div>
          </div>
        </header>

        <div className="seance__console">
          <div className="receiver">
            <div className="receiver__head">
              <span className="mono">Hunch receiver / model 05</span>
              <span className="mono">FM · Stereo</span>
            </div>

            <div
              className="receiver__dial"
              ref={dialRef}
              role="slider"
              tabIndex={0}
              aria-label="Client channel"
              aria-valuemin={1}
              aria-valuemax={CHANNELS.length}
              aria-valuenow={idx + 1}
              aria-valuetext={`${channel.freq} FM, ${channel.station}`}
              onPointerDown={onDialDown}
              onPointerMove={onDialMove}
              onPointerUp={onDialUp}
              onPointerCancel={onDialUp}
              onKeyDown={onDialKey}
              data-cursor="TURN THE DIAL"
            >
              <svg className="receiver__face" viewBox="0 0 300 300" aria-hidden="true">
                <path
                  d="M 42 111 A 124 124 0 1 1 258 111"
                  fill="none"
                  stroke="rgba(13,12,10,0.28)"
                  strokeWidth="1"
                />
                {ticks().map(({ a, major }, i) => {
                  const [x1, y1] = polar(a, 121);
                  const [x2, y2] = polar(a, major ? 133 : 127);
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={major ? "#0d0c0a" : "rgba(13,12,10,0.4)"}
                      strokeWidth={major ? 1.2 : 0.7}
                    />
                  );
                })}
                {CHANNELS.map((c, i) => {
                  const a = angleFor(i);
                  const [x, y] = polar(a, 108);
                  return (
                    <g key={c.no}>
                      <text
                        x={x}
                        y={y}
                        textAnchor="middle"
                        fill={i === idx ? "#cf3a0c" : "rgba(13,12,10,0.45)"}
                        fontFamily="JetBrains Mono Variable, monospace"
                        fontSize="7"
                        letterSpacing="0.08em"
                      >
                        {c.freq}
                      </text>
                      <text
                        x={x}
                        y={y + 10}
                        textAnchor="middle"
                        fill={i === idx ? "#0d0c0a" : "rgba(13,12,10,0.28)"}
                        fontFamily="JetBrains Mono Variable, monospace"
                        fontSize="5.5"
                      >
                        {c.no}
                      </text>
                    </g>
                  );
                })}
                <circle cx="150" cy="150" r="90" fill="none" stroke="rgba(13,12,10,0.14)" />
              </svg>

              <div className="receiver__knob-wrap">
                <div className="receiver__knob" style={{ transform: `rotate(${knobAngle}deg)` }}>
                  <span className="receiver__knob-grip" />
                  <span className="receiver__knob-needle" />
                  <span className="receiver__knob-cap" />
                </div>
              </div>

              <span className="receiver__dial-label mono">drag / scroll arrows</span>
            </div>

            <div className="receiver__readout">
              <div className="receiver__freq">
                <span className="mono">FM</span>
                <span className="receiver__freq-num">{channel.freq.toFixed(1)}</span>
                <span className="mono">MHz</span>
              </div>
              <div className="receiver__signal">
                <span className="mono">Signal {channel.strength}%</span>
                <span className="receiver__bars" aria-hidden="true">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <i
                      key={i}
                      className={i < Math.round((channel.strength / 100) * 12) ? "is-on" : ""}
                    />
                  ))}
                </span>
              </div>
            </div>

            <div className="receiver__station">
              <span className="mono">Station {channel.no}</span>
              <b>{channel.station}</b>
            </div>

            <div className="receiver__controls">
              <button type="button" className="receiver__btn" onClick={() => tune(idx - 1)} aria-label="Previous channel">
                ← Tune
              </button>
              <button
                type="button"
                className="receiver__btn receiver__btn--scan"
                onClick={() => setScan((s) => !s)}
                aria-pressed={scan}
              >
                {scan ? "■ Stop" : "Scan ▶"}
              </button>
              <button type="button" className="receiver__btn" onClick={() => tune(idx + 1)} aria-label="Next channel">
                Tune →
              </button>
            </div>

            <div className="receiver__grille" aria-hidden="true" />
          </div>

          <div className={`transmission${tuning ? " is-tuning" : ""}`} aria-live="polite">
            <div className="transmission__head">
              <span className="mono">
                <span className="dot-live" style={{ background: "var(--lime)" }} /> Signal locked
              </span>
              <span className="mono">{channel.rec}</span>
              <span className="mono">Side A</span>
            </div>

            <div className="transmission__body">
              <div className="transmission__static" ref={noiseRef} aria-hidden="true" />
              <blockquote className="transmission__quote">
                <span className="transmission__mark" aria-hidden="true">“</span>
                {channel.quote}
              </blockquote>
              <div className="transmission__attr">
                <span className="transmission__who">— {channel.who}</span>
                <span className="transmission__role">{channel.role}</span>
              </div>
              <div className="transmission__wave" aria-hidden="true">
                {channel.wave.map((h, i) => (
                  <i key={i} style={{ height: `${h * 1.4}px` }} />
                ))}
              </div>
            </div>

            <div className="transmission__foot">
              <span className="mono">Transcript lightly edited for swearing</span>
              <span className="mono">Frequency {channel.freq.toFixed(1)}</span>
            </div>

            <div className="channels" role="group" aria-label="Channels">
              {CHANNELS.map((c, i) => (
                <button
                  key={c.no}
                  type="button"
                  className={`channel${i === idx ? " is-on" : ""}`}
                  onClick={() => tune(i)}
                  aria-pressed={i === idx}
                >
                  <span className="channel__no mono">CH {c.no}</span>
                  <span className="channel__station">{c.station}</span>
                  <span className="channel__freq mono">{c.freq}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="seance__foot">
          <p className="seance__side">
            Some clients are quiet on purpose. <em>We keep their names in the drawer with the cursor’s hat.</em>
          </p>
          <p className="footnote">
            Quotes are real, lightly trimmed. No logos were harmed. If you’re one of the six: hello,
            you can hear us again.
          </p>
          <span className="stamp seance__stamp">Side B</span>
        </div>
      </div>
    </section>
  );
}
