import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { playSfx } from "../lib/sfx";
import { CHANNEL_DATA, CHANNEL_IDS } from "../content/data";
import { Rich, useI18n } from "../i18n";

const DIAL_SPAN = 240;
const STEP = DIAL_SPAN / (CHANNEL_IDS.length - 1);
const angleFor = (i: number) => -DIAL_SPAN / 2 + i * STEP;

function ticks() {
  const out: { a: number; major: boolean }[] = [];
  for (let a = -120; a <= 120; a += 6) {
    out.push({ a, major: a % 48 === 0 });
  }
  return out;
}

export function Seance() {
  const { c, fill, fmt } = useI18n();
  const channels = CHANNEL_IDS.map((id) => ({ id, ...CHANNEL_DATA[id], ...c.seance.channels[id] }));
  const [idx, setIdx] = useState(0);
  const [tuning, setTuning] = useState(false);
  const [scan, setScan] = useState(false);
  const dialRef = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const tuner = useRef<number>(0);
  const noiseRef = useRef<HTMLDivElement>(null);

  const channel = channels[idx];
  const knobAngle = angleFor(idx);

  const tune = (next: number, byUser = true) => {
    const n = (next + channels.length) % channels.length;
    if (byUser) {
      setScan(false);
      playSfx("dial");
    }
    if (n === idx) return;
    setIdx(n);
    setTuning(true);
    window.clearTimeout(tuner.current);
    tuner.current = window.setTimeout(() => setTuning(false), 420);
  };

  useEffect(() => {
    if (!scan) return;
    const t = window.setTimeout(() => tune((idx + 1) % channels.length, false), 2100);
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
              <span className="lit">{c.seance.eyebrow.plate}</span>
              <span className="sep">/</span>
              <span>{c.seance.eyebrow.section}</span>
              <span className="sep">/</span>
              <span>{c.seance.eyebrow.transmissions}</span>
            </p>
            <h2 className="seance__title" id="seance-title">
              {c.seance.title1}
              <br />
              <Rich text={c.seance.title2} />
            </h2>
          </div>
          <div className="seance__head-note">
            <p className="lede">
              {c.seance.lede}
            </p>
            <div className="seance__head-meta">
              <span className="stamp seance__onair">{c.seance.onAir}</span>
              <span className="mono">{c.seance.receiver}</span>
            </div>
          </div>
        </header>

        <div className="seance__console">
          <div className="receiver">
            <div className="receiver__head">
              <span className="mono">{c.seance.head.model}</span>
              <span className="mono">{c.seance.head.fm}</span>
            </div>

            <div
              className="receiver__dial"
              ref={dialRef}
              role="slider"
              tabIndex={0}
              aria-label={c.seance.dial.aria}
              aria-valuemin={1}
              aria-valuemax={channels.length}
              aria-valuenow={idx + 1}
              aria-valuetext={fill(c.seance.dial.value, { freq: fmt.number(channel.freq, 1), station: channel.station })}
              onPointerDown={onDialDown}
              onPointerMove={onDialMove}
              onPointerUp={onDialUp}
              onPointerCancel={onDialUp}
              onKeyDown={onDialKey}
              data-sfx="dial"
              data-cursor={c.chrome.cursor.turnDial}
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
                {channels.map((c, i) => {
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
                        {fmt.number(c.freq, 1)}
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

              <span className="receiver__dial-label mono">{c.seance.dial.label}</span>
            </div>

            <div className="receiver__readout">
              <div className="receiver__freq">
                <span className="mono">FM</span>
                <span className="receiver__freq-num">{channel.freq.toFixed(1)}</span>
                <span className="mono">MHz</span>
              </div>
              <div className="receiver__signal">
                <span className="mono">{fill(c.seance.readout.signal, { strength: channel.strength })}</span>
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
              <span className="mono">{fill(c.seance.readout.station, { no: channel.no })}</span>
              <b>{channel.station}</b>
            </div>

            <div className="receiver__controls">
              <button type="button" className="receiver__btn" onClick={() => tune(idx - 1)} aria-label={c.seance.dial.prev}>
                ← {c.seance.dial.prev}
              </button>
              <button
                type="button"
                className="receiver__btn receiver__btn--scan"
                data-sfx="relay"
                onClick={() => setScan((s) => !s)}
                aria-pressed={scan}
              >
                {scan ? c.seance.dial.stop : c.seance.dial.scan}
              </button>
              <button type="button" className="receiver__btn" onClick={() => tune(idx + 1)} aria-label={c.seance.dial.next}>
                {c.seance.dial.next} →
              </button>
            </div>

            <div className="receiver__grille" aria-hidden="true" />
          </div>

          <div className={`transmission${tuning ? " is-tuning" : ""}`} aria-live="polite">
            <div className="transmission__head">
              <span className="mono">
                <span className="dot-live" style={{ background: "var(--lime)" }} /> {c.seance.transmission.locked}
              </span>
              <span className="mono">{channel.rec}</span>
              <span className="mono">{c.seance.transmission.sideA}</span>
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
              <span className="mono">{c.seance.transmission.edited}</span>
              <span className="mono">{fill(c.seance.transmission.frequency, { freq: fmt.number(channel.freq, 1) })}</span>
            </div>

            <div className="channels" role="group" aria-label={c.seance.transmission.channels}>
              {channels.map((c, i) => (
                <button
                  key={c.no}
                  type="button"
                  className={`channel${i === idx ? " is-on" : ""}`}
                  onClick={() => tune(i)}
                  aria-pressed={i === idx}
                >
                  <span className="channel__no mono">CH {c.no}</span>
                  <span className="channel__station">{c.station}</span>
                  <span className="channel__freq mono">{fmt.number(c.freq, 1)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="seance__foot">
          <p className="seance__side">
            <Rich text={c.seance.foot.side} />
          </p>
          <p className="footnote">
            {c.seance.foot.footnote}
          </p>
          <span className="stamp seance__stamp">{c.seance.foot.stamp}</span>
        </div>
      </div>
    </section>
  );
}
