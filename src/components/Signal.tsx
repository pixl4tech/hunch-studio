import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { Organism } from "./Organism";
import { Marquee } from "./chrome";
import { onTick } from "../lib/ticker";
import { useNow } from "../lib/hooks";
import { scrollTo } from "../lib/scroll";
import { PLATE_DATA, PLATE_ORDER } from "../content/data";
import { Rich, useI18n } from "../i18n";

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
  const { c, fmt } = useI18n();
  const time = useNow("Europe/Amsterdam", fmt.intl);
  return (
    <header className="masthead">
      <div className="masthead__row">
        <div className="masthead__brand">
          HUNCH
          <span className="reg">®</span>
          <span className="masthead__sub">{c.signal.masthead.tagline}</span>
        </div>
        <span className="masthead__line">{c.signal.masthead.issue}</span>
        <span className="masthead__line">{c.signal.masthead.location}</span>
      </div>
      <div className="masthead__strip">
        <span>
          <Rich text={c.signal.masthead.strip1} />
        </span>
        <span>{c.signal.masthead.strip2}</span>
        <span className="masthead__clock">
          {c.signal.masthead.studioTime} <b>{time}</b>
          <span className="masthead__cet"> {c.signal.masthead.cet}</span>
        </span>
      </div>
    </header>
  );
}



export function Signal() {
  const { c, fill } = useI18n();
  return (
    <section className="plate stock-ink signal" id="signal" aria-labelledby="signal-title">
      <div className="shell">
        <Masthead />

        <div className="signal__top">
          <div className="signal__type">
            <div className="signal__meta">
              <p className="eyebrow">
                <span className="tick" />
                <span className="lit">{c.signal.eyebrow.plate}</span>
                <span className="sep">/</span>
                <span>{c.signal.eyebrow.section}</span>
                <span className="sep">/</span>
                <span>{c.signal.eyebrow.live}</span>
              </p>
              <div className="signal__scope">
                <Seismograph />
                <span className="mono">87.6 FM</span>
              </div>
            </div>

            <h1 className="signal__h1" id="signal-title">
              <InkLine index={0}>
                <span className="word">{c.signal.titleTop}</span>
              </InkLine>
              <InkLine index={1} className="ink-line--two">
                <span className="serif by">{c.signal.titleBy}</span> <span className="word">{c.signal.titleBottom}</span>
                <span className="period">.</span>
              </InkLine>
            </h1>

            <div className="signal__under">
              <p className="mono signal__micro">
                <span className="dot-live" />
                {c.signal.micro}
              </p>
              <button type="button" className="signal__inline" data-sfx="page" onClick={() => scrollTo("#bench")}>
                {c.signal.start} <span aria-hidden="true">↗</span>
              </button>
            </div>

            <nav className="contents" aria-label={c.signal.contents.aria}>
              <div className="contents__label">
                <span>{c.signal.contents.label}</span>
                <span>{c.signal.contents.note}</span>
              </div>
              {PLATE_ORDER.map((id, i) => (
                <button
                  key={id}
                  type="button"
                  className="contents__row"
                  data-sfx="tick"
                  aria-current={i === 0}
                  onClick={() => scrollTo(`#${id}`)}
                >
                  <span className="contents__no">{PLATE_DATA[id].no}</span>
                  <span className="contents__name">{c.plates[id].label}</span>
                  <span className="contents__dots" aria-hidden="true" />
                  <span className="contents__note">{c.plates[id].note}</span>
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
            <Rich text={c.signal.lede} />
          </p>

          <div className="signal__col">
            <p className="body-copy">
              <Rich text={c.signal.body} />
            </p>
            <p className="footnote">
              {c.signal.footnote}
            </p>
          </div>

          <div className="signal__cta">
            <button
              type="button"
              className="btn btn--fill"
              data-sfx="page"
              onClick={() => scrollTo("#bench")}
              data-cursor={c.chrome.cursor.openLine}
            >
              {c.signal.cta1} <span className="arw">↗</span>
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              data-sfx="tick"
              onClick={() => scrollTo("#bin")}
              data-cursor={c.chrome.cursor.evidence}
            >
              {c.signal.cta2} <span className="arw">↓</span>
            </button>
            <div className="signal__stamp-wrap">
              <span className="stamp">{c.signal.stamp}</span>
            </div>
          </div>
        </div>

        <div className="readouts">
          {c.signal.readouts.map((r) => (
            <div className="readout" key={r.label}>
              <span className="readout__label">{r.label}</span>
              <span className="readout__value">
                {r.value}
                <small>{r.small}</small>
              </span>
            </div>
          ))}
        </div>

        <span className="marginalia signal__marginalia" aria-hidden="true">
          {c.signal.marginalia}
        </span>
      </div>

      <div className="signal__ticker">
        <Marquee items={c.signal.ticker} />
        <span className="signal__ticker-tag mono">{c.signal.tickerTag}</span>
      </div>
    </section>
  );
}
