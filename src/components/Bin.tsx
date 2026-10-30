import { useEffect, useRef, useState, type CSSProperties } from "react";
import { playSfx } from "../lib/sfx";

type BinItem = {
  title: string;
  version: string;
  status: string;
  life: string;
  brief: string;
  diff: string[];
  autopsy: string;
  survived: string;
  mark: string;
};

const ITEMS: BinItem[] = [
  {
    title: "The Orb",
    version: "v0.0.1",
    status: "Killed",
    life: "after 11 days",
    brief:
      "A homepage that was one continuous 3D orb. You scrolled by rotating it. Everyone said ‘wow’. Nobody could find the pricing.",
    diff: ['- <section id="pricing">', '+ <orb spin="pricing">', "// wow: 10/10, find: 0/10"],
    autopsy:
      "We fell in love with the interaction and forgot the job. A homepage has a job. Ours had a hobby. We kept the orb — you’re looking at its descendant — and gave it a caption, a scroll bar, and a door.",
    survived: "the organism; the idea that a site can have a body",
    mark: "KILLED",
  },
  {
    title: "Ambient Pricing",
    version: "v0.3",
    status: "Killed",
    life: "by legal",
    brief:
      "Prices that moved with demand, weather and Mercury. Beautiful spreadsheet. Unreadable invoice. Users described it as ‘a vibe’ and ‘a threat’.",
    diff: ["- price = 18000", "+ price = 18000 * weather", "+ price = 18000 * mercury"],
    autopsy:
      "Feel is not the same as fairness. Pricing is a promise, not an atmosphere. We now write prices in one font, one size, and never animate them. The weather feed still runs in the studio, for morale.",
    survived: "the ticket metaphor; a price you can hold",
    mark: "KILLED",
  },
  {
    title: "Cursor: The Character",
    version: "v1.2",
    status: "Haunting",
    life: "still in the drawer",
    brief:
      "Our cursor had a backstory, a gait and a small hat. After forty minutes it got tired. So did the users.",
    diff: ["+ cursor: url(hat.svg), wait;", "- * { cursor: default }", "// hat removed in v1.2"],
    autopsy:
      "Charm has a budget. We spent it on the cursor and had none left for the buttons. The hat is in the drawer. The gait survived as the lag on this site’s registration mark — slower than you’d expect, on purpose.",
    survived: "the registration-mark cursor you’re using right now",
    mark: "HAUNTING",
  },
  {
    title: "The Nine-Minute Onboarding",
    version: "v2.0",
    status: "Killed",
    life: "by the clock",
    brief:
      "A guided breathing exercise before account creation. Retention: up. Signups: down 91%. Support tickets: ‘is this a test?’",
    diff: ["- signup.submit()", "+ breathe(540); then signup", "// inhale… exhale… churn"],
    autopsy:
      "We optimised the feeling after onboarding, not the feeling of onboarding. People don’t want to be calmed into a product; they want to be let in. The first run is now nine seconds and one good question.",
    survived: "a single opening question; everything else waits",
    mark: "KILLED",
  },
  {
    title: "Navigation by Sound Only",
    version: "v0.7",
    status: "Retired",
    life: "one user cried",
    brief:
      "Five tones, one per section. You learned the site by ear. Genuinely faster. Also unusable on a train, in an office, or near a baby.",
    diff: ['- <a href="/work">Work</a>', "+ playTone(440); // Work", "// works until it doesn’t"],
    autopsy:
      "A modality is not an interface. We still hide one tone in the site — try the fugue’s sound toggle — but we stopped making ears mandatory. The user who cried sent us a postcard.",
    survived: "the optional tone in THE FUGUE; a postcard on the wall",
    mark: "ONE TEAR",
  },
  {
    title: "The Infinite Footer",
    version: "v1.0",
    status: "Running",
    life: "somewhere, still",
    brief:
      "A footer that generated a new row every time you reached the bottom. It was ‘endless brand’. It was also 4,000 words about our values.",
    diff: ["while (scrolled) { append(values) }", "// bottom = new top", "// please stop"],
    autopsy:
      "We mistook stamina for substance. Nobody has that much attention. We cut it to a colophon, a barcode and one good sentence. This card is the last row. You’re welcome.",
    survived: "the colophon; the barcode; this sentence",
    mark: "STILL ON",
  },
];

const tilts = [-2.4, 1.6, -1.1, 2.2, -1.8, 1.2];
const drops = [14, 0, 26, 6, 20, 2];

export function Bin() {
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
              <span className="lit">Plate 01</span>
              <span className="sep">/</span>
              <span>The Bin</span>
              <span className="sep">/</span>
              <span>Evidence</span>
            </p>
            <h2 className="bin__title" id="bin-title">
              Half our work
              <br />
              is <em>deleted.</em>
            </h2>
            <p className="lede bin__lede">
              A studio that only shows the finished thing is lying to you. Below: six versions we
              built, tested and killed. Flip one over and read the autopsy.
            </p>
          </div>
          <aside className="bin__aside">
            <p className="bin__aside-copy">
              The bin is the most honest page on this site. It is also the only one with a lamp.
            </p>
            <span className="stamp">No survivors</span>
            <p className="footnote">
              Specimens 001–006 / kept at room temperature / do not feed
            </p>
          </aside>
        </header>
      </div>

      <div className="bin__table" data-cursor="DRAG THE FILM">
        <div className="bin__toolbar shell">
          <div className="bin__toolbar-left">
            <span className="mono">Light table / 6 specimens / one lamp</span>
            <span className="bin__hint mono">Drag ↔ or click a card to flip</span>
          </div>
          <div className="bin__nav">
            <button type="button" className="bin__arrow" data-sfx="tick" onClick={() => nudge(-1)} aria-label="Previous specimen">
              ←
            </button>
            <button type="button" className="bin__arrow" data-sfx="tick" onClick={() => nudge(1)} aria-label="Next specimen">
              →
            </button>
          </div>
        </div>

        <div className="bin__track" ref={trackRef}>
          {ITEMS.map((item, i) => (
            <button
              key={item.title}
              type="button"
              className="bin-card"
              data-sfx="paper"
              style={{ "--tilt": `${tilts[i]}deg`, "--drop": `${drops[i]}px` } as CSSProperties}
              aria-pressed={flipped === i}
              aria-label={`${item.title}, ${item.version}. Flip to read the autopsy.`}
              onClick={() => toggle(i)}
              data-cursor={flipped === i ? "FLIP BACK" : "READ THE AUTOPSY"}
            >
              <span className="bin-card__tape" aria-hidden="true">Do not revive</span>
              <span className="bin-card__inner">
                <span className="bin-card__face bin-card__front">
                  <span className="bin-card__top">
                    <span className="bin-card__no">BIN Nº {String(i + 1).padStart(3, "0")}</span>
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
                    <span className="mono">Open the autopsy</span>
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
                    <span className="mono">Autopsy / {String(i + 1).padStart(3, "0")}</span>
                    <span className="bin-card__cross" aria-hidden="true">
                      ✕
                    </span>
                  </span>
                  <span className="bin-card__autopsy">{item.autopsy}</span>
                  <span className="bin-card__survived">
                    <span className="mono">What survived</span>
                    <span>{item.survived}</span>
                  </span>
                  <span className="bin-card__back-foot">
                    <span className="mono">Return to the bin</span>
                    <span aria-hidden="true">↺</span>
                  </span>
                </span>
              </span>
            </button>
          ))}

          <div className="bin__blank" aria-hidden="true">
            <span className="mono">End of drawer</span>
            <span className="bin__blank-mark">☐</span>
            <p>There are more. They’re in the actual drawer, under the kettle.</p>
          </div>
        </div>

        <div className="bin__barwrap shell">
          <div className="bin__bar" ref={barRef} style={{ "--bin-p": 0 } as CSSProperties}>
            <div className="bin__bar-fill" />
            <div className="bin__bar-thumb" />
          </div>
          <span className="mono bin__bar-label">Specimen 001 — 006</span>
        </div>
      </div>
    </section>
  );
}
