import { useEffect, useRef, useState, type CSSProperties } from "react";
import { playSfx } from "../lib/sfx";
import { BIN_DATA, BIN_DROPS, BIN_IDS, BIN_TILTS } from "../content/data";
import { Rich, useI18n } from "../i18n";

export function Bin() {
  const { c, fill } = useI18n();
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState<number | null>(null);
  const drag = useRef({ down: false, x: 0, left: 0, moved: 0 });

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let raf = 0;
    const paint = () => {
      const max = el.scrollWidth - el.clientWidth;
      const p = max > 0 ? el.scrollLeft / max : 0;
      if (barRef.current) barRef.current.style.setProperty("--bin-p", String(p));
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    paint();

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      drag.current = { down: true, x: e.clientX, left: el.scrollLeft, moved: 0 };
      el.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!drag.current.down) return;
      const dx = e.clientX - drag.current.x;
      drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
      if (drag.current.moved > 2) playSfx("paperDrag");
      el.scrollLeft = drag.current.left - dx;
    };
    const onUp = () => {
      if (drag.current.moved > 10) playSfx("paper");
      drag.current.down = false;
      el.style.cursor = "";
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const nudge = (dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.64, 560), behavior: "smooth" });
  };

  const toggle = (i: number) => {
    if (drag.current.moved > 10) {
      drag.current.moved = 0;
      return;
    }
    setFlipped((f) => (f === i ? null : i));
  };

  return (
    <section className="plate stock-ink bin" id="bin" aria-labelledby="bin-title">
      <span className="folio" aria-hidden="true">
        01
      </span>
      <div className="shell plate-pad bin__pad">
        <header className="bin__head">
          <div className="bin__intro">
            <p className="eyebrow">
              <span className="tick" />
              <span className="lit">{c.bin.eyebrow.plate}</span>
              <span className="sep">/</span>
              <span>{c.bin.eyebrow.section}</span>
              <span className="sep">/</span>
              <span>{c.bin.eyebrow.evidence}</span>
            </p>
            <h2 className="bin__title" id="bin-title">
              {c.bin.titleLine1}
              <br />
              <Rich text={c.bin.titleLine2} />
            </h2>
            <p className="lede bin__lede">
              {c.bin.lede}
            </p>
          </div>
          <aside className="bin__aside">
            <p className="bin__aside-copy">
              {c.bin.aside}
            </p>
            <span className="stamp">{c.bin.stamp}</span>
            <p className="footnote">
              {c.bin.footnote}
            </p>
          </aside>
        </header>
      </div>

      <div className="bin__table" data-cursor={c.chrome.cursor.dragFilm}>
        <div className="bin__toolbar shell">
          <div className="bin__toolbar-left">
            <span className="mono">{c.bin.table}</span>
            <span className="bin__hint mono">{c.bin.hint}</span>
          </div>
          <div className="bin__nav">
            <button type="button" className="bin__arrow" data-sfx="tick" onClick={() => nudge(-1)} aria-label={c.bin.prev}>
              ←
            </button>
            <button type="button" className="bin__arrow" data-sfx="tick" onClick={() => nudge(1)} aria-label={c.bin.next}>
              →
            </button>
          </div>
        </div>

        <div className="bin__track" ref={trackRef}>
          {BIN_IDS.map((id, i) => {
            const item = { ...BIN_DATA[id], ...c.bin.items[id], id };
            return (
            <button
              key={id}
              type="button"
              className="bin-card"
              data-sfx="paper"
              style={{ "--tilt": `${BIN_TILTS[i]}deg`, "--drop": `${BIN_DROPS[i]}px` } as CSSProperties}
              aria-pressed={flipped === i}
              aria-label={fill(c.bin.card.aria, { title: item.title, version: item.version })}
              onClick={() => toggle(i)}
              data-cursor={flipped === i ? c.chrome.cursor.flipBack : c.chrome.cursor.readAutopsy}
            >
              <span className="bin-card__tape" aria-hidden="true">{c.bin.card.tape}</span>
              <span className="bin-card__inner">
                <span className="bin-card__face bin-card__front">
                  <span className="bin-card__top">
                    <span className="bin-card__no">{c.bin.card.no} {String(i + 1).padStart(3, "0")}</span>
                    <span className="bin-card__ver">{item.version}</span>
                  </span>
                  <span className="bin-card__title">{item.title}</span>
                  <span className="bin-card__status">
                    {item.status} <i>/</i> {item.life}
                  </span>
                  <span className="bin-card__brief">{item.brief}</span>
                  <span className="bin-card__diff">
                    {item.diff.map((line, j) => (
                      <span key={j} className={line.startsWith("+") ? "plus" : line.startsWith("-") ? "minus" : "comment"}>
                        {line}
                      </span>
                    ))}
                  </span>
                  <span className="bin-card__foot">
                    <span className="mono">{c.bin.card.open}</span>
                    <span className="bin-card__flipicon" aria-hidden="true">
                      ⤿
                    </span>
                  </span>
                  <span className="bin-card__stamp" aria-hidden="true">
                    {item.mark}
                  </span>
                  <span className="bin-card__punch" aria-hidden="true" />
                </span>

                <span className="bin-card__face bin-card__back">
                  <span className="bin-card__back-head">
                    <span className="mono">{c.bin.card.autopsy} {String(i + 1).padStart(3, "0")}</span>
                    <span className="bin-card__cross" aria-hidden="true">
                      ✕
                    </span>
                  </span>
                  <span className="bin-card__autopsy">{item.autopsy}</span>
                  <span className="bin-card__survived">
                    <span className="mono">{c.bin.card.survived}</span>
                    <span>{item.survived}</span>
                  </span>
                  <span className="bin-card__back-foot">
                    <span className="mono">{c.bin.card.back}</span>
                    <span aria-hidden="true">↺</span>
                  </span>
                </span>
              </span>
            </button>
          )})}

          <div className="bin__blank" aria-hidden="true">
            <span className="mono">{c.bin.card.end}</span>
            <span className="bin__blank-mark">☐</span>
            <p>{c.bin.card.endCopy}</p>
          </div>
        </div>

        <div className="bin__barwrap shell">
          <div className="bin__bar" ref={barRef} style={{ "--bin-p": 0 } as CSSProperties}>
            <div className="bin__bar-fill" />
            <div className="bin__bar-thumb" />
          </div>
          <span className="mono bin__bar-label">{c.bin.card.bar}</span>
        </div>
      </div>
    </section>
  );
}
