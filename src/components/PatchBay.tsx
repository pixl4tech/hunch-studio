import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { scrollTo } from "../lib/scroll";
import { NEED_COLOR, NEED_IDS, PRESETS, SYSTEM_IDS, type NeedId } from "../content/data";
import { Rich, useI18n } from "../i18n";

type Conn = { from: string; to: string };
type Vec = { x: number; y: number };

function cablePath(a: Vec, b: Vec) {
  const dx = b.x - a.x;
  const sag = Math.min(150, 34 + Math.abs(dx) * 0.13);
  return `M ${a.x} ${a.y} C ${a.x + dx * 0.2} ${a.y + sag}, ${b.x - dx * 0.2} ${b.y + sag}, ${b.x} ${b.y}`;
}

export function PatchBay() {
  const { c, fill } = useI18n();
  const needs = NEED_IDS.map((id) => ({ id, ...c.patch.needs[id] }));
  const systems = SYSTEM_IDS.map((id) => ({ id, ...c.patch.systems[id] }));
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
        const side = (NEED_IDS as string[]).includes(id) ? "in" : "out";
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
    const aIn = (NEED_IDS as string[]).includes(a);
    const bIn = (NEED_IDS as string[]).includes(b);
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
    const side = (NEED_IDS as string[]).includes(id) ? "in" : "out";
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
      const armedIn = (NEED_IDS as string[]).includes(armed);
      const thisIn = (NEED_IDS as string[]).includes(id);
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
      conns.map((conn) => ({
        ...conn,
        need: needs.find((n) => n.id === conn.from)!,
        sys: systems.find((s) => s.id === conn.to)!,
        line: (c.patch.specs as Record<string, string>)[`${conn.from}:${conn.to}`],
      })),
    [conns, needs, systems, c],
  );

  const specText =
    spec.length === 0
      ? c.patch.specText.empty
      : `${c.patch.specText.header}\n\n${spec
          .map((s) => `${s.need.label} → ${s.sys.label}\n  ${s.line}`)
          .join("\n\n")}\n\n${c.patch.specText.footer}`;

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
              <span className="lit">{c.patch.eyebrow.plate}</span>
              <span className="sep">/</span>
              <span>{c.patch.eyebrow.section}</span>
              <span className="sep">/</span>
              <span>{c.patch.eyebrow.caps}</span>
            </p>
            <h2 className="patch__title" id="patch-title">
              {c.patch.title1}
              <br /><Rich text={c.patch.title2} />
            </h2>
          </div>
          <div className="patch__head-note">
            <p className="lede">
              {c.patch.lede}
            </p>
            <div className="patch__head-meta">
              <span className="stamp">{c.patch.stamp}</span>
              <p className="footnote">
                {c.patch.footnote}
              </p>
            </div>
          </div>
        </header>

        <div className="patch__controls" role="group" aria-label={c.patch.presets}>
          <span className="mono patch__controls-label">{c.patch.presets}</span>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className="patch__preset"
              data-sfx="relay"
              onClick={() => {
                setConns(p.conns.map(([from, to]) => ({ from: String(from), to: String(to) })));
                setArmed(null);
              }}
            >
              {c.patch.presetsList[p.id]}
            </button>
          ))}
          <button
            type="button"
            className="patch__preset patch__preset--clear"
            data-sfx="plug"
            onClick={() => {
              setConns([]);
              setArmed(null);
            }}
            disabled={conns.length === 0}
          >
            {c.patch.clear}
          </button>
          <span className="patch__count mono">
            {fill(c.patch.cables, { count: conns.length }).replace(`${conns.length}/16 `, `${conns.length}/16 `)}
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
            <span className="dot-live" /> {c.patch.board.need}
          </div>
          <div className="patch__board-label patch__board-label--out mono">
            {c.patch.board.system} <span className="dot-live" />
          </div>

          <div className="patch__center" aria-hidden="true">
            <span className="patch__flow mono">{c.patch.board.flowTop}</span>
            <span className="patch__watermark">{c.patch.board.watermark}</span>
            <span className="patch__flow patch__flow--bottom mono">{c.patch.board.flowBottom}</span>
          </div>

          <div className="patch__cols">
            <div className="patch__col patch__col--in">
              {needs.map((n, i) => {
                const connected = conns.some((c) => c.from === n.id);
                return (
                  <button
                    key={n.id}
                    type="button"
                    className={`jack jack--in${connected ? " is-connected" : ""}${
                      armed === n.id ? " is-armed" : ""
                    }`}
                    data-jack={n.id}
                    data-sfx="plug"
                    aria-pressed={armed === n.id || connected}
                    aria-label={fill(c.patch.board.needAria, { label: n.label, state: connected ? c.patch.board.connected : c.patch.board.select })}
                    onPointerDown={(e) => onJackDown(e, n.id)}
                    onClick={() => onJackClick(n.id)}
                    style={{ "--cable": NEED_COLOR[n.id as NeedId] } as CSSProperties}
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
              {systems.map((s, i) => {
                const connected = conns.some((c) => c.to === s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`jack jack--out${connected ? " is-connected" : ""}${
                      armed === s.id ? " is-armed" : ""
                    }`}
                    data-jack={s.id}
                    data-sfx="plug"
                    aria-pressed={armed === s.id || connected}
                    aria-label={fill(c.patch.board.systemAria, { label: s.label, state: connected ? c.patch.board.connected : c.patch.board.select })}
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
              {conns.map((conn, i) => {
                const a = pos[conn.from];
                const b = pos[conn.to];
                if (!a || !b) return null;
                const d = cablePath(a, b);
                const color = NEED_COLOR[conn.from as NeedId];
                return (
                  <g key={`${conn.from}-${conn.to}-${i}`} className="cable">
                    <path d={d} className="cable__shadow" />
                    <path d={d} className="cable__line" style={{ stroke: color }} />
                    <path
                      d={d}
                      className="cable__hit"
                      data-sfx="plug"
                      onClick={() => removeCable(conn)}
                      data-cursor={c.chrome.cursor.cutCable}
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
                    style={{ stroke: NEED_COLOR[ghostFrom! as NeedId] }}
                  />
                  <circle cx={ghost.x} cy={ghost.y} r={5} fill={NEED_COLOR[ghostFrom! as NeedId]} opacity={0.7} />
                </g>
              )}
            </svg>
          )}

          {armed && (
            <div className="patch__armed-hint mono" aria-live="polite">
              {NEED_IDS.includes(armed as NeedId)
                ? fill(c.patch.board.armedNeed, { label: needs.find((n) => n.id === armed)?.label ?? "" })
                : fill(c.patch.board.armedSystem, { label: systems.find((s) => s.id === armed)?.label ?? "" })}
            </div>
          )}
        </div>

        <p className="sr-only" aria-live="polite">
          {conns.length === 0 ? c.patch.specText.empty : fill(c.patch.cables, { count: conns.length })}
        </p>

        <div className="patch__output">
          <div className="patch__receipt">
            <div className="patch__receipt-head">
              <span className="mono">{c.patch.receipt.head}</span>
              <span className="mono">{c.patch.receipt.form}</span>
            </div>
            {spec.length === 0 ? (
              <p className="patch__empty">
                {c.patch.receipt.empty}
                <span> {c.patch.receipt.emptyHint}</span>
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
              <span className="mono">{c.patch.receipt.patch} {conns.length ? `${String(conns.length * 7 + 11).padStart(4, "0")}` : "——"}</span>
              <span className="mono">{c.patch.receipt.load}</span>
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
              <Rich text={c.patch.receipt.noteQuote} />
            </p>
            <p className="footnote">
              {c.patch.receipt.noteFoot}
            </p>
            <div className="patch__actions">
              <button type="button" className="btn btn--fill btn--sm" data-sfx="paper" onClick={takeToBench}>
                {c.patch.receipt.take} <span className="arw">↗</span>
              </button>
              <button type="button" className="btn btn--ghost btn--sm" data-sfx="success" onClick={copySpec}>
                {copied ? c.common.copied : c.patch.receipt.copy}
              </button>
            </div>
            <p className="mono patch__keys">
              {c.patch.receipt.keys}
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
