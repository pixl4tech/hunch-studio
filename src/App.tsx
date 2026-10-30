import { useEffect, useRef, useState } from "react";
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
import { getMusicPlayer } from "./lib/music";
import { playSfx, setSfxEnabled, type SfxName } from "./lib/sfx";
import { PLATES as PLATE_META } from "./lib/plates";

const PLATES: PlateRef[] = PLATE_META.map(({ id, label, no }) => ({ id, label, no }));

const readPref = (key: string): boolean => {
  try {
    return localStorage.getItem(key) === "on";
  } catch {
    return false;
  }
};

const writePref = (key: string, on: boolean) => {
  try {
    localStorage.setItem(key, on ? "on" : "off");
  } catch {
    /* private mode */
  }
};

export default function App() {
  const [booting, setBooting] = useState(true);
  const [inkOn, setInkOn] = useState(false);
  const [soundOn, setSoundOn] = useState(() => readPref("hunch:sound"));
  const [musicOn, setMusicOn] = useState(() => readPref("hunch:music") && readPref("hunch:sound"));
  const [active, setActive] = useState(0);
  const firstAudioRun = useRef(true);

  useEffect(() => {
    initLenis();
    setInkOn(!prefersReducedMotion() && window.matchMedia("(pointer: fine)").matches);
    if (readPref("hunch:sound") && readPref("hunch:music")) {
      // A stored "on" still needs a gesture: arm the loop, don't autoplay.
      getMusicPlayer().arm();
    }
  }, []);

  useEffect(() => {
    setSfxEnabled(soundOn);
  }, [soundOn]);

  /** One delegated gesture map for every element that carries data-sfx. */
  useEffect(() => {
    const fire = (target: Element | null) => {
      const el = target?.closest?.("[data-sfx]");
      const name = el?.getAttribute("data-sfx") as SfxName | null;
      if (name) playSfx(name);
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      fire(e.target as Element | null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") fire(e.target as Element | null);
    };
    document.addEventListener("pointerdown", onDown, { capture: true });
    document.addEventListener("keydown", onKey, { capture: true });
    return () => {
      document.removeEventListener("pointerdown", onDown, { capture: true });
      document.removeEventListener("keydown", onKey, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (firstAudioRun.current) {
      firstAudioRun.current = false;
      return;
    }
    const music = getMusicPlayer();
    if (soundOn && musicOn) music.setEnabled(true);
    else music.setEnabled(false);
  }, [soundOn, musicOn]);

  const toggleSound = () => {
    const next = !soundOn;
    if (!next) playSfx("switch");
    setSoundOn(next);
    setSfxEnabled(next);
    writePref("hunch:sound", next);
    if (next) {
      playSfx("switch");
    } else {
      setMusicOn(false);
      writePref("hunch:music", false);
    }
  };

  const toggleMusic = () => {
    const next = !musicOn;
    if (next && !soundOn) {
      setSoundOn(true);
      setSfxEnabled(true);
      writePref("hunch:sound", true);
    }
    playSfx("switch");
    setMusicOn(next);
    writePref("hunch:music", next);
  };

  const enableSound = () => {
    if (soundOn) return;
    setSoundOn(true);
    setSfxEnabled(true);
    writePref("hunch:sound", true);
  };

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
        <Fugue soundOn={soundOn} onEnableSound={enableSound} />
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

      <Dock
        plates={PLATES}
        active={active}
        inkOn={inkOn}
        onToggleInk={() => setInkOn((v) => !v)}
        soundOn={soundOn}
        musicOn={musicOn}
        onToggleSound={toggleSound}
        onToggleMusic={toggleMusic}
      />
    </VibeProvider>
  );
}
