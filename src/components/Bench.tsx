import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useVibe, type Tier } from "../lib/vibe";
import { scrollTo } from "../lib/scroll";

const EMAIL = "hello@hunch.studio";

const MODES: { id: Exclude<Tier, null> | null; label: string; sub: string }[] = [
  { id: "build", label: "A hunch", sub: "something new" },
  { id: "sprint", label: "A rescue", sub: "something slightly off" },
  { id: "date", label: "A standing date", sub: "taste on tap" },
  { id: null, label: "Not sure yet", sub: "that’s fine" },
];

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
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
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
  const { vibe, setVibe, resetVibe, tier, setTier } = useVibe();
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
  const descriptor = useMemo(() => {
    const warm = vibe.warmth < 0.33 ? "cool" : vibe.warmth < 0.68 ? "warm" : "violet-hour";
    const grain = vibe.grain < 0.33 ? "clean" : vibe.grain < 0.68 ? "papery" : "dusty";
    const pace = vibe.tempo < 0.33 ? "still" : vibe.tempo < 0.68 ? "humming" : "restless";
    return `a ${warm}, ${grain}, ${pace} room`;
  }, [vibe.warmth, vibe.grain, vibe.tempo]);

  const modeLabel = MODES.find((m) => m.id === mode)?.label ?? "Not sure yet";

  const draft = () =>
    `Session request / ${modeLabel}\n\nName: ${name}\nSignal: ${email}\n\n${
      patch ? `Attached patch:\n${patch}\n\n` : ""
    }${message}\n\n— sent from hunch.studio, by hand`;

  const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(
    `A hunch — ${modeLabel} — ${name || "no name yet"}`,
  )}&body=${encodeURIComponent(draft())}`;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("We need something to call you. A first name is plenty.");
    if (!email.includes("@") || email.length < 5) return setError("That signal looks broken. Try an address with an @ in it.");
    if (message.trim().length < 6) return setError("Give us one sentence. Even a bad one. Especially a bad one.");
    setError("");
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
              <span className="lit">Plate 06</span>
              <span className="sep">/</span>
              <span>The Bench</span>
              <span className="sep">/</span>
              <span>Try it</span>
            </p>
            <h2 className="bench__title" id="bench-title">
              The site is
              <br />
              the <em>pitch.</em>
            </h2>
          </div>
          <div className="bench__head-note">
            <p className="lede">
              Move the faders. The page changes — warmth, grain, tempo. This is the same interface
              we use on a kickoff call, minus the candles.
            </p>
            <div className="bench__head-meta">
              <span className="stamp bench__live">Live demo</span>
              <span className="mono">Tuner Mk. 06 / local only / no tracking</span>
            </div>
          </div>
        </header>

        <div className="bench__console">
          <div className="tuner">
            <div className="tuner__head">
              <span className="mono">The tuner / Mk. 06</span>
              <span className="mono tuner__live">
                <span className="dot-live" style={{ background: "var(--lime)" }} /> Live on this page
              </span>
            </div>

            <div className="vibe">
              <div className="vibe__top">
                <span className="mono">Vibe index</span>
                <span className="vibe__num">{index.toFixed(2)}</span>
              </div>
              <div className="vibe__meter" aria-hidden="true">
                <span className="vibe__needle" style={{ left: `${index * 100}%` }} />
                {Array.from({ length: 21 }).map((_, i) => (
                  <i key={i} className={i % 5 === 0 ? "is-major" : ""} />
                ))}
              </div>
              <p className="vibe__desc">
                “{descriptor}” <span>— as read by the room</span>
              </p>
            </div>

            <div className="tuner__faders">
              <Fader
                label="Warmth"
                endA="cold, clinical"
                endB="warm, human"
                value={vibe.warmth}
                onChange={(warmth) => setVibe({ warmth })}
              />
              <Fader
                label="Grain"
                endA="clean glass"
                endB="dusty paper"
                value={vibe.grain}
                onChange={(grain) => setVibe({ grain })}
              />
              <Fader
                label="Tempo"
                endA="still"
                endB="restless"
                value={vibe.tempo}
                onChange={(tempo) => setVibe({ tempo })}
              />
            </div>

            <div className="tuner__actions">
              <button type="button" className="tuner__btn" onClick={resetVibe}>
                Reset to house
              </button>
              <button type="button" className="tuner__btn tuner__btn--hot" onClick={detune}>
                Detune ↯
              </button>
            </div>

            <p className="tuner__note">
              Detune is what we do when a client says “make it pop”. It is also what we do when we’re
              bored. The house setting is where we start every project.
            </p>

            <div className="tuner__plaque" aria-hidden="true">
              <span className="mono">calibrated by hand</span>
              <span className="tuner__screw" />
            </div>
          </div>

          <div className="console">
            <div className="console__head">
              <span className="mono">Transmission / form 7—B</span>
              <span className="mono">No CRM · one inbox · one human</span>
            </div>

            {status === "ready" ? (
              <div className="console__done" aria-live="polite">
                <span className="console__done-stamp">Received</span>
                <p className="console__done-line">
                  Session code <b>{code}</b>. One of us will answer from {EMAIL}, usually around
                  09:00 CET. Expect a question, not a deck.
                </p>
                <div className="console__draft">
                  <span className="mono">Draft / {modeLabel}</span>
                  <p>{name || "—"} / {email || "—"}</p>
                  <p>{message || "—"}</p>
                  {patch && <pre>{patch}</pre>}
                </div>
                <div className="console__actions">
                  <a className="btn btn--fill btn--sm" href={mailto}>
                    Open in mail app <span className="arw">↗</span>
                  </a>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={copyAddress}>
                    {copied ? "Copied ✓" : `Copy ${EMAIL}`}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      setStatus("idle");
                      setCode("");
                    }}
                  >
                    Write another
                  </button>
                </div>
                <p className="console__local mono">
                  This console is local. Nothing was sent from your browser — the mail app button
                  carries the draft.
                </p>
              </div>
            ) : (
              <form className="request" onSubmit={submit} noValidate>
                <div className="request__row">
                  <label className="field">
                    <span className="field__no mono">01</span>
                    <span className="field__label mono">Your name</span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="first name is plenty"
                      autoComplete="name"
                    />
                  </label>
                  <label className="field">
                    <span className="field__no mono">02</span>
                    <span className="field__label mono">Signal / email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@somewhere"
                      autoComplete="email"
                    />
                  </label>
                </div>

                <div className="request__modes" role="group" aria-label="What are we making">
                  <span className="field__label mono">03 / I’m here about</span>
                  <div className="modes">
                    {MODES.map((m) => (
                      <button
                        key={m.label}
                        type="button"
                        className={`mode${mode === m.id ? " is-on" : ""}`}
                        aria-pressed={mode === m.id}
                        onClick={() => {
                          setMode(m.id);
                          setTier(m.id);
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
                  <span className="field__label mono">What are we making?</span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="A sentence is enough. The hunch, the snag, the feeling you want in the room."
                  />
                </label>

                {patch && (
                  <div className="attached">
                    <span className="attached__label mono">Attached / patch sheet</span>
                    <pre>{patch}</pre>
                    <button type="button" className="attached__x" onClick={() => setPatch("")} aria-label="Remove attached patch">
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
                    <span>{status === "sending" ? "Transmitting" : "Transmit"}</span>
                    <span className="transmit__arw" aria-hidden="true">
                      {status === "sending" ? "···" : "↗"}
                    </span>
                    <span className="transmit__bar" aria-hidden="true" />
                  </button>
                  <p className="request__fine mono">
                    No sequence. No deck. One of us reads this, usually around 09:00 CET. If you’re
                    in a hurry, say so in the first line.
                  </p>
                </div>
              </form>
            )}

            <div className="console__foot">
              <span className="mono">HUNCH / studio 03 / window 7—B</span>
              <button type="button" className="console__copy mono" onClick={copyAddress}>
                {copied ? "copied ✓" : EMAIL}
              </button>
            </div>
          </div>
        </div>

        <div className="bench__foot">
          <p className="bench__quote">
            The best demo we have is the thing you’re already touching. <em>This is it.</em>
          </p>
          <p className="footnote">
            The tuner writes to this page, not to us. The console is local. The feeling is the
            product. The rest is a conversation.
          </p>
          <button type="button" className="btn btn--fill bench__cta" onClick={() => scrollTo("#signoff")}>
            Go to the sign-off <span className="arw">↓</span>
          </button>
        </div>
      </div>
    </section>
  );
}
