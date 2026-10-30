import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { warmthColor } from "./util";

export type Vibe = { warmth: number; grain: number; tempo: number };
export type Tier = "sprint" | "build" | "date" | null;

const HOUSE: Vibe = { warmth: 0.58, grain: 0.32, tempo: 0.42 };

type Ctx = {
  vibe: Vibe;
  setVibe: (patch: Partial<Vibe>) => void;
  resetVibe: () => void;
  tier: Tier;
  setTier: (t: Tier) => void;
};

const VibeContext = createContext<Ctx>({
  vibe: HOUSE,
  setVibe: () => {},
  resetVibe: () => {},
  tier: null,
  setTier: () => {},
});

export function VibeProvider({ children }: { children: ReactNode }) {
  const [vibe, setV] = useState<Vibe>(HOUSE);
  const [tier, setTier] = useState<Tier>(null);

  const setVibe = (patch: Partial<Vibe>) => setV((v) => ({ ...v, ...patch }));
  const resetVibe = () => setV(HOUSE);

  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty("--hot", warmthColor(vibe.warmth));
    r.style.setProperty("--grain-op", (0.04 + vibe.grain * 0.16).toFixed(3));
    r.style.setProperty("--tempo", (0.55 + vibe.tempo * 1.9).toFixed(2));
  }, [vibe]);

  const value = useMemo(
    () => ({ vibe, setVibe, resetVibe, tier, setTier }),
    [vibe, tier],
  );

  return <VibeContext.Provider value={value}>{children}</VibeContext.Provider>;
}

export const useVibe = () => useContext(VibeContext);
