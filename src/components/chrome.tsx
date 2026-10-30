import { useCallback, useEffect, useRef, useState } from "react";
import { onTick } from "../lib/ticker";
import { clamp, prefersReducedMotion } from "../lib/util";
import { scrollTo } from "../lib/scroll";
import { useNow } from "../lib/hooks";

/* ------------------------------------------------------------------ */
/* Grain — generated once, laid over everything                        */
/* ------------------------------------------------------------------ */

export function Grain() {
  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = 190;
    c.height = 190;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const data = ctx.createImageData(c.width, c.height);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = 110 + Math.random() * 90;
      data.data[i] = v;
      data.data[i + 1] = v;
      data.data[i + 2] = v;
      data.data[i + 3] = 255;
    }
    ctx.putImageData(data, 0, 0);
    const grain = document.querySelector<HTMLElement>(".grain");
    if (grain) grain.style.backgroundImage = `url(${c.toDataURL()})`;
  }, []);
  return <div className="grain" aria-hidden="true" />;
}

/* ------------------------------------------------------------------ */
/* Registration-mark cursor                                            */
/* ------------------------------------------------------------------ */

export function Cursor() {
  const ref = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const label = labelRef.current;
    if (!el || !label) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine || prefersReducedMotion()) return;

    document.documentElement.classList.add("cursor-on");
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let lx = x;
    let ly = y;
    let active = false;
    let current = "";

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!el.hasAttribute("data-ready")) el.setAttribute("data-ready", "true");
    };
    const onOver = (e: PointerEvent) => {
      const t = e.target as HTMLElement | null;
      const host = t?.closest<HTMLElement>("[data-cursor]");
      const next = host?.getAttribute("data-cursor") ?? "";
      if (next !== current) {
        current = next;
        label.textContent = next;
        if (next) el.setAttribute("data-label", "true");
        else el.removeAttribute("data-label");
      }
    };
    const onDown = () => {
      active = true;
      el.setAttribute("data-active", "true");
    };
    const onUp = () => {
      active = false;
      el.removeAttribute("data-active");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointerleave", onUp);

    const ring = el.querySelector<HTMLElement>(".cursor__ring");

    const stop = onTick(() => {
      lx += (x - lx) * 0.17;
      ly += (y - ly) * 0.17;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (ring) {
        const s = active ? 1.5 : 1;
        ring.style.transform = `translate3d(${lx - x}px, ${ly - y}px, 0) scale(${s})`;
      }
    });

    return () => {
      stop();
      document.documentElement.classList.remove("cursor-on");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointerleave", onUp);
    };
  }, []);

  return (
    <div className="cursor" ref={ref} aria-hidden="true">
      <div className="cursor__ring" />
      <div className="cursor__cross" />
      <div className="cursor__label" ref={labelRef} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ink trail                                                           */
/* ------------------------------------------------------------------ */

type InkPoint = { x: number; y: number; w: number; hue: number };

export function InkTrail({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const pts: InkPoint[] = [];
    let px = 0;
    let py = 0;
    let lastMove = 0;
    let lastDraw = 0;

    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastMove < 8) return;
      lastMove = now;
      const dx = e.clientX - px;
      const dy = e.clientY - py;
      const speed = Math.hypot(dx, dy);
      px = e.clientX;
      py = e.clientY;
      if (pts.length > 140) pts.shift();
      pts.push({
        x: e.clientX,
        y: e.clientY,
        w: clamp(3 + speed * 0.32, 2.5, 26),
        hue: Math.random() < 0.16 ? 1 : 0,
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const stop = onTick((t) => {
      // dissolve
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.075)";
      ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = "source-over";

      if (pts.length < 2) return;
      // draw newest segments once, then let them dissolve
      if (t - lastDraw > 0.012) {
        lastDraw = t;
        for (let i = Math.max(1, pts.length - 10); i < pts.length; i++) {
          const a = pts[i - 1];
          const b = pts[i];
          ctx.strokeStyle = b.hue ? "rgba(34,56,245,0.42)" : "rgba(255,77,24,0.5)";
          ctx.lineWidth = b.w * 0.55;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
          // splatter
          if (Math.random() < 0.05) {
            ctx.fillStyle = b.hue ? "rgba(34,56,245,0.35)" : "rgba(255,77,24,0.4)";
            ctx.beginPath();
            ctx.arc(b.x + (Math.random() - 0.5) * b.w, b.y + (Math.random() - 0.5) * b.w, Math.random() * 2.4 + 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    });

    return () => {
      stop();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, [enabled]);

  return <canvas ref={ref} className="ink-layer" aria-hidden="true" />;
}

/* ------------------------------------------------------------------ */
/* Boot — the press warming up                                         */
/* ------------------------------------------------------------------ */

export function Boot({ onDone, onReveal }: { onDone: () => void; onReveal?: () => void }) {
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const done = useRef(false);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setProgress(100);
    onReveal?.();
    setLeaving(true);
    window.setTimeout(onDone, 880);
  }, [onDone, onReveal]);

  useEffect(() => {
    if (prefersReducedMotion()) {
      finish();
      return;
    }
    const start = performance.now();
    const duration = 1550;
    const id = window.setInterval(() => {
      const p = Math.floor(clamp((performance.now() - start) / duration) * 100);
      setProgress(p);
      if (p >= 100) {
        window.clearInterval(id);
        window.setTimeout(finish, 260);
      }
    }, 40);
    const skip = () => finish();
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("pointerdown", skip, { once: true });
    return () => {
      window.clearInterval(id);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [finish]);

  return (
    <div className="boot" data-leaving={leaving} aria-hidden={leaving}>
      <div className="boot__top">
        <div>
          <div className="boot__brand">HUNCH®</div>
          <div className="mono" style={{ marginTop: 8, color: "var(--muted-dark)" }}>
            PRINTING · ISSUE 03
          </div>
        </div>
        <div className="boot__marks" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>

      <div className="boot__mid">
        <div className="boot__count">
          {String(progress).padStart(3, "0")}
          <small>%</small>
        </div>
        <div className="boot__status">
          <span>Warming the ink</span>
          <div className="boot__bar">
            <i style={{ width: `${progress}%` }} />
          </div>
          <span>3 inks / bone stock</span>
        </div>
      </div>

      <div className="boot__bottom">
        <span>Press Nº 03 · Two desks · One kettle</span>
        <span>Sound off. Cursor on.</span>
        <button className="boot__skip" type="button" data-sfx="whoosh" onClick={finish}>
          Skip the ceremony ↗
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Print furniture                                                     */
/* ------------------------------------------------------------------ */

export function Marquee({ items }: { items: string[] }) {
  const Group = () => (
    <div className="marquee__group" aria-hidden="true">
      {items.map((item, i) => (
        <span className="marquee__item" key={i}>
          <span>{item}</span>
          <span className="ast">✳</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="marquee">
      <div className="marquee__track">
        <Group />
        <Group />
        <Group />
        <Group />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Instrument dock                                                     */
/* ------------------------------------------------------------------ */

export type PlateRef = { id: string; label: string; no: string };

export function Dock({
  plates,
  active,
  inkOn,
  onToggleInk,
  soundOn,
  musicOn,
  onToggleSound,
  onToggleMusic,
}: {
  plates: PlateRef[];
  active: number;
  inkOn: boolean;
  onToggleInk: () => void;
  soundOn: boolean;
  musicOn: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
}) {
  const dockRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLDivElement>(null);
  const [panel, setPanel] = useState(false);
  const time = useNow("Europe/Amsterdam");

  useEffect(() => {
    if (!panel) return;
    const onDown = (e: PointerEvent) => {
      if (!audioRef.current?.contains(e.target as Node)) setPanel(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanel(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [panel]);

  useEffect(() => {
    const el = dockRef.current;
    if (!el) return;
    let ticking = false;
    const update = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = clamp(h > 0 ? window.scrollY / h : 0);
      document.documentElement.style.setProperty("--p", String(p));
      document.documentElement.style.setProperty("--rail-p", `${Math.min(p * 100, 92)}%`);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
    };
  }, []);

  const current = plates[active] ?? plates[0];

  return (
    <>
      <div className="dock__progress" aria-hidden="true" />
      <nav className="dock" ref={dockRef} aria-label="Plates">
        <div className="dock__cell dock__id">
          <span className="dot" />
          <b>HUNCH</b>
          <span className="dock__cell--hide-sm" style={{ opacity: 0.55 }}>
            FM 87.6
          </span>
        </div>
        <div className="dock__cell dock__cell--grow">
          <div className="dock__plate" key={current.id}>
            <span className="n">PL.{current.no}</span>
            <span>{current.label}</span>
          </div>
        </div>
        <div className="dock__cell dock__cell--hide-sm">
          <span>ROT {time}</span>
        </div>
        <div className="dock__plates">
          {plates.map((p, i) => (
            <button
              key={p.id}
              type="button"
              className="dock__tick"
              data-sfx="tick"
              aria-current={i === active}
              aria-label={`Plate ${p.no}: ${p.label}`}
              onClick={() => scrollTo(`#${p.id}`)}
            >
              {p.no}
            </button>
          ))}
        </div>
        <div className="dock__mobile">
          <button
            type="button"
            data-sfx="page"
            aria-label="Previous plate"
            onClick={() => scrollTo(`#${plates[(active - 1 + plates.length) % plates.length].id}`)}
          >
            ←
          </button>
          <span className="mono">
            {current.no} / 07
          </span>
          <button
            type="button"
            data-sfx="page"
            aria-label="Next plate"
            onClick={() => scrollTo(`#${plates[(active + 1) % plates.length].id}`)}
          >
            →
          </button>
        </div>
        <div className="dock__audio-wrap" ref={audioRef}>
          <button
            type="button"
            className="dock__music"
            data-on={soundOn}
            data-sfx="tick"
            onClick={() => setPanel((p) => !p)}
            aria-expanded={panel}
            aria-haspopup="dialog"
            aria-label="Audio settings"
            title="Sound and music options"
          >
            <span className="dock__music-wave" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="dock__music-label">Audio</span>
          </button>
          {panel && (
            <div className="dock__panel" role="dialog" aria-label="Audio options">
              <div className="dock__panel-head mono">Audio / options</div>
              <button
                type="button"
                className="dock__opt"
                data-on={soundOn}
                onClick={onToggleSound}
                aria-pressed={soundOn}
              >
                <span>Sound</span>
                <span className="dock__opt-led" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="dock__opt"
                data-on={musicOn}
                onClick={onToggleMusic}
                aria-pressed={musicOn}
              >
                <span>Music</span>
                <span className="dock__opt-led" aria-hidden="true" />
              </button>
              <p className="dock__panel-note mono">Interface sounds · HUNCH FM</p>
            </div>
          )}
        </div>
        <button
          type="button"
          className="dock__ink"
          data-sfx="ink"
          data-on={inkOn}
          onClick={onToggleInk}
          aria-pressed={inkOn}
          aria-label="Toggle ink trail"
          title="Leave a trail of ink with the cursor"
        >
          <span className="led" />
          INK
        </button>
      </nav>
    </>
  );
}

export function Rails() {
  return (
    <>
      <div className="rail-left" aria-hidden="true">
        <span>Software by feel — issue 03</span>
      </div>
      <div className="rail-right" aria-hidden="true">
        <span>Live from the studio</span>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Page-turn strip — the colour of the next plate                      */
/* ------------------------------------------------------------------ */

export function NextStrip({
  no,
  label,
  note,
  to,
  bg,
  fg,
}: {
  no: string;
  label: string;
  note: string;
  to: string;
  bg: string;
  fg: string;
}) {
  return (
    <button
      type="button"
      className="next-strip"
      style={{ background: bg, color: fg }}
      data-sfx="page"
      onClick={() => scrollTo(`#${to}`)}
      data-cursor="TURN THE PAGE"
      aria-label={`Next: ${no} ${label}`}
    >
      <span className="next-strip__holes" aria-hidden="true" />
      <span className="next-strip__inner">
        <span className="next-strip__no">Next / {no}</span>
        <span className="next-strip__label">{label}</span>
        <span className="next-strip__leader" aria-hidden="true" />
        <span className="next-strip__note">{note}</span>
        <span className="next-strip__arrow" aria-hidden="true">
          ↓
        </span>
      </span>
    </button>
  );
}
