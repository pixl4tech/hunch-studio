type Cb = (t: number, dt: number) => void;

const subs = new Set<Cb>();
let raf = 0;
let last = 0;

function loop(t: number) {
  const dt = Math.min(64, t - last);
  last = t;
  for (const cb of subs) cb(t / 1000, dt / 1000);
  raf = requestAnimationFrame(loop);
}

/** A single shared animation loop. Returns an unsubscribe fn. */
export function onTick(cb: Cb) {
  subs.add(cb);
  if (!raf) {
    last = performance.now();
    raf = requestAnimationFrame(loop);
  }
  return () => {
    subs.delete(cb);
    if (subs.size === 0) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  };
}
