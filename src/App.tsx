import { useEffect, useState } from "react";
import { Boot, Cursor, Dock, Grain, InkTrail, NextStrip, Rails, type PlateRef } from "./components/chrome";
import { Signal } from "./components/Signal";
import { Bin } from "./components/Bin";
import { PatchBay } from "./components/PatchBay";
import { Fugue } from "./components/Fugue";
import { Ledger } from "./components/Ledger";
import { Seance } from "./components/Seance";
import { Bench } from "./components/Bench";
import { SignOff } from "./components/SignOff";
import { VibeProvider } from "./lib/vibe";
import { initLenis, lockScroll } from "./lib/scroll";
import { prefersReducedMotion } from "./lib/util";
import { PLATES as PLATE_META } from "./lib/plates";

const PLATES: PlateRef[] = PLATE_META.map(({ id, label, no }) => ({ id, label, no }));

export default function App() {
  const [booting, setBooting] = useState(true);
  const [inkOn, setInkOn] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    initLenis();
    setInkOn(!prefersReducedMotion() && window.matchMedia("(pointer: fine)").matches);
  }, []);

  useEffect(() => {
    lockScroll(booting);
    document.documentElement.classList.toggle("is-booting", booting);
    document.body.classList.toggle("is-booting", booting);
    if (!booting) {
      document.documentElement.classList.add("is-loaded");
    }
  }, [booting]);

  useEffect(() => {
    if (booting) return;
    const els = PLATES.map((p) => document.getElementById(p.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const i = els.indexOf(entry.target as HTMLElement);
            if (i >= 0) setActive(i);
          }
        }
      },
      { rootMargin: "-42% 0px -52% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [booting]);

  return (
    <VibeProvider>
      {booting && (
        <Boot
          onReveal={() => document.documentElement.classList.add("is-loaded")}
          onDone={() => setBooting(false)}
        />
      )}
      <a className="skip-link" href="#main">
        Skip to the plates
      </a>
      <Grain />
      <Cursor />
      <Rails />
      <InkTrail enabled={inkOn && !booting} />

      <main id="main">
        <Signal />
        <NextStrip
          no="01"
          label="The Bin"
          note="six things we killed, with autopsies"
          to="bin"
          bg="var(--orange)"
          fg="var(--ink)"
        />
        <Bin />
        <NextStrip
          no="02"
          label="The Patch Bay"
          note="pull a cable, get a spec"
          to="patch"
          bg="var(--paper)"
          fg="var(--ink)"
        />
        <PatchBay />
        <NextStrip
          no="03"
          label="The Fugue"
          note="five movements, one score"
          to="fugue"
          bg="var(--cobalt)"
          fg="var(--bone)"
        />
        <Fugue />
        <NextStrip
          no="04"
          label="The Ledger"
          note="three tickets, no feature grid"
          to="ledger"
          bg="var(--paper)"
          fg="var(--ink)"
        />
        <Ledger />
        <NextStrip
          no="05"
          label="The Séance"
          note="six frequencies, some static"
          to="seance"
          bg="var(--orange)"
          fg="var(--ink)"
        />
        <Seance />
        <NextStrip
          no="06"
          label="The Bench"
          note="tune the site, then send a hunch"
          to="bench"
          bg="var(--paper)"
          fg="var(--ink)"
        />
        <Bench />
        <NextStrip
          no="07"
          label="Sign-Off"
          note="the issue ends, the studio doesn’t"
          to="signoff"
          bg="var(--orange)"
          fg="var(--ink)"
        />
        <SignOff />
      </main>

      <Dock plates={PLATES} active={active} inkOn={inkOn} onToggleInk={() => setInkOn((v) => !v)} />
    </VibeProvider>
  );
}
