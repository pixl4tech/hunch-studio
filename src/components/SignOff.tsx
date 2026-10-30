import { useEffect, useRef, useState } from "react";
import { onTick } from "../lib/ticker";
import { scrollTo } from "../lib/scroll";
import { clamp } from "../lib/util";
import { playSfx } from "../lib/sfx";
import { Rich, useI18n } from "../i18n";

const EMAIL = "hello@hunch.studio";

export function SignOff() {
  const { c } = useI18n();
  const markRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const el = markRef.current;
    if (!el) return;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    let active = false;
    let visible = true;
    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
    });
    io.observe(el);
    const onMove = (e: PointerEvent) => {
      if (!visible) return;
      const r = el.getBoundingClientRect();
      tx = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1.2, 1.2);
      ty = clamp(((e.clientY - r.top) / r.height - 0.5) * 2, -1.2, 1.2);
      active = true;
    };
    const onLeave = () => {
      active = false;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    const stop = onTick((_t, dt) => {
      if (!visible) return;
      const k = 1 - Math.pow(0.002, dt);
      const goalX = active ? tx : 0;
      const goalY = active ? ty : 0;
      x += (goalX - x) * k;
      y += (goalY - y) * k;
      el.style.setProperty("--mx", x.toFixed(3));
      el.style.setProperty("--my", y.toFixed(3));
    });
    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="plate stock-ink signoff" id="signoff" aria-labelledby="signoff-title">
      <div className="shell signoff__top">
        <div className="signoff__kicker">
          <p className="eyebrow">
            <span className="tick" />
            <span className="lit">{c.signoff.eyebrow.plate}</span>
            <span className="sep">/</span>
            <span>{c.signoff.eyebrow.section}</span>
            <span className="sep">/</span>
            <span>{c.signoff.eyebrow.end}</span>
          </p>
          <span className="mono signoff__issue">{c.signoff.issue}</span>
        </div>

        <div className="signoff__mark" ref={markRef} data-cursor={c.chrome.cursor.misprint} onPointerEnter={() => playSfx("ink")}>
          <span className="signoff__layer signoff__layer--blue" aria-hidden="true">
            HUNCH
          </span>
          <span className="signoff__layer signoff__layer--orange" aria-hidden="true">
            HUNCH
          </span>
          <h2 className="signoff__word" id="signoff-title">
            HUNCH<span className="signoff__reg">®</span>
          </h2>
          <span className="signoff__subword" data-place={c.signoff.place}>{c.signoff.subword}</span>
        </div>

        <div className="signoff__close">
          <p className="signoff__last">
            <Rich text={c.signoff.last} />
          </p>
          <div className="signoff__actions">
            <a className="btn btn--fill signoff__mail" data-sfx="paper" href={`mailto:${EMAIL}`}>
              {c.signoff.mail} <span className="arw">↗</span>
            </a>
            <button type="button" className="btn btn--ghost" data-sfx="success" onClick={copy}>
              {copied ? c.signoff.copied : c.signoff.copy}
            </button>
            <button type="button" className="btn btn--ghost" data-sfx="page" onClick={() => scrollTo("#signal", -10)}>
              {c.signoff.back} <span className="arw">↑</span>
            </button>
          </div>
          <div className="signoff__close-meta">
            <span className="mono">{c.signoff.closeMeta1}</span>
            <span className="mono">{c.signoff.closeMeta2}</span>
          </div>
        </div>
      </div>

      <div className="shell signoff__colophon">
        <div className="signoff__col">
          <span className="signoff__col-label mono">{c.signoff.colophon.studio}</span>
          <p>{c.signoff.colophon.studioName}<br />{c.signoff.colophon.studioPlace}</p>
          <p className="signoff__sm">{c.signoff.colophon.studioNote}</p>
        </div>
        <div className="signoff__col">
          <span className="signoff__col-label mono">{c.signoff.colophon.contact}</span>
          <p>
            <a className="link" href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
          </p>
          <p className="signoff__sm">{c.signoff.colophon.contactNote}</p>
        </div>
        <div className="signoff__col">
          <span className="signoff__col-label mono">{c.signoff.colophon.credits}</span>
          <p className="signoff__sm">{c.signoff.colophon.creditsBody}</p>
          <p className="signoff__sm signoff__model">
            {c.signoff.colophon.model1}<br />
            {c.signoff.colophon.model2}<br />
            {c.signoff.colophon.model3}
          </p>
        </div>
        <div className="signoff__col">
          <span className="signoff__col-label mono">{c.signoff.colophon.legal}</span>
          <p className="signoff__sm">{c.signoff.colophon.legalBody}</p>
          <p className="signoff__sm signoff__fiction">{c.signoff.colophon.fiction}</p>
        </div>

        <div className="signoff__seal">
          <div className="seal">
            <svg viewBox="0 0 120 120" className="seal__svg" aria-hidden="true">
              <defs>
                <path id="seal-path" d="M 60 60 m -44 0 a 44 44 0 1 1 88 0 a 44 44 0 1 1 -88 0" />
              </defs>
              <circle cx="60" cy="60" r="56" fill="none" stroke="rgba(238,231,215,0.28)" />
              <circle cx="60" cy="60" r="50.5" fill="none" stroke="rgba(238,231,215,0.16)" />
              <g className="seal__ring">
                <text fontFamily="JetBrains Mono Variable, monospace" fontSize="6.4" fill="rgba(238,231,215,0.6)" letterSpacing="1.9">
                  <textPath href="#seal-path" startOffset="0">
                    {c.signoff.seal.ring}
                  </textPath>
                </text>
              </g>
            </svg>
            <span className="seal__center">03</span>
          </div>
          <span className="mono seal__label">{c.signoff.seal.label}</span>
        </div>

        <div className="signoff__barcode">
          <span className="mono signoff__bc-label">{c.signoff.barcode.label}</span>
          <span className="barcode signoff__bars" aria-hidden="true">
            {Array.from({ length: 46 }).map((_, i) => (
              <i
                key={i}
                style={{
                  width: i % 7 === 0 ? 3 : i % 4 === 0 ? 2 : 1,
                  height: `${60 + ((i * 37) % 40)}%`,
                }}
              />
            ))}
          </span>
          <span className="mono signoff__bc-mid">{c.signoff.barcode.mid}</span>
          <span className="mono signoff__bc-num">{c.signoff.barcode.num}</span>
        </div>
      </div>

      <div className="signoff__end">
        <div className="shell signoff__end-inner">
          <p className="signoff__hand"><Rich text={c.signoff.end.hand} /></p>
          <p className="signoff__tiny mono">
            {c.signoff.end.tiny}
          </p>
          <button type="button" className="signoff__top-btn mono" data-sfx="page" onClick={() => scrollTo("#signal", -10)}>
            {c.signoff.end.top}
          </button>
        </div>
      </div>
    </section>
  );
}
