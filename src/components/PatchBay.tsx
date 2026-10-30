import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { scrollTo } from "../lib/scroll";

type Jack = { id: string; label: string; sub: string };

const NEEDS: Jack[] = [
  { id: "return", label: "A Reason to Return", sub: "retention" },
  { id: "path", label: "A Shorter Path", sub: "friction" },
  { id: "pulse", label: "A Pulse", sub: "emotion" },
  { id: "life", label: "A Second Life", sub: "reuse" },
];

const SYSTEMS: Jack[] = [
  { id: "interface", label: "Interface", sub: "screens · states · words" },
  { id: "motion", label: "Motion", sub: "weight · timing · give" },
  { id: "sound", label: "Sound", sub: "tones · silence · cues" },
  { id: "systems", label: "Systems", sub: "data · logic · plumbing" },
];

const NEED_IDS = NEEDS.map((n) => n.id);
const SYSTEM_IDS = SYSTEMS.map((s) => s.id);
const NEED_COLOR: Record<string, string> = {
  return: "#0d0c0a",
  path: "#2238f5",
  pulse: "#ff4d18",
  life: "#7a5cff",
};

const SPEC: Record<string, string> = {
  "return:interface":
    "a reason to come back that isn’t a notification: one small, earned change each morning.",
  "return:motion": "a landing that rewards the second visit — the page remembers where you left.",
  "return:sound": "a three-note motif only returning visitors hear. they will tell someone.",
  "return:systems": "a memory that stays useful: saved state, quiet continuity, no account nag.",
  "path:interface": "a checkout that fits in one thumb, and a back button that never lies.",
  "path:motion": "transitions that carry context instead of decorating it. nothing spins to say hello.",
  "path:sound": "silence where the old flow used to beep. one confirmation you can feel.",
  "path:systems": "the shortest possible pipe: fewer steps, fewer tables, fewer places to lose someone.",
  "pulse:interface": "a surface with a temperature: paper, ink, one loud thing at a time.",
  "pulse:motion": "weight and give — everything lands like it has a body.",
  "pulse:sound": "a room tone and two cues. sound is the cheapest emotion there is.",
  "pulse:systems": "state changes that feel like events, not refreshes.",
  "life:interface": "a second surface for the same product: admin, archive, after-hours.",
  "life:motion": "reuse as rhythm — old screens returning at the right tempo, not as clutter.",
  "life:sound": "an archive that sounds alive when someone touches it.",
  "life:systems": "one source of truth, many costumes: content that outlives the campaign.",
};

const PRESETS: { name: string; conns: [string, string][] }[] = [
  {
    name: "The House",
    conns: [
      ["return", "interface"],
      ["path", "motion"],
      ["pulse", "sound"],
      ["life", "systems"],
    ],
  },
  {
    name: "The Rescue",
    conns: [
      ["path", "interface"],
      ["pulse", "motion"],
      ["life", "systems"],
    ],
  },
  {
    name: "The Showpiece",
    conns: [
      ["pulse", "motion"],
      ["pulse", "sound"],
      ["return", "interface"],
    ],
  },
];

type Conn = { from: string; to: string };
type Vec = { x: number; y: number };

function cablePath(a: Vec, b: Vec) {
  const dx = b.x - a.x;
  const sag = Math.min(150, 34 + Math.abs(dx) * 0.13);
  return `M ${a.x} ${a.y} C ${a.x + dx * 0.2} ${a.y + sag}, ${b.x - dx * 0.2} ${b.y + sag}, ${b.x} ${b.y}`;
}

export function PatchBay() {
  const boardRef = useRef<HTMLDivElement>(null);
  const socketRefs = useRef(new Map<string, HTMLElement>());
  const [pos, setPos] = useState<Record<string, Vec>>({});
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [conns, setConns] = useState<Conn[]>([]);
  const [armed, setArmed] = useState<string | null>(null);
  const [ghost, setGhost] = useState<Vec | null>(null);
  const [ghostFrom, setGhostFrom] = useState<string | null>(null);
  const [near, setNear] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const gesture = useRef<{ from: string; side: string; sx: number; sy: number; moved: boolean } | null>(
    null,
  );
  const suppress = useRef(false);
  const nearRef = useRef<string | null>(null);

  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    let raf = 0;
    const measure = () => {
      const r = board.getBoundingClientRect();
      const next: Record<string, Vec> = {};
      socketRefs.current.forEach((el, id) => {
        const s = el.getBoundingClientRect();
        next[id] = { x: s.left + s.width / 2 - r.left, y: s.top + s.height / 2 - r.top };
      });
      setPos(next);
      setSize((prev) =>
        Math.abs(prev.w - r.width) < 0.5 && Math.abs(prev.h - r.height) < 0.5
          ? prev
          : { w: r.width, h: r.height },
      );
    };
    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    schedule();
    const ro = new ResizeObserver(schedule);
    ro.observe(board);
    window.addEventListener("resize", schedule);
    const t1 = window.setTimeout(schedule, 300);
    const t2 = window.setTimeout(schedule, 1200);
    if (document.fonts) document.fonts.ready.then(schedule);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const g = gesture.current;
      if (!g) return;
      if (Math.hypot(e.clientX - g.sx, e.clientY - g.sy) > 5) g.moved = true;
      if (!g.moved || !boardRef.current) return;
      const r = boardRef.current.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      setGhost({ x, y });
      let best: string | null = null;
      let bestD = 84;
      for (const [id, p] of Object.entries(pos)) {
        const side = NEED_IDS.includes(id) ? "in" : "out";
        if (side === g.side) continue;
        const d = Math.hypot(p.x - x, p.y - y);
        if (d < bestD) {
          bestD = d;
          best = id;
        }
      }
      nearRef.current = best;
      setNear(best);
    };

    const onUp = (e: PointerEvent) => {
      const g = gesture.current;
      if (!g) return;
      gesture.current = null;
      if (g.moved) {
        suppress.current = true;
        const hitEl = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
        const hit = hitEl?.closest<HTMLElement>("[data-jack]")?.dataset.jack ?? null;
        const drop = nearRef.current ?? hit;
        if (drop) {
          connect(g.from, drop);
        }
        window.setTimeout(() => {
          suppress.current = false;
        }, 80);
      }
      setGhost(null);
      setGhostFrom(null);
      setNear(null);
      nearRef.current = null;
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [pos]);

  const connect = (a: string, b: string) => {
    const aIn = NEED_IDS.includes(a);
    const bIn = NEED_IDS.includes(b);
    let need = "";
    let sys = "";
    if (aIn && !bIn) {
      need = a;
      sys = b;
    } else if (!aIn && bIn) {
      need = b;
      sys = a;
    } else return;
    setConns((prev) =>
      prev.some((c) => c.from === need && c.to === sys) ? prev : [...prev, { from: need, to: sys }],
    );
  };

  const onJackDown = (e: ReactPointerEvent, id: string) => {
    const side = NEED_IDS.includes(id) ? "in" : "out";
    gesture.current = { from: id, side, sx: e.clientX, sy: e.clientY, moved: false };
    const board = boardRef.current;
    if (board) {
      const r = board.getBoundingClientRect();
      setGhost({ x: e.clientX - r.left, y: e.clientY - r.top });
      setGhostFrom(id);
    }
  };

  const onJackClick = (id: string) => {
    if (suppress.current) {
      suppress.current = false;
      return;
    }
    if (armed) {
      if (armed === id) {
        setArmed(null);
        return;
      }
      const armedIn = NEED_IDS.includes(armed);
      const thisIn = NEED_IDS.includes(id);
      if (armedIn !== thisIn) {
        connect(armed, id);
        setArmed(null);
        return;
      }
      setArmed(id);
      return;
    }
    setArmed(id);
  };

  const removeCable = (c: Conn) => {
    setConns((prev) => prev.filter((x) => !(x.from === c.from && x.to === c.to)));
  };

  const spec = useMemo(
    () =>
      conns.map((c) => ({
        ...c,
        need: NEEDS.find((n) => n.id === c.from)!,
        sys: SYSTEMS.find((s) => s.id === c.to)!,
        line: SPEC[`${c.from}:${c.to}`],
      })),
    [conns],
  );

  const specText =
    spec.length === 0
      ? "HUNCH / patch sheet / no cables connected."
      : `HUNCH / patch sheet\n\n${spec
          .map((s) => `${s.need.label} → ${s.sys.label}\n  ${s.line}`)
          .join("\n\n")}\n\nAll systems optional. All feelings load-bearing.`;

  const copySpec = async () => {
    try {
      await navigator.clipboard.writeText(specText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const takeToBench = () => {
    window.dispatchEvent(new CustomEvent("hunch:patch", { detail: specText }));
    scrollTo("#bench");
  };

  return (
    <section className="plate stock-bone patch" id="patch" aria-labelledby="patch-title">
      <span className="folio" aria-hidden="true">
        02
      </span>
      <div className="shell plate-pad">
        <header className="patch__head">
          <div>
            <p className="eyebrow">
              <span className="tick" />
              <span className="lit">Plate 02</span>
              <span className="sep">/</span>
              <span>The Patch Bay</span>
              <span className="sep">/</span>
              <span>Capabilities</span>
            </p>
            <h2 className="patch__title" id="patch-title">
              Everything is
              <br />a <em>cable.</em>
            </h2>
          </div>
          <div className="patch__head-note">
            <p className="lede">
              A product is a connection between a feeling and a system. Pull a cable and read the
              spec. If the patch is wrong, the spec is wrong — that’s the point.
            </p>
            <div className="patch__head-meta">
              <span className="stamp">Feel in / feel out</span>
              <p className="footnote">
                We do this on a call, with worse handwriting. 4 in · 4 out · 16 possible paths.
              </p>
            </div>
          </div>
        </header>

        <div className="patch__controls" role="group" aria-label="Patch presets">
          <span className="mono patch__controls-label">Presets</span>
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              className="patch__preset"
              onClick={() => {
                setConns(p.conns.map(([from, to]) => ({ from, to })));
                setArmed(null);
              }}
            >
              {p.name}
            </button>
          ))}
          <button
            type="button"
            className="patch__preset patch__preset--clear"
            onClick={() => {
              setConns([]);
              setArmed(null);
            }}
            disabled={conns.length === 0}
          >
            Pull everything
          </button>
          <span className="patch__count mono">
            {conns.length}/16 <span>cables</span>
          </span>
        </div>

        <div
          className={`patch__board${armed ? " is-armed" : ""}`}
          ref={boardRef}
          style={{ "--near": near ? "1" : "0" } as CSSProperties}
        >
          <span className="patch__screw patch__screw--tl" aria-hidden="true" />
          <span className="patch__screw patch__screw--tr" aria-hidden="true" />
          <span className="patch__screw patch__screw--bl" aria-hidden="true" />
          <span className="patch__screw patch__screw--br" aria-hidden="true" />

          <div className="patch__board-label patch__board-label--in mono">
            <span className="dot-live" /> Need / in
          </div>
          <div className="patch__board-label patch__board-label--out mono">
            System / out <span className="dot-live" />
          </div>

          <div className="patch__center" aria-hidden="true">
            <span className="patch__flow mono">feel → system</span>
            <span className="patch__watermark">patch</span>
            <span className="patch__flow patch__flow--bottom mono">no. 02 / live</span>
          </div>

          <div className="patch__cols">
            <div className="patch__col patch__col--in">
              {NEEDS.map((n, i) => {
                const connected = conns.some((c) => c.from === n.id);
                return (
                  <button
                    key={n.id}
                    type="button"
                    className={`jack jack--in${connected ? " is-connected" : ""}${
                      armed === n.id ? " is-armed" : ""
                    }`}
                    data-jack={n.id}
                    aria-pressed={armed === n.id || connected}
                    aria-label={`Need: ${n.label}. ${connected ? "Connected." : "Select to patch."}`}
                    onPointerDown={(e) => onJackDown(e, n.id)}
                    onClick={() => onJackClick(n.id)}
                    style={{ "--cable": NEED_COLOR[n.id] } as CSSProperties}
                  >
                    <span className="jack__meta">
                      <span className="jack__name">{n.label}</span>
                      <span className="jack__sub">{n.sub}</span>
                    </span>
                    <span
                      className="jack__socket"
                      ref={(el) => {
                        if (el) socketRefs.current.set(n.id, el);
                        else socketRefs.current.delete(n.id);
                      }}
                    >
                      <span className="jack__hole" />
                      <span className="jack__num">{String(i + 1).padStart(2, "0")}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="patch__col patch__col--out">
              {SYSTEMS.map((s, i) => {
                const connected = conns.some((c) => c.to === s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`jack jack--out${connected ? " is-connected" : ""}${
                      armed === s.id ? " is-armed" : ""
                    }`}
                    data-jack={s.id}
                    aria-pressed={armed === s.id || connected}
                    aria-label={`System: ${s.label}. ${connected ? "Connected." : "Select to patch."}`}
                    onPointerDown={(e) => onJackDown(e, s.id)}
                    onClick={() => onJackClick(s.id)}
                    style={{ "--cable": "#0d0c0a" } as CSSProperties}
                  >
                    <span
                      className="jack__socket"
                      ref={(el) => {
                        if (el) socketRefs.current.set(s.id, el);
                        else socketRefs.current.delete(s.id);
                      }}
                    >
                      <span className="jack__hole" />
                      <span className="jack__num">{String(i + 1).padStart(2, "0")}</span>
                    </span>
                    <span className="jack__meta">
                      <span className="jack__name">{s.label}</span>
                      <span className="jack__sub">{s.sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {size.w > 0 && (
            <svg
              className="patch__cables"
              viewBox={`0 0 ${size.w} ${size.h}`}
              width={size.w}
              height={size.h}
              aria-hidden="true"
            >
              {conns.map((c, i) => {
                const a = pos[c.from];
                const b = pos[c.to];
                if (!a || !b) return null;
                const d = cablePath(a, b);
                const color = NEED_COLOR[c.from];
                return (
                  <g key={`${c.from}-${c.to}-${i}`} className="cable">
                    <path d={d} className="cable__shadow" />
                    <path d={d} className="cable__line" style={{ stroke: color }} />
                    <path
                      d={d}
                      className="cable__hit"
                      onClick={() => removeCable(c)}
                      data-cursor="CUT THE CABLE"
                    />
                    <circle cx={a.x} cy={a.y} r={7} fill={color} stroke="#0d0c0a" strokeWidth={1.2} />
                    <circle cx={a.x} cy={a.y} r={2.3} fill="#f3ecdf" opacity={0.8} />
                    <circle cx={b.x} cy={b.y} r={7} fill={color} stroke="#0d0c0a" strokeWidth={1.2} />
                    <circle cx={b.x} cy={b.y} r={2.3} fill="#f3ecdf" opacity={0.8} />
                  </g>
                );
              })}
              {ghost && pos[ghostFrom ?? ""] && (
                <g className="cable cable--ghost">
                  <path
                    d={cablePath(pos[ghostFrom!], ghost)}
                    className="cable__ghost"
                    style={{ stroke: NEED_COLOR[ghostFrom!] }}
                  />
                  <circle cx={ghost.x} cy={ghost.y} r={5} fill={NEED_COLOR[ghostFrom!]} opacity={0.7} />
                </g>
              )}
            </svg>
          )}

          {armed && (
            <div className="patch__armed-hint mono" aria-live="polite">
              {NEED_IDS.includes(armed)
                ? `${NEEDS.find((n) => n.id === armed)?.label} armed — now pick a system`
                : `${SYSTEMS.find((s) => s.id === armed)?.label} armed — now pick a need`}
            </div>
          )}
        </div>

        <p className="sr-only" aria-live="polite">
          {conns.length === 0 ? "No cables connected" : `${conns.length} cables connected`}
        </p>

        <div className="patch__output">
          <div className="patch__receipt">
            <div className="patch__receipt-head">
              <span className="mono">Output / spec sheet</span>
              <span className="mono">Form PB-02</span>
            </div>
            {spec.length === 0 ? (
              <p className="patch__empty">
                No cables. The board is quiet.
                <span> Drag from a need to a system, or click one socket then the other.</span>
              </p>
            ) : (
              <ol className="spec">
                {spec.map((s, i) => (
                  <li className="spec__row" key={`${s.from}-${s.to}`}>
                    <span className="spec__no mono">{String(i + 1).padStart(2, "0")}</span>
                    <span className="spec__route">
                      <b>{s.need.label}</b>
                      <span className="spec__arrow" aria-hidden="true">
                        ⟶
                      </span>
                      <b>{s.sys.label}</b>
                    </span>
                    <span className="spec__line">{s.line}</span>
                  </li>
                ))}
              </ol>
            )}
            <div className="patch__receipt-foot">
              <span className="mono">Patch / {conns.length ? `${String(conns.length * 7 + 11).padStart(4, "0")}` : "——"}</span>
              <span className="mono">Feeling is load-bearing</span>
              <span className="patch__bars" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
                <i />
              </span>
            </div>
          </div>

          <aside className="patch__notes">
            <p className="patch__notes-quote">
              All systems are optional. <em>All feelings are load-bearing.</em>
            </p>
            <p className="footnote">
              The spec is generated from the cable, not from a deck. It is also how we quote. If a
              line doesn’t make you feel something, cut the cable.
            </p>
            <div className="patch__actions">
              <button type="button" className="btn btn--fill btn--sm" onClick={takeToBench}>
                Take it to the bench <span className="arw">↗</span>
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={copySpec}>
                {copied ? "Copied ✓" : "Copy the spec"}
              </button>
            </div>
            <p className="mono patch__keys">
              Keyboard: tab to a socket, enter to arm it, enter on the other side to patch.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
