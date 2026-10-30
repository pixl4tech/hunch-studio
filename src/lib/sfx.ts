/**
 * UI SOUNDS — the physical layer of the issue.
 *
 * Everything is synthesised here, no samples. The palette follows the
 * materials of the page: paper, ink, metal jacks, a radio dial, wax, and
 * switches. All sounds are short, quiet and randomised a little so repeated
 * interactions do not turn into a ringtone.
 *
 * Enabled only by the global SOUND switch in the dock menu. If it is off,
 * play() returns immediately and no AudioContext is ever created.
 */

export type SfxName =
  | "switch"
  | "relay"
  | "tick"
  | "page"
  | "paper"
  | "paperDrag"
  | "tear"
  | "stamp"
  | "plug"
  | "dial"
  | "fader"
  | "ink"
  | "wobble"
  | "plop"
  | "success"
  | "type"
  | "whoosh"
  | "transport"
  | "needle";

const MIN_GAP: Partial<Record<SfxName, number>> = {
  fader: 70,
  dial: 80,
  tick: 35,
  type: 45,
  paperDrag: 90,
  needle: 80,
  wobble: 120,
};

let enabled = false;
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let verb: GainNode | null = null;
let noise: AudioBuffer | null = null;
const last: Partial<Record<SfxName, number>> = {};

/** Called from the SOUND switch, inside the click gesture. */
export function setSfxEnabled(on: boolean): void {
  enabled = on;
  if (on) {
    if (master && ctx) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
      master.gain.linearRampToValueAtTime(0.5, now + 0.12);
    }
  } else if (master && ctx) {
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now);
    master.gain.linearRampToValueAtTime(0.0001, now + 0.08);
  }
}

export function isSfxEnabled(): boolean {
  return enabled;
}

function ensure(): boolean {
  if (ctx) {
    if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    return true;
  }
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return false;
  const c = new Ctor();
  ctx = c;

  const m = c.createGain();
  m.gain.value = 0.5;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -20;
  comp.knee.value = 12;
  comp.ratio.value = 3.4;
  comp.attack.value = 0.004;
  comp.release.value = 0.12;
  m.connect(comp);
  comp.connect(c.destination);
  master = m;

  // A very short room; enough to let paper and stamps sit in the page.
  const len = Math.floor(c.sampleRate * 0.75);
  const ir = c.createBuffer(2, len, c.sampleRate);
  let seed = 0x9e3779b9;
  const rnd = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let energy = 0;
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    let lp = 0;
    const a = 1 - Math.exp((-2 * Math.PI * 3800) / c.sampleRate);
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const raw = (rnd() * 2 - 1) * Math.pow(1 - t, 3);
      lp += a * (raw - lp);
      d[i] = lp;
      energy += lp * lp;
    }
  }
  const norm = 1 / Math.sqrt(Math.max(1e-9, energy));
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] *= norm;
  }
  const conv = c.createConvolver();
  conv.buffer = ir;
  const wet = c.createGain();
  wet.gain.value = 0.18;
  const send = c.createGain();
  send.gain.value = 1;
  send.connect(conv);
  conv.connect(wet);
  wet.connect(m);
  verb = send;

  noise = c.createBuffer(1, Math.floor(c.sampleRate * 0.8), c.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
  return true;
}

export function playSfx(name: SfxName, velocity = 1): void {
  if (!enabled) return;
  if (!ensure() || !ctx || !master) return;
  const gap = MIN_GAP[name] ?? 60;
  const now = performance.now();
  if (now - (last[name] ?? 0) < gap) return;
  last[name] = now;

  const t = ctx.currentTime + 0.004;
  const v = Math.max(0.2, Math.min(1.2, velocity));
  const jitter = 0.94 + Math.random() * 0.12;

  const out = ctx.createGain();
  out.gain.value = 1;
  out.connect(master);
  const send = (amount: number) => {
    if (!verb) return;
    const s = ctx!.createGain();
    s.gain.value = amount;
    out.connect(s);
    s.connect(verb);
  };
  const nz = () => {
    const s = ctx!.createBufferSource();
    s.buffer = noise;
    return s;
  };
  const env = (peak: number, attack: number, decay: number, at = t) => {
    const g = ctx!.createGain();
    g.gain.value = 0;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0004, peak * v), at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
    return g;
  };
  const click = (
    freq: number,
    peak: number,
    decay: number,
    type: OscillatorType = "triangle",
    at = t,
  ) => {
    const g = env(peak, 0.002, decay, at);
    const o = ctx!.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq * jitter, at);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.55), at + decay * 0.8);
    o.connect(g);
    g.connect(out);
    o.start(at);
    o.stop(at + decay + 0.02);
  };
  const fizz = (
    freq: number,
    q: number,
    peak: number,
    decay: number,
    type: BiquadFilterType = "bandpass",
    at = t,
  ) => {
    const s = nz();
    const f = ctx!.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq * jitter;
    f.Q.value = q;
    const g = env(peak, 0.003, decay, at);
    s.connect(f);
    f.connect(g);
    g.connect(out);
    s.start(at);
    s.stop(at + decay + 0.02);
  };

  switch (name) {
    case "switch":
      click(1100, 0.09, 0.045);
      fizz(3600, 1.2, 0.025, 0.028);
      click(760, 0.05, 0.03, "triangle", t + 0.044);
      break;

    case "relay":
      click(520, 0.1, 0.055, "square");
      fizz(2200, 1.4, 0.03, 0.045);
      break;

    case "tick":
      fizz(2800, 1.5, 0.035, 0.022);
      click(1500, 0.025, 0.02);
      break;

    case "page":
      fizz(480, 0.9, 0.03, 0.3, "bandpass");
      click(130, 0.06, 0.09, "sine");
      break;

    case "paper":
      fizz(1900, 1.2, 0.05, 0.055);
      click(420, 0.04, 0.04);
      break;

    case "paperDrag":
      for (let i = 0; i < 4; i++) {
        const s = nz();
        const f = ctx.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = 1500 + i * 380 + Math.random() * 300;
        f.Q.value = 1.4;
        const g = ctx.createGain();
        const at = t + i * 0.02;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.022 * v, at + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.035);
        s.connect(f);
        f.connect(g);
        g.connect(out);
        s.start(at);
        s.stop(at + 0.05);
      }
      break;

    case "tear": {
      // A broad rip plus a crackle: eight small breaks along the perforation.
      fizz(2600, 0.9, 0.045, 0.28);
      for (let i = 0; i < 8; i++) {
        const s = nz();
        const f = ctx.createBiquadFilter();
        f.type = "bandpass";
        f.frequency.value = 3400 - i * 260 + Math.random() * 300;
        f.Q.value = 2.2;
        const g = ctx.createGain();
        const at = t + 0.01 + i * 0.022;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.03 * v, at + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, at + 0.018);
        s.connect(f);
        f.connect(g);
        g.connect(out);
        s.start(at);
        s.stop(at + 0.03);
      }
      click(180, 0.03, 0.08, "sine");
      send(0.2);
      break;
    }

    case "stamp":
      click(110, 0.18, 0.16, "sine");
      fizz(900, 0.8, 0.07, 0.11, "lowpass");
      fizz(1600, 1.4, 0.03, 0.05);
      send(0.25);
      break;

    case "plug":
      click(180, 0.1, 0.07, "triangle");
      click(420, 0.05, 0.04, "square");
      fizz(2600, 1.6, 0.035, 0.03);
      click(240, 0.04, 0.04, "triangle", t + 0.055);
      break;

    case "dial":
      fizz(2400, 1.6, 0.035, 0.02);
      click(820, 0.04, 0.035);
      fizz(3100, 0.8, 0.012, 0.08);
      break;

    case "fader":
      fizz(1000, 1.8, 0.018, 0.06);
      click(300, 0.018, 0.03);
      break;

    case "ink":
      fizz(700, 0.7, 0.05, 0.24, "lowpass");
      click(150, 0.05, 0.15, "sine");
      send(0.3);
      break;

    case "wobble":
      click(170, 0.07, 0.22, "sine");
      click(240, 0.03, 0.16, "triangle");
      break;

    case "plop":
      click(120, 0.09, 0.14, "sine");
      fizz(600, 0.9, 0.02, 0.08, "lowpass");
      break;

    case "success":
      click(660, 0.055, 0.22, "sine");
      click(990, 0.045, 0.24, "sine", t + 0.09);
      fizz(2200, 1.3, 0.025, 0.05);
      send(0.25);
      break;

    case "type":
      fizz(3400, 1.6, 0.018, 0.014);
      click(1050, 0.018, 0.016);
      break;

    case "whoosh":
      fizz(420, 0.7, 0.04, 0.5, "bandpass");
      click(110, 0.05, 0.14, "sine");
      break;

    case "transport":
      click(80, 0.12, 0.14, "sine");
      fizz(3000, 1.4, 0.03, 0.04);
      click(220, 0.04, 0.28, "sawtooth");
      break;

    case "needle":
      fizz(4200, 1.8, 0.018, 0.035);
      click(1900, 0.015, 0.02);
      break;
  }

  window.setTimeout(() => {
    try {
      out.disconnect();
    } catch {
      /* already gone */
    }
  }, 900);
}
