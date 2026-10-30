import type { CSSProperties } from "react";
import { useVibe } from "../lib/vibe";
import { scrollTo } from "../lib/scroll";
import { playSfx } from "../lib/sfx";

type Ticket = {
  id: "sprint" | "build" | "date";
  mode: string;
  name: string;
  duration: string;
  price: string;
  priceNote: string;
  seat: string;
  header: string;
  headerFg: string;
  brief: string;
  includes: string[];
  bestFor: string;
  note: string;
  tilt: number;
  drop: number;
};

const TICKETS: Ticket[] = [
  {
    id: "sprint",
    mode: "Steerage",
    name: "The Sprint",
    duration: "2 weeks",
    price: "€18,000",
    priceNote: "flat · excl. VAT",
    seat: "04 · A",
    header: "var(--orange)",
    headerFg: "var(--ink)",
    brief:
      "One surface, one loop, one ship. For the product that is almost right and knows it.",
    includes: [
      "Discovery call + an eleven-word brief",
      "One 72-hour loop, ugly on purpose",
      "One shipped surface, polished by ear",
      "Two weeks of aftercare, no ticket theatre",
    ],
    bestFor: "a product with a feeling that’s slightly off.",
    note: "Standing room. Fast. No seatbelts.",
    tilt: -1.6,
    drop: 18,
  },
  {
    id: "build",
    mode: "Cabin",
    name: "The Build",
    duration: "6—10 weeks",
    price: "€48,000+",
    priceNote: "fixed scope · excl. VAT",
    seat: "04 · B",
    header: "var(--cobalt)",
    headerFg: "var(--bone)",
    brief:
      "A whole product, from hunch to launch. For the blank page with a budget and a date.",
    includes: [
      "Everything in the sprint, plus:",
      "Full interface: screens, states, words",
      "Build: data, logic, plumbing",
      "A motion and sound pass",
      "Launch week + a thirty-day lull",
    ],
    bestFor: "a hunch, a blank page, and a date.",
    note: "Window seat. Meals included. We bring the maps.",
    tilt: 1.2,
    drop: 0,
  },
  {
    id: "date",
    mode: "Bridge",
    name: "The Standing Date",
    duration: "monthly · 3 mo min",
    price: "€14,000",
    priceNote: "per month · excl. VAT",
    seat: "04 · C",
    header: "var(--ink)",
    headerFg: "var(--bone)",
    brief:
      "A studio on a leash. For the team that wants taste on tap without a hiring round.",
    includes: [
      "Two days a week with us",
      "A line that is always open",
      "One loop per month, on anything",
      "First refusal on the big things",
    ],
    bestFor: "you want taste on tap without the payroll.",
    note: "The bridge. You can see where we’re going. We can see where you are.",
    tilt: -1.1,
    drop: 30,
  },
];

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
  const { tier, setTier } = useVibe();
  const selected = TICKETS.find((t) => t.id === tier) ?? null;

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
              <span className="lit">Plate 04</span>
              <span className="sep">/</span>
              <span>The Ledger</span>
              <span className="sep">/</span>
              <span>Ways in</span>
            </p>
            <h2 className="ledger__title" id="ledger-title">
              Three ways
              <br />
              <em>in.</em>
            </h2>
          </div>
          <div className="ledger__head-note">
            <p className="lede">
              We sell time, not packages. No feature grids, no “contact us for pricing”. Three ways
              to have us — same hands, same hours, same refusal to call it a solution.
            </p>
            <div className="ledger__meta">
              <span className="mono">Prices in EUR / excl. VAT</span>
              <span className="mono">Deposit 50% / balance on ship</span>
              <span className="mono">Seats are metaphorical</span>
            </div>
          </div>
        </header>

        <div className="ledger__desk">
          <div className="ledger__desk-head">
            <span className="mono">Box office / open 09:00—18:00 CET</span>
            <span className="mono">Ticket book Nº 04 / three stubs</span>
            <span className="mono">Click a ticket to stamp it</span>
          </div>

          <div className="ledger__tickets">
            {TICKETS.map((t) => {
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
                  aria-label={`${t.mode}, ${t.name}, ${t.duration}, ${t.price}. Select this ticket.`}
                  data-cursor={isSelected ? "UNSTAMP" : "STAMP IT"}
                >
                  <div className="ticket__main">
                    <div className="ticket__head" style={{ background: t.header, color: t.headerFg }}>
                      <span>{t.mode}</span>
                      <span>Seat {t.seat}</span>
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
                        <span className="mono">Best for /</span> {t.bestFor}
                      </p>
                      <p className="ticket__note">{t.note}</p>
                    </div>
                    <div className="ticket__foot">
                      <span className="mono">Transferable · non-refundable</span>
                      <span className="mono">HUNCH / 03</span>
                    </div>
                    <div className="ticket__stamp" aria-hidden="true">
                      Admitted
                    </div>
                  </div>

                  <div className="ticket__stub">
                    <span className="ticket__stub-cut" aria-hidden="true" />
                    <span className="ticket__vertical">Hunch · Admit one</span>
                    <Barcode n={18} />
                    <span className="ticket__seat">{t.seat}</span>
                    <span className="ticket__arrow" aria-hidden="true">→</span>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="ledger__summary" aria-live="polite">
            <span className="ledger__summary-label mono">Selected ticket</span>
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
                  Take this ticket <span className="arw">↗</span>
                </button>
              </>
            ) : (
              <>
                <span className="ledger__summary-value ledger__summary-value--empty">
                  None. The box office is open.
                </span>
                <span className="ledger__summary-meta mono">
                  Pick a stub above — the stamp is real, the seat is a metaphor.
                </span>
              </>
            )}
          </div>
        </div>

        <div className="ledger__foot">
          <p className="ledger__terms">
            Tickets are transferable. Deposits are 50%. Refunds are not. Invoices are boring on
            purpose.
          </p>
          <p className="footnote">
            Payment plans exist. So does barter, occasionally, if it’s interesting. We have never used
            the word “synergy” in a deliverable.
          </p>
          <span className="stamp ledger__stamp">Prices are real</span>
        </div>
      </div>
    </section>
  );
}
