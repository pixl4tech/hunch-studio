export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function hex2rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export function mixHex(a: string, b: string, t: number) {
  const A = hex2rgb(a);
  const B = hex2rgb(b);
  const c = A.map((v, i) => Math.round(lerp(v, B[i], clamp(t))));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

/** Three-stop interpolation for the warmth fader. */
export function warmthColor(t: number) {
  if (t < 0.5) return mixHex("#d8ff45", "#ff4d18", t * 2);
  return mixHex("#ff4d18", "#a78bff", (t - 0.5) * 2);
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
