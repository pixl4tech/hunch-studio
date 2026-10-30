import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useVibe, type Tier } from "../lib/vibe";
import { scrollTo } from "../lib/scroll";
import { playSfx } from "../lib/sfx";
import { BENCH_MODE_IDS } from "../content/data";
import { Rich, useI18n } from "../i18n";

const EMAIL = "hello@hunch.studio";

function Fader({
  label,
  endA,
  endB,
  value,
  onChange,
}: {
  label: string;
  endA: string;
  endB: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className="fader">
      <div className="fader__head">
        <span className="fader__label">{label}</span>
        <span className="fader__value mono">{String(pct).padStart(2, "0")}%</span>
      </div>
      <div className="fader__rail">
        <span className="fader__ticks" aria-hidden="true" />
        <span className="fader__fill" style={{ width: `${pct}%` }} aria-hidden="true" />
        <span className="fader__thumb" style={{ left: `${pct}%` }} aria-hidden="true" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={value}
          aria-label={label}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            playSfx("fader");
            onChange(Number(e.target.value));
          }}
        />
      </div>
      <div className="fader__ends mono">
        <span>{endA}</span>
        <span>{endB}</span>
      </div>
    </div>
  );
}

export function Bench() {
  const { c, fill, fmt } = useI18n();
  const { vibe, setVibe, resetVibe, tier, setTier } = useVibe();
  const modes = BENCH_MODE_IDS.map((id) => ({
    id,
    tier: (id === "unsure" ? null : id) as Tier,
    ...c.bench.console.modes[id],
  }));
  const [mode, setMode] = useState<Tier>("build");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [patch, setPatch] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "ready">("idle");
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);

  useEffect(() => {
    if (tier) setMode(tier);
  }, [tier]);

  useEffect(() => {
    const onPatch = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail) {
        setPatch(detail);
        setStatus("idle");
      }
    };
    window.addEventListener("hunch:patch", onPatch);
    return () => window.removeEventListener("hunch:patch", onPatch);
  }, []);

  const index = (vibe.warmth + vibe.grain + vibe.tempo) / 3;
  const band = (v: number) => (v < 0.33 ? 0 : v < 0.68 ? 1 : 2);
  const descriptor = useMemo(() => {
    const warm = c.bench.tuner.warm[band(vibe.warmth)];
    const grain = c.bench.tuner.grain[band(vibe.grain)];
    const pace = c.bench.tuner.pace[band(vibe.tempo)];
    return fill(c.bench.tuner.desc, { warm, grain, pace });
  }, [vibe.warmth, vibe.grain, vibe.tempo, c, fill]);

  const modeLabel = modes.find((m) => m.id === mode)?.label ?? c.bench.console.modes.unsure.label;

  const draft = () =>
    fill(c.bench.draft.body, {
      mode: modeLabel,
      name,
      email,
      patch: patch ? fill(c.bench.draft.patch, { patch }) : "",
      message,
    });

  const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(
    fill(c.bench.draft.subject, { mode: modeLabel, name: name || c.bench.draft.noName }),
  )}&body=${encodeURIComponent(draft())}`;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError(c.bench.console.errors.name);
    if (!email.includes("@") || email.length < 5) return setError(c.bench.console.errors.email);
    if (message.trim().length < 6) return setError(c.bench.console.errors.message);
    setError("");
    playSfx("stamp");
    setStatus("sending");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setCode(`HNC–${Date.now().toString(16).slice(-4).toUpperCase()}`);
      setStatus("ready");
    }, 1150);
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const detune = () => {
    setVibe({
      warmth: Math.random(),
      grain: Math.random() * 0.8 + 0.1,
      tempo: Math.random(),
    });
  };

  return (
    <section className="plate stock-bone bench" id="bench" aria-labelledby="bench-title">
      <span className="folio" aria-hidden="true">
        06
      </span>
      <div className="shell plate-pad">
        <header className="bench__head">
          <div>
            <p className="eyebrow">
              <span className="tick" />
              <span className="lit">{c.bench.eyebrow.plate}</span>
              <span className="sep">/</span>
              <span>{c.bench.eyebrow.section}</span>
              <span className="sep">/</span>
              <span>{c.bench.eyebrow.try}</span>
            </p>
            <h2 className="bench__title" id="bench-title">
              {c.bench.title1}
              <br />
              <Rich text={c.bench.title2} />
            </h2>
          </div>
          <div className="bench__head-note">
            <p className="lede">
              {c.bench.lede}
            </p>
            <div className="bench__head-meta">
              <span className="stamp bench__live">{c.bench.live}</span>
              <span className="mono">{c.bench.meta}</span>
            </div>
          </div>
        </header>

        <div className="bench__console">
          <div className="tuner">
            <div className="tuner__head">
              <span className="mono">{c.bench.tuner.title}</span>
              <span className="mono tuner__live">
                <span className="dot-live" style={{ background: "var(--lime)" }} /> {c.bench.tuner.live}
              </span>
            </div>

            <div className="vibe">
              <div className="vibe__top">
                <span className="mono">{c.bench.tuner.index}</span>
                <span className="vibe__num">{fmt.number(index, 2)}</span>
              </div>
              <div className="vibe__meter" aria-hidden="true">
                <span className="vibe__needle" style={{ left: `${index * 100}%` }} />
                {Array.from({ length: 21 }).map((_, i) => (
                  <i key={i} className={i % 5 === 0 ? "is-major" : ""} />
                ))}
              </div>
              <p className="vibe__desc">
                {descriptor}
              </p>
            </div>

            <div className="tuner__faders">
              <Fader
                label={c.bench.faders.warmth.label}
                endA={c.bench.faders.warmth.endA}
                endB={c.bench.faders.warmth.endB}
                value={vibe.warmth}
                onChange={(warmth) => setVibe({ warmth })}
              />
              <Fader
                label={c.bench.faders.grain.label}
                endA={c.bench.faders.grain.endA}
                endB={c.bench.faders.grain.endB}
                value={vibe.grain}
                onChange={(grain) => setVibe({ grain })}
              />
              <Fader
                label={c.bench.faders.tempo.label}
                endA={c.bench.faders.tempo.endA}
                endB={c.bench.faders.tempo.endB}
                value={vibe.tempo}
                onChange={(tempo) => setVibe({ tempo })}
              />
            </div>

            <div className="tuner__actions">
              <button type="button" className="tuner__btn" data-sfx="switch" onClick={resetVibe}>
                {c.bench.tuner.reset}
              </button>
              <button type="button" className="tuner__btn tuner__btn--hot" data-sfx="switch" onClick={detune}>
                {c.bench.tuner.detune}
              </button>
            </div>

            <p className="tuner__note">
              {c.bench.tuner.note}
            </p>

            <div className="tuner__plaque" aria-hidden="true">
              <span className="mono">{c.bench.tuner.plaque}</span>
              <span className="tuner__screw" />
            </div>
          </div>

          <div className="console">
            <div className="console__head">
              <span className="mono">{c.bench.console.head}</span>
              <span className="mono">{c.bench.console.sub}</span>
            </div>

            {status === "ready" ? (
              <div className="console__done" aria-live="polite">
                <span className="console__done-stamp">{c.bench.console.received}</span>
                <p className="console__done-line">
                  {fill(c.bench.console.doneLine, { code, email: EMAIL })}
                </p>
                <div className="console__draft">
                  <span className="mono">{c.bench.console.draft} {modeLabel}</span>
                  <p>{name || "—"} / {email || "—"}</p>
                  <p>{message || "—"}</p>
                  {patch && <pre>{patch}</pre>}
                </div>
                <div className="console__actions">
                  <a className="btn btn--fill btn--sm" data-sfx="paper" href={mailto}>
                    {c.bench.console.openMail} <span className="arw">↗</span>
                  </a>
                  <button type="button" className="btn btn--ghost btn--sm" data-sfx="success" onClick={copyAddress}>
                    {copied ? c.common.copied : fill(c.bench.console.copyMail, { email: EMAIL })}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    data-sfx="tick"
                    onClick={() => {
                      setStatus("idle");
                      setCode("");
                    }}
                  >
                    {c.bench.console.writeAnother}
                  </button>
                </div>
                <p className="console__local mono">
                  {c.bench.console.local}
                </p>
              </div>
            ) : (
              <form className="request" onSubmit={submit} noValidate>
                <div className="request__row">
                  <label className="field">
                    <span className="field__no mono">01</span>
                    <span className="field__label mono">{c.bench.console.form.name}</span>
                    <input
                      type="text"
                      value={name}
                      onKeyDown={() => playSfx("type")}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={c.bench.console.form.namePlaceholder}
                      autoComplete="name"
                    />
                  </label>
                  <label className="field">
                    <span className="field__no mono">02</span>
                    <span className="field__label mono">{c.bench.console.form.email}</span>
                    <input
                      type="email"
                      value={email}
                      onKeyDown={() => playSfx("type")}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={c.bench.console.form.emailPlaceholder}
                      autoComplete="email"
                    />
                  </label>
                </div>

                <div className="request__modes" role="group" aria-label={c.bench.console.form.message}>
                  <span className="field__label mono">{c.bench.console.form.about}</span>
                  <div className="modes">
                    {modes.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        className={`mode${mode === m.id ? " is-on" : ""}`}
                        data-sfx="switch"
                        aria-pressed={mode === m.id}
                        onClick={() => {
                          setMode(m.tier);
                          setTier(m.tier);
                        }}
                      >
                        <span className="mode__label">{m.label}</span>
                        <span className="mode__sub">{m.sub}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <label className="field field--area">
                  <span className="field__no mono">04</span>
                  <span className="field__label mono">{c.bench.console.form.message}</span>
                  <textarea
                    value={message}
                    onKeyDown={() => playSfx("type")}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder={c.bench.console.form.messagePlaceholder}
                  />
                </label>

                {patch && (
                  <div className="attached">
                    <span className="attached__label mono">{c.bench.console.attach}</span>
                    <pre>{patch}</pre>
                    <button type="button" className="attached__x" data-sfx="paper" onClick={() => setPatch("")} aria-label={c.bench.console.attachRemove}>
                      ✕
                    </button>
                  </div>
                )}

                {error && <p className="request__error mono">{error}</p>}

                <div className="request__submit">
                  <button
                    type="submit"
                    className={`transmit${status === "sending" ? " is-sending" : ""}`}
                    disabled={status === "sending"}
                  >
                    <span>{status === "sending" ? c.bench.console.sending : c.bench.console.submit}</span>
                    <span className="transmit__arw" aria-hidden="true">
                      {status === "sending" ? "···" : "↗"}
                    </span>
                    <span className="transmit__bar" aria-hidden="true" />
                  </button>
                  <p className="request__fine mono">
                    {c.bench.console.fine}
                  </p>
                </div>
              </form>
            )}

            <div className="console__foot">
              <span className="mono">{c.bench.console.foot}</span>
              <button type="button" className="console__copy mono" onClick={copyAddress}>
                {copied ? c.common.copied : EMAIL}
              </button>
            </div>
          </div>
        </div>

        <div className="bench__foot">
          <p className="bench__quote">
            <Rich text={c.bench.foot.quote} />
          </p>
          <p className="footnote">
            {c.bench.foot.footnote}
          </p>
          <button type="button" className="btn btn--fill bench__cta" onClick={() => scrollTo("#signoff")}>
            {c.bench.foot.cta} <span className="arw">↓</span>
          </button>
        </div>
      </div>
    </section>
  );
}
