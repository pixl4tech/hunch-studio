import { useEffect, useRef, useState } from "react";
import { onTick } from "../lib/ticker";
import { scrollTo } from "../lib/scroll";
import { clamp } from "../lib/util";
import { playSfx } from "../lib/sfx";

const EMAIL = "hello@hunch.studio";

export function SignOff() {
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
    const onMove = (e: PointerEvent) => {
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
            <span className="lit">Plate 07</span>
            <span className="sep">/</span>
            <span>Sign-off</span>
            <span className="sep">/</span>
            <span>End of issue</span>
          </p>
          <span className="mono signoff__issue">Issue 03 · 500 copies · of which one is online</span>
        </div>

        <div className="signoff__mark" ref={markRef} data-cursor="MISPRINT" onPointerEnter={() => playSfx("ink")}>
          <span className="signoff__layer signoff__layer--blue" aria-hidden="true">
            HUNCH
          </span>
          <span className="signoff__layer signoff__layer--orange" aria-hidden="true">
            HUNCH
          </span>
          <h2 className="signoff__word" id="signoff-title">
            HUNCH<span className="signoff__reg">®</span>
          </h2>
          <span className="signoff__subword">A studio for software with a pulse</span>
        </div>

        <div className="signoff__close">
          <p className="signoff__last">
            That’s the issue. <em>The studio is still open.</em>
          </p>
          <div className="signoff__actions">
            <a className="btn btn--fill signoff__mail" data-sfx="paper" href={`mailto:${EMAIL}`}>
              Tell us a hunch <span className="arw">↗</span>
            </a>
            <button type="button" className="btn btn--ghost" data-sfx="success" onClick={copy}>
              {copied ? "Address copied ✓" : "Copy the address"}
            </button>
            <button type="button" className="btn btn--ghost" data-sfx="page" onClick={() => scrollTo("#signal", -10)}>
              Back to the cover <span className="arw">↑</span>
            </button>
          </div>
          <div className="signoff__close-meta">
            <span className="mono">Two desks · one kettle · no decks</span>
            <span className="mono">Rotterdam / 51.92°N 4.48°E</span>
          </div>
        </div>
      </div>

      <div className="shell signoff__colophon">
        <div className="signoff__col">
          <span className="signoff__col-label mono">Studio</span>
          <p>HUNCH Studio<br />Rotterdam, NL</p>
          <p className="signoff__sm">Two desks, one kettle.<br />Open Tue—Thu, 09:00—18:00 CET.<br />Closed in August, like a proper studio.</p>
        </div>
        <div className="signoff__col">
          <span className="signoff__col-label mono">Contact</span>
          <p>
            <a className="link" href={`mailto:${EMAIL}`}>
              {EMAIL}
            </a>
          </p>
          <p className="signoff__sm">+31 6 0000 0000 (please don’t)<br />Signal: ask.<br />We answer around 09:00 CET.</p>
        </div>
        <div className="signoff__col">
          <span className="signoff__col-label mono">Credits</span>
          <p className="signoff__sm">
            Set in Bricolage Grotesque, Instrument Serif and JetBrains Mono. Built in a browser, by
            hand, on a laptop, on a train. No templates were harmed. The cursor is custom. So is the
            rest.
          </p>
          <p className="signoff__model mono">
            Made on DeepSeek V4.1 Flash 1017<br />
            maya-deepseek/deepseek-v4.1-flash · Maya-S · reasoning max
          </p>
        </div>
        <div className="signoff__col">
          <span className="signoff__col-label mono">Legal</span>
          <p className="signoff__sm">
            © 2026 HUNCH Studio<br />VAT NL000000000B01<br />“Synergy” used under protest.<br />Some
            feelings reserved.
          </p>
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
                    HUNCH STUDIO · SOFTWARE BY FEEL · ROTTERDAM · EST 2023 ·
                  </textPath>
                </text>
              </g>
            </svg>
            <span className="seal__center">03</span>
          </div>
          <span className="mono seal__label">The seal is not legally binding</span>
        </div>

        <div className="signoff__barcode">
          <span className="mono signoff__bc-label">HUNCH / issue 03 / 2026</span>
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
          <span className="mono signoff__bc-mid">Printed on the internet · not for resale</span>
          <span className="mono signoff__bc-num">5 900 123 987 003</span>
        </div>
      </div>

      <div className="signoff__end">
        <div className="shell signoff__end-inner">
          <p className="signoff__hand">Made by hand, <em>mostly.</em></p>
          <p className="signoff__tiny mono">
            Row 4,001 — this is where the footer ends. You’re welcome.
          </p>
          <button type="button" className="signoff__top-btn mono" data-sfx="page" onClick={() => scrollTo("#signal", -10)}>
            ↑ Back to the cover
          </button>
        </div>
      </div>
    </section>
  );
}
