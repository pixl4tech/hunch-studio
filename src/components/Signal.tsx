import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { Organism } from "./Organism";
import { Marquee } from "./chrome";
import { onTick } from "../lib/ticker";
import { useNow } from "../lib/hooks";
import { scrollTo } from "../lib/scroll";
import { PLATES } from "../lib/plates";

function Seismograph() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let phase = 0;
    let lastScroll = window.scrollY;
    let energy = 0;
    let prevX = 0;
    let prevY = 0;

    const stop = onTick((_t, dt) => {
      const sy = window.scrollY;
      const v = Math.abs(sy - lastScroll);
      lastScroll = sy;
      energy += (v - energy) * 0.12;
      phase += dt * 3.4;
      const r = canvas.getBoundingClientRect();
      const w = r.width;
      const h = r.height;
      if (w === 0) return;
      const amp = 1.1 + Math.min(11, energy * 0.55);
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "#ff4d18";
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const edge = Math.sin((x / w) * Math.PI);
        const y =
          h / 2 +
          (Math.sin(x * 0.19 + phase * 2.6) * amp * 0.55 +
            Math.sin(x * 0.52 - phase * 1.3) * 1.2 +
            Math.sin(x * 0.07 + phase) * amp * 0.4) *
            edge;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        prevX = x;
        prevY = y;
      }
      ctx.stroke();
      // leading dot
      ctx.fillStyle = "#d8ff45";
      ctx.fillRect(prevX - 2, prevY - 2, 3, 3);
      // baseline hairline
      ctx.strokeStyle = "rgba(238,231,215,0.16)";
      ctx.beginPath();
      ctx.moveTo(0, h - 0.5);
      ctx.lineTo(w, h - 0.5);
      ctx.stroke();
    });

    return () => {
      stop();
      ro.disconnect();
    };
  }, []);
  return <canvas className="seismo" ref={ref} aria-hidden="true" />;
}

function InkLine({
  children,
  index,
  className = "",
}: {
  children: ReactNode;
  index: number;
  className?: string;
}) {
  return (
    <span className={`ink-line ${className}`} style={{ "--i": index } as CSSProperties}>
      <span className="ink-line__ghost" aria-hidden="true">
        {children}
      </span>
      <span className="ink-line__body">{children}</span>
    </span>
  );
}

function Masthead() {
  const time = useNow("Europe/Amsterdam");
  return (
    <header className="masthead">
      <div className="masthead__row">
        <div className="masthead__brand">
          HUNCH
          <span className="reg">®</span>
          <span className="masthead__sub">a studio for software with a pulse</span>
        </div>
        <span className="masthead__line">Issue 03 — The Feeling Issue — Winter</span>
        <span className="masthead__line">Rotterdam / 51.92°N</span>
      </div>
      <div className="masthead__strip">
        <span>
          <b>Two desks</b> · One kettle · No decks
        </span>
        <span>Est. 2023 · Independent since lunch</span>
        <span className="masthead__clock">
          Studio time <b>{time}</b>
          <span className="masthead__cet"> CET</span>
        </span>
      </div>
    </header>
  );
}

const ticker = [
  "a booking flow for a barber who hates forms",
  "a museum guide that remembers your name",
  "an internal tool with the vibe of a well-kept notebook",
  "a checkout that ends in one thumb",
  "a homepage that doesn’t shout",
  "a settings panel you can actually finish",
  "a font with a limp",
  "a bug that only happens on Tuesdays",
];

export function Signal() {
  return (
    <section className="plate stock-ink signal" id="signal" aria-labelledby="signal-title">
      <div className="shell">
        <Masthead />

        <div className="signal__top">
          <div className="signal__type">
            <div className="signal__meta">
              <p className="eyebrow">
                <span className="tick" />
                <span className="lit">Plate 00</span>
                <span className="sep">/</span>
                <span>The Signal</span>
                <span className="sep">/</span>
                <span>Live</span>
              </p>
              <div className="signal__scope">
                <Seismograph />
                <span className="mono">87.6 FM</span>
              </div>
            </div>

            <h1 className="signal__h1" id="signal-title">
              <InkLine index={0}>
                <span className="word">SOFTWARE</span>
              </InkLine>
              <InkLine index={1} className="ink-line--two">
                <span className="serif by">by</span> <span className="word">FEEL</span>
                <span className="period">.</span>
              </InkLine>
            </h1>

            <div className="signal__under">
              <p className="mono signal__micro">
                <span className="dot-live" />
                Accepting one build for February · Two desks · Zero decks
              </p>
              <button type="button" className="signal__inline" data-sfx="page" onClick={() => scrollTo("#bench")}>
                Start a hunch <span aria-hidden="true">↗</span>
              </button>
            </div>

            <nav className="contents" aria-label="Contents">
              <div className="contents__label">
                <span>Contents</span>
                <span>Eight plates / read in any order</span>
              </div>
              {PLATES.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  className="contents__row"
                  data-sfx="tick"
                  aria-current={i === 0}
                  onClick={() => scrollTo(`#${p.id}`)}
                >
                  <span className="contents__no">{p.no}</span>
                  <span className="contents__name">{p.label}</span>
                  <span className="contents__dots" aria-hidden="true" />
                  <span className="contents__note">{p.note}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="signal__stage">
            <Organism />
          </div>
        </div>

        <div className="signal__lower">
          <p className="lede signal__lede">
            HUNCH is a two-person studio for products that <em>feel like something.</em> We start
            with the feeling in the room, then build the smallest thing that produces it.
          </p>

          <div className="signal__col">
            <p className="body-copy">
              Most software is assembled. Ours is tuned — fewer screens, better seams, a sound where
              you didn’t expect one, copy that sounds like a person at 11pm.{" "}
              <strong>If a feature doesn’t change how the thing feels, we don’t ship the feature.</strong>
            </p>
            <p className="footnote">
              We are not a platform. We are a place. You can tell the difference by how long people
              stay.
            </p>
          </div>

          <div className="signal__cta">
            <button
              type="button"
              className="btn btn--fill"
              data-sfx="page"
              onClick={() => scrollTo("#bench")}
              data-cursor="OPEN A LINE"
            >
              Send us a hunch <span className="arw">↗</span>
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              data-sfx="tick"
              onClick={() => scrollTo("#bin")}
              data-cursor="EVIDENCE"
            >
              Open the bin <span className="arw">↓</span>
            </button>
            <div className="signal__stamp-wrap">
              <span className="stamp">Open for one good hunch</span>
            </div>
          </div>
        </div>

        <div className="readouts">
          <div className="readout">
            <span className="readout__label">
              <span className="dot-live" /> Current obsession
            </span>
            <span className="readout__value">
              the sound of a door
              <small>recorded on a Tuesday, 04:12</small>
            </span>
          </div>
          <div className="readout">
            <span className="readout__label">Next intake</span>
            <span className="readout__value">
              February — 2 slots
              <small>one sprint, one build</small>
            </span>
          </div>
          <div className="readout">
            <span className="readout__label">Average first loop</span>
            <span className="readout__value">
              72 hours
              <small>brief to something you can click</small>
            </span>
          </div>
          <div className="readout">
            <span className="readout__label">Kettle</span>
            <span className="readout__value">
              on
              <small>since 08:12, no complaints</small>
            </span>
          </div>
        </div>

        <span className="marginalia signal__marginalia" aria-hidden="true">
          The brief is usually wrong
        </span>
      </div>

      <div className="signal__ticker">
        <Marquee items={ticker} />
        <span className="signal__ticker-tag mono">NOW IN THE STUDIO</span>
      </div>
    </section>
  );
}
