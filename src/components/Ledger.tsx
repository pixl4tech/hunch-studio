import type { CSSProperties } from "react";
import { useVibe } from "../lib/vibe";
import { scrollTo } from "../lib/scroll";
import { playSfx } from "../lib/sfx";
import { TICKET_DATA, TICKET_IDS } from "../content/data";
import { Rich, useI18n } from "../i18n";

function Barcode({ n = 24 }: { n?: number }) {
  return (
    <span className="barcode" aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <i
          key={i}
          style={{
            width: i % 5 === 0 ? 2.5 : i % 3 === 0 ? 1.6 : 1,
            opacity: 0.9,
          }}
        />
      ))}
    </span>
  );
}

export function Ledger() {
  const { c, fill, fmt } = useI18n();
  const { tier, setTier } = useVibe();
  const tickets = TICKET_IDS.map((id) => {
    const data = TICKET_DATA[id];
    const copy = c.ledger.tickets[id];
    return {
      id,
      ...data,
      ...copy,
      price: fmt.currency(data.price, data.plus ? "+" : ""),
    };
  });
  const selected = tickets.find((t) => t.id === tier) ?? null;

  return (
    <section className="plate stock-bone ledger" id="ledger" aria-labelledby="ledger-title">
      <span className="folio" aria-hidden="true">
        04
      </span>
      <div className="ledger__rules" aria-hidden="true" />
      <div className="shell plate-pad">
        <header className="ledger__head">
          <div className="ledger__head-main">
            <p className="eyebrow">
              <span className="tick" />
              <span className="lit">{c.ledger.eyebrow.plate}</span>
              <span className="sep">/</span>
              <span>{c.ledger.eyebrow.section}</span>
              <span className="sep">/</span>
              <span>{c.ledger.eyebrow.ways}</span>
            </p>
            <h2 className="ledger__title" id="ledger-title">
              {c.ledger.title1}
              <br />
              <Rich text={c.ledger.title2} />
            </h2>
          </div>
          <div className="ledger__head-note">
            <p className="lede">
              {c.ledger.lede}
            </p>
            <div className="ledger__meta">
              <span className="mono">{c.ledger.meta.prices}</span>
              <span className="mono">{c.ledger.meta.deposit}</span>
              <span className="mono">{c.ledger.meta.seats}</span>
              <span className="mono">{c.ledger.meta.models}</span>
            </div>
          </div>
        </header>

        <div className="ledger__desk">
          <div className="ledger__desk-head">
            <span className="mono">{c.ledger.desk.open}</span>
            <span className="mono">{c.ledger.desk.book}</span>
            <span className="mono">{c.ledger.desk.hint}</span>
          </div>

          <div className="ledger__tickets">
            {tickets.map((t) => {
              const isSelected = tier === t.id;
              return (
                <article
                  key={t.id}
                  className={`ticket${isSelected ? " is-selected" : ""}`}
                  data-sfx="tear"
                  style={{ "--tilt": `${t.tilt}deg`, "--drop": `${t.drop}px` } as CSSProperties}
                  onClick={() => {
                    setTier(isSelected ? null : t.id);
                    if (isSelected) playSfx("paper");
                    else window.setTimeout(() => playSfx("stamp"), 190);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setTier(isSelected ? null : t.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={fill(c.ledger.ticket.aria, {
                    mode: t.mode,
                    name: t.name,
                    duration: t.duration,
                    price: t.price,
                  })}
                  data-cursor={isSelected ? c.chrome.cursor.unstamp : c.chrome.cursor.stampIt}
                >
                  <div className="ticket__main">
                    <div className="ticket__head" style={{ background: t.header, color: t.headerFg }}>
                      <span>{t.mode}</span>
                      <span>{fill(c.ledger.ticket.seat, { seat: t.seat })}</span>
                    </div>
                    <div className="ticket__body">
                      <p className="ticket__kicker mono">{t.mode} / {t.duration}</p>
                      <h3 className="ticket__name">{t.name}</h3>
                      <p className="ticket__brief">{t.brief}</p>
                      <div className="ticket__price-row">
                        <span className="ticket__price">{t.price}</span>
                        <span className="ticket__price-note mono">{t.priceNote}</span>
                      </div>
                      <ul className="ticket__includes">
                        {t.includes.map((item) => (
                          <li key={item}>
                            <span className="plus" aria-hidden="true">+</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                      <p className="ticket__best">
                        <span className="mono">{c.ledger.ticket.bestForLabel}</span> {t.bestFor}
                      </p>
                      <p className="ticket__note">{t.note}</p>
                    </div>
                    <div className="ticket__foot">
                      <span className="mono">{c.ledger.ticket.transferable}</span>
                      <span className="mono">HUNCH / 03</span>
                    </div>
                    <div className="ticket__stamp" aria-hidden="true">
                      {c.ledger.ticket.admitted}
                    </div>
                  </div>

                  <div className="ticket__stub">
                    <span className="ticket__stub-cut" aria-hidden="true" />
                    <span className="ticket__vertical">{c.ledger.ticket.vertical}</span>
                    <Barcode n={18} />
                    <span className="ticket__seat">{t.seat}</span>
                    <span className="ticket__arrow" aria-hidden="true">→</span>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="ledger__summary" aria-live="polite">
            <span className="ledger__summary-label mono">{c.ledger.summary.label}</span>
            {selected ? (
              <>
                <span className="ledger__summary-value">
                  {selected.mode} / {selected.name}
                </span>
                <span className="ledger__summary-meta mono">
                  {selected.duration} · {selected.price}
                </span>
                <button
                  type="button"
                  className="btn btn--fill btn--sm"
                  data-sfx="page"
                  onClick={() => scrollTo("#bench")}
                >
                  {c.ledger.summary.take} <span className="arw">↗</span>
                </button>
              </>
            ) : (
              <>
                <span className="ledger__summary-value ledger__summary-value--empty">
                  {c.ledger.summary.empty}
                </span>
                <span className="ledger__summary-meta mono">
                  {c.ledger.summary.emptyMeta}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="ledger__foot">
          <p className="ledger__terms">
            {c.ledger.foot.terms}
          </p>
          <p className="footnote">
            {c.ledger.foot.footnote}
          </p>
          <span className="stamp ledger__stamp">{c.ledger.foot.stamp}</span>
        </div>
      </div>
    </section>
  );
}
