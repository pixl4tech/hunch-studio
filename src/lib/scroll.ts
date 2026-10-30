import Lenis from "lenis";

let lenis: Lenis | null = null;

export function initLenis() {
  if (lenis) return lenis;
  lenis = new Lenis({
    lerp: 0.085,
    wheelMultiplier: 0.9,
    touchMultiplier: 1.4,
    autoRaf: true,
  });
  return lenis;
}

export function getLenis() {
  return lenis;
}

export function scrollTo(target: string | number | HTMLElement, offset = 0) {
  if (lenis) {
    lenis.scrollTo(target, { offset, duration: 1.35 });
  } else if (typeof target === "string") {
    document.querySelector(target)?.scrollIntoView({ behavior: "smooth" });
  } else if (typeof target === "number") {
    window.scrollTo({ top: target + offset, behavior: "smooth" });
  } else {
    target.scrollIntoView({ behavior: "smooth" });
  }
}

export function lockScroll(locked: boolean) {
  if (!lenis) return;
  if (locked) lenis.stop();
  else lenis.start();
}
