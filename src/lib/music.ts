/**
 * HUNCH FM — background music for the whole issue.
 *
 * An original 32-bar synth piece in A minor at 92 BPM (~83 s), sample-free:
 * analog-style pads, a syncopated bass, 16th-note arpeggios through a
 * dotted-eighth delay, a lyrical lead with portamento and vibrato, and a
 * restrained drum machine. The harmony is Am9 – Fmaj9 – Cmaj7 – G6 with a
 * Dm7 – E7♭9 turn at the end: melodic retrowave, but the borrowed b9 keeps
 * the cyberpunk edge.
 *
 * It is deliberately quiet and loops forever. The Fugue can duck it via
 * duck()/release(); the dock toggle owns enable/disable.
 */

const BPM = 92;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
const LOOP_BARS = 32;
const LEVEL = 0.58;

type Chord = { pad: number[]; arp: number[]; root: number; fifth: number };

/** Two bars each. The eighth chord is the dark one. */
const CHORDS: Chord[] = [
  { pad: [57, 60, 64, 67], arp: [69, 72, 76, 79], root: 45, fifth: 52 }, // Am7
  { pad: [53, 57, 60, 64], arp: [65, 69, 72, 76], root: 41, fifth: 48 }, // Fmaj7
  { pad: [48, 55, 59, 64], arp: [67, 72, 76, 79], root: 36, fifth: 43 }, // Cmaj7
  { pad: [55, 59, 62, 64], arp: [67, 71, 74, 79], root: 43, fifth: 50 }, // G6
  { pad: [57, 60, 64, 67], arp: [69, 72, 76, 79], root: 45, fifth: 52 }, // Am7
  { pad: [53, 57, 60, 64], arp: [65, 69, 72, 76], root: 41, fifth: 48 }, // Fmaj7
  { pad: [50, 57, 60, 65], arp: [62, 65, 69, 72], root: 38, fifth: 45 }, // Dm7
  { pad: [52, 56, 59, 62], arp: [64, 68, 71, 74], root: 40, fifth: 47 }, // E7
];

const ARP_STEPS = [0, 1, 2, 3, 2, 1, 0, 2, 1, 3, 2, 0, 1, 3, 2, 1];

/** [beat in bar, midi, duration in beats, velocity] */
type LeadNote = [number, number, number, number];

const LEAD: Record<number, LeadNote[]> = {
  16: [
    [0.5, 76, 1.25, 0.55],
    [2, 74, 0.75, 0.45],
    [3, 72, 1, 0.45],
  ],
  17: [
    [0.5, 71, 1, 0.42],
    [1.75, 69, 1, 0.4],
    [3, 72, 0.5, 0.4],
    [3.5, 76, 0.5, 0.42],
  ],
  18: [
    [0.5, 69, 1.25, 0.45],
    [2, 72, 0.5, 0.4],
    [2.75, 76, 1, 0.5],
  ],
  19: [
    [0.5, 77, 1, 0.52],
    [1.75, 76, 0.75, 0.45],
    [2.75, 72, 1.25, 0.42],
  ],
  20: [
    [0.5, 67, 0.75, 0.4],
    [1.5, 71, 0.75, 0.4],
    [2.5, 72, 1, 0.45],
    [3.5, 76, 0.5, 0.42],
  ],
  21: [
    [0.5, 79, 1, 0.5],
    [1.75, 76, 0.75, 0.45],
    [2.75, 74, 1, 0.42],
  ],
  22: [
    [0.5, 71, 0.75, 0.4],
    [1.5, 74, 0.75, 0.42],
    [2.5, 79, 0.75, 0.45],
    [3.5, 76, 0.5, 0.42],
  ],
  23: [
    [0.5, 74, 1, 0.45],
    [1.75, 71, 0.75, 0.4],
    [2.75, 67, 1.5, 0.42],
  ],
  24: [
    [0.5, 69, 0.5, 0.4],
    [1, 72, 0.5, 0.4],
    [1.5, 76, 0.75, 0.45],
    [2.5, 81, 1.25, 0.55],
  ],
  25: [
    [0.5, 79, 0.75, 0.48],
    [1.5, 76, 0.75, 0.45],
    [2.5, 72, 1, 0.45],
  ],
  26: [
    [0.5, 77, 0.75, 0.45],
    [1.5, 76, 0.75, 0.45],
    [2.5, 72, 1, 0.42],
  ],
  27: [
    [0.5, 69, 1, 0.45],
    [1.5, 72, 0.5, 0.4],
    [2, 76, 1.25, 0.5],
  ],
  28: [
    [0.5, 74, 0.75, 0.42],
    [1.5, 77, 0.75, 0.45],
    [2.5, 81, 0.75, 0.5],
    [3.5, 79, 0.5, 0.45],
  ],
  29: [
    [0.5, 77, 1, 0.48],
    [1.75, 76, 0.75, 0.42],
    [2.75, 74, 0.75, 0.42],
    [3.5, 72, 0.5, 0.4],
  ],
  30: [
    [0.5, 71, 0.75, 0.48],
    [1.5, 74, 0.5, 0.45],
    [2, 76, 0.75, 0.45],
    [3, 74, 0.6, 0.4],
  ],
  31: [
    [0.5, 68, 0.75, 0.42],
    [1.5, 69, 1.5, 0.5],
  ],
};

const hz = (pitch: number) => 440 * Math.pow(2, (pitch - 69) / 12);

export class MusicPlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private pump: GainNode | null = null;
  private verbSend: GainNode | null = null;
  private delaySend: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private busM: GainNode | null = null;
  private busD: GainNode | null = null;
  private timer = 0;
  private nextTime = 0;
  private bar = 0;
  private looped = false;
  private lastLead = 0;
  private playing = false;
  private enabled = false;
  private ducked = false;
  private explicit = false;
  private briefTimer = 0;
  private armed = false;
  private armDrop: (() => void) | null = null;

  constructor(private injected?: AudioContext) {}

  ensure(): boolean {
    if (this.ctx) {
      if (!this.injected && this.ctx.state === "suspended") {
        void this.ctx.resume().catch(() => {});
      }
      return true;
    }
    let ctx: AudioContext;
    if (this.injected) {
      ctx = this.injected;
    } else {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return false;
      ctx = new Ctor();
    }
    this.ctx = ctx;

    let seed = 0x51f15e;
    const rnd = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const master = ctx.createGain();
    master.gain.value = 0;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 18;
    comp.ratio.value = 3;
    comp.attack.value = 0.008;
    comp.release.value = 0.25;
    const limit = ctx.createDynamicsCompressor();
    limit.threshold.value = -1.5;
    limit.knee.value = 0;
    limit.ratio.value = 20;
    limit.attack.value = 0.002;
    limit.release.value = 0.12;
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) {
      const x = i / 1023.5 - 1;
      curve[i] = (0.85 * Math.tanh(x * 1.15)) / Math.tanh(1.15);
    }
    shaper.curve = curve;
    shaper.oversample = "2x";
    master.connect(comp);
    comp.connect(limit);
    limit.connect(shaper);
    shaper.connect(ctx.destination);
    this.master = master;

    // Everything the music makes passes through this filter, so ducking is a
    // little radio receding rather than a hard mute.
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 12000;
    filter.Q.value = 0.4;
    filter.connect(master);
    this.filter = filter;

    const pump = ctx.createGain();
    pump.gain.value = 1;
    pump.connect(filter);
    this.pump = pump;

    // A 2.4 s hall with a dark, smooth tail. Seeded, deterministic, and
    // normalised by energy so the score controls the balance.
    const len = Math.max(1, Math.floor(ctx.sampleRate * 2.4));
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    let energy = 0;
    const smooth = 1 - Math.exp((-2 * Math.PI * 3400) / ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const attack = i < 120 ? i / 120 : 1;
        const raw = (rnd() * 2 - 1) * Math.pow(1 - t, 2.6) * attack;
        lp += smooth * (raw - lp);
        data[i] = lp;
        energy += lp * lp;
      }
    }
    const norm = 1 / Math.sqrt(Math.max(1e-9, energy));
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) data[i] *= norm;
    }
    const verb = ctx.createConvolver();
    verb.buffer = ir;
    const verbWet = ctx.createGain();
    verbWet.gain.value = 0.46;
    verb.connect(verbWet);
    verbWet.connect(filter);
    const verbSend = ctx.createGain();
    verbSend.gain.value = 1;
    verbSend.connect(verb);
    this.verbSend = verbSend;

    // Dotted-eighth delay, plus a slower second tap for width.
    const delaySend = ctx.createGain();
    delaySend.gain.value = 1;
    const taps = [
      { time: BEAT * 0.75, pan: -0.45, level: 0.32 },
      { time: BEAT * 1.5, pan: 0.5, level: 0.2 },
    ];
    for (const tap of taps) {
      const d = ctx.createDelay(4);
      d.delayTime.value = tap.time;
      const fb = ctx.createGain();
      fb.gain.value = 0.32;
      const damp = ctx.createBiquadFilter();
      damp.type = "lowpass";
      damp.frequency.value = 2800;
      const wet = ctx.createGain();
      wet.gain.value = tap.level;
      const pan = ctx.createStereoPanner();
      pan.pan.value = tap.pan;
      delaySend.connect(d);
      d.connect(damp);
      damp.connect(fb);
      fb.connect(d);
      d.connect(wet);
      wet.connect(pan);
      pan.connect(filter);
    }
    this.delaySend = delaySend;

    this.noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1.5), ctx.sampleRate);
    const nd = this.noise.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;

    return true;
  }

  /** Arm playback for the next user gesture (a persisted "on" cannot autoplay). */
  arm(): void {
    if (this.armed || this.playing) return;
    this.armed = true;
    const go = () => {
      this.disarm();
      this.setEnabled(true);
    };
    window.addEventListener("pointerdown", go, { passive: true });
    window.addEventListener("keydown", go);
    this.armDrop = () => {
      window.removeEventListener("pointerdown", go);
      window.removeEventListener("keydown", go);
    };
  }

  private disarm(): void {
    this.armDrop?.();
    this.armDrop = null;
    this.armed = false;
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    if (on) {
      this.disarm();
      this.start();
    } else {
      this.disarm();
      this.stop();
    }
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  get isDucked(): boolean {
    return this.ducked;
  }

  private ramp(target: number, seconds: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    const g = this.master.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(Math.max(0, g.value), now);
    g.linearRampToValueAtTime(target, now + seconds);
    if (this.filter) {
      const f = this.filter.frequency;
      f.cancelScheduledValues(now);
      f.setValueAtTime(f.value, now);
      f.exponentialRampToValueAtTime(target > 0 ? 12000 : 480, now + seconds);
    }
  }

  start(): void {
    if (this.playing) return;
    if (!this.ensure()) return;
    const ctx = this.ctx!;
    this.playing = true;
    this.bar = 0;
    this.looped = false;
    this.lastLead = 0;
    this.nextTime = ctx.currentTime + 0.14;

    const busM = ctx.createGain();
    busM.gain.value = 1;
    busM.connect(this.pump!);
    const busD = ctx.createGain();
    busD.gain.value = 1;
    busD.connect(this.filter!);
    this.busM = busM;
    this.busD = busD;

    if (this.pump) {
      this.pump.gain.cancelScheduledValues(ctx.currentTime);
      this.pump.gain.setValueAtTime(1, ctx.currentTime);
    }

    this.ramp(this.ducked ? 0 : LEVEL, 1.3);
    this.pumpNow();
    this.timer = window.setInterval(() => this.pumpNow(), 260);
  }

  stop(): void {
    this.playing = false;
    window.clearInterval(this.timer);
    this.timer = 0;
    window.clearTimeout(this.briefTimer);
    this.briefTimer = 0;
    this.ramp(0, 0.7);
    const m = this.busM;
    const d = this.busD;
    this.busM = null;
    this.busD = null;
    window.setTimeout(() => {
      try {
        m?.disconnect();
      } catch {
        /* already gone */
      }
      try {
        d?.disconnect();
      } catch {
        /* already gone */
      }
    }, 1100);
  }

  /** Hard duck for the Fugue. Holds until release(). */
  duck(): void {
    this.explicit = true;
    window.clearTimeout(this.briefTimer);
    this.briefTimer = 0;
    this.ducked = true;
    this.ramp(0, 0.7);
  }

  /** Short duck for a needle entry. */
  duckFor(seconds: number): void {
    if (this.explicit) return;
    this.ducked = true;
    this.ramp(0, 0.45);
    window.clearTimeout(this.briefTimer);
    this.briefTimer = window.setTimeout(() => {
      this.briefTimer = 0;
      if (this.explicit) return;
      this.ducked = false;
      if (this.playing) this.ramp(LEVEL, 1.3);
    }, seconds * 1000);
  }

  release(): void {
    this.explicit = false;
    window.clearTimeout(this.briefTimer);
    this.briefTimer = 0;
    this.ducked = false;
    if (this.playing) this.ramp(LEVEL, 1.4);
  }

  private pumpNow(): void {
    const ctx = this.ctx;
    if (!ctx || !this.playing) return;
    const horizon = ctx.currentTime + 2.4;
    if (this.nextTime < ctx.currentTime + 0.02) {
      const missed = Math.ceil((ctx.currentTime + 0.02 - this.nextTime) / BAR);
      this.bar = (this.bar + missed) % LOOP_BARS;
      this.nextTime += missed * BAR;
    }
    let guard = 0;
    while (this.nextTime < horizon && guard < 8) {
      // One fresh bus per 32-bar cycle: a background track may run for hours,
      // and this keeps the WebAudio graph from growing without bound.
      if (this.bar === 0 && this.looped) this.rotateBuses(this.nextTime);
      this.scheduleBar(this.bar, this.nextTime);
      this.nextTime += BAR;
      this.bar = (this.bar + 1) % LOOP_BARS;
      if (this.bar === 0) this.looped = true;
      guard++;
    }
  }

  private rotateBuses(at: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const oldM = this.busM;
    const oldD = this.busD;
    const make = (dest: AudioNode) => {
      const g = ctx.createGain();
      g.gain.value = 1;
      g.connect(dest);
      return g;
    };
    this.busM = make(this.pump!);
    this.busD = make(this.filter!);
    for (const bus of [oldM, oldD]) {
      if (!bus) continue;
      const g = bus.gain;
      g.cancelScheduledValues(at);
      g.setValueAtTime(1, at);
      g.linearRampToValueAtTime(0.0001, at + 2.2);
      const delay = Math.max(0, (at - ctx.currentTime) * 1000) + 2400;
      window.setTimeout(() => {
        try {
          bus.disconnect();
        } catch {
          /* already gone */
        }
      }, delay);
    }
  }

  private scheduleBar(bar: number, t: number): void {
    const b = bar % LOOP_BARS;
    const chord = CHORDS[Math.floor(bar / 2) % CHORDS.length];
    const intro = b < 4;
    const outro = b >= 30;

    if (bar % 2 === 0) {
      this.pad(chord, t, (b === 30 ? BAR * 1.6 : BAR * 2) - 0.02);
    }

    if (b >= 2 && !outro) {
      this.arpBar(chord, t, intro ? 4 : 16, intro ? 0.55 : 1);
    }

    if (b >= 4 && !outro) {
      this.bassBar(chord, t, b);
      this.drums(t, b);
    }

    if (b === 3 || b === 7 || b === 15 || b === 23 || b === 29) {
      this.riser(t + BEAT * 2, BEAT * 2);
    }
    if (b === 4 || b === 8 || b === 16 || b === 24) {
      this.hit(t);
    }

    // The harmony runs Am–F–C–G | Am–F–Dm–E7. The first entry (bars 8–15)
    // therefore uses the Dm–E7 melody, the middle eight (16–23) the bright
    // Am–F–C–G one, and the last eight restate the dark version.
    if (b === 8 || b === 16 || b === 24) this.lastLead = 0;
    if (b >= 8 && b < 16) this.leadBar(b + 16, t);
    else if (b >= 16) this.leadBar(b, t);
  }

  private out(music: boolean): GainNode {
    const ctx = this.ctx!;
    const o = ctx.createGain();
    o.gain.value = 1;
    o.connect(music ? this.busM! : this.busD!);
    return o;
  }

  private send(node: AudioNode, wet: number, delay: number): void {
    if (wet > 0 && this.verbSend) {
      const g = this.ctx!.createGain();
      g.gain.value = wet;
      node.connect(g);
      g.connect(this.verbSend);
    }
    if (delay > 0 && this.delaySend) {
      const g = this.ctx!.createGain();
      g.gain.value = delay;
      node.connect(g);
      g.connect(this.delaySend);
    }
  }

  private noiseSrc(loop = false): AudioBufferSourceNode {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noise;
    src.loop = loop;
    return src;
  }

  private pad(chord: Chord, t: number, dur: number): void {
    const ctx = this.ctx!;
    const pans = [-0.55, 0.4, -0.2, 0.55, 0.15];
    chord.pad.forEach((pitch, i) => {
      const f = hz(pitch);
      const g = ctx.createGain();
      g.gain.value = 0;
      const vol = (i === 0 ? 0.02 : 0.014) * (i === chord.pad.length - 1 ? 0.8 : 1);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.75);
      g.gain.setValueAtTime(vol, t + dur * 0.82);
      g.gain.linearRampToValueAtTime(0, t + dur + 1.2);
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1050 + i * 70;
      lp.Q.value = 0.6;
      const pan = ctx.createStereoPanner();
      pan.pan.value = pans[i % pans.length];
      for (const detune of [-4, 4]) {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = f;
        o.detune.value = detune;
        o.connect(lp);
        o.start(t);
        o.stop(t + dur + 1.9);
      }
      lp.connect(g);
      g.connect(pan);
      pan.connect(this.out(true));
      this.send(g, 0.5, 0);
    });
  }

  private bassBar(chord: Chord, t: number, b: number): void {
    const pattern: [number, number, number][] = [
      [0, 0, 0.72],
      [0.75, 0, 0.5],
      [1.5, 7, 0.5],
      [2.5, 0, 0.6],
      [3.25, 12, 0.5],
    ];
    pattern.forEach(([beat, offset, dur], i) => {
      this.bass(hz(chord.root + offset), t + beat * BEAT, dur * BEAT, i === 0 ? 0.95 : 0.78);
    });
    if (b % 4 === 3) {
      this.bass(hz(chord.fifth), t + 3.75 * BEAT, 0.35 * BEAT, 0.55);
    }
  }

  private bass(f: number, t: number, dur: number, vel: number): void {
    const ctx = this.ctx!;
    const out = this.out(true);
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.075 * vel, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.16);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.Q.value = 1.3;
    lp.frequency.setValueAtTime(1400, t);
    lp.frequency.exponentialRampToValueAtTime(360, t + 0.22);
    const saw = ctx.createOscillator();
    saw.type = "sawtooth";
    saw.frequency.value = f;
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = f / 2;
    const sg = ctx.createGain();
    sg.gain.value = 0.55;
    saw.connect(lp);
    sub.connect(sg);
    sg.connect(lp);
    lp.connect(g);
    g.connect(out);
    this.send(g, 0.08, 0);
    saw.start(t);
    sub.start(t);
    saw.stop(t + dur + 0.25);
    sub.stop(t + dur + 0.25);
  }

  private arpBar(chord: Chord, t: number, steps: number, energy: number): void {
    const sparse = steps === 4;
    const pattern = sparse ? [0, 2, 1, 3] : ARP_STEPS;
    const spacing = sparse ? BEAT : BEAT / 4;
    const tone = sparse ? 2100 : energy > 0.9 ? 4200 : 3600;
    for (let i = 0; i < steps; i++) {
      const idx = pattern[i % pattern.length];
      const sparkle = i % 8 === 3 ? 12 : 0;
      const pitch = chord.arp[idx % chord.arp.length] + sparkle;
      const vel = (i % 4 === 0 ? 0.9 : 0.62) * energy;
      this.arp(hz(pitch), t + i * spacing, vel, i % 2 === 0 ? -0.32 : 0.32, tone);
    }
  }

  private arp(f: number, t: number, vel: number, panPos: number, tone = 3600): void {
    const ctx = this.ctx!;
    const out = this.out(true);
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.03 * vel, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = tone;
    lp.Q.value = 0.8;
    const pan = ctx.createStereoPanner();
    pan.pan.value = panPos;
    const a = ctx.createOscillator();
    a.type = "triangle";
    a.frequency.value = f;
    const b = ctx.createOscillator();
    b.type = "square";
    b.frequency.value = f * 1.003;
    const bg = ctx.createGain();
    bg.gain.value = 0.24;
    a.connect(lp);
    b.connect(bg);
    bg.connect(lp);
    lp.connect(g);
    g.connect(pan);
    pan.connect(out);
    this.send(g, 0.2, 0.55);
    a.start(t);
    b.start(t);
    a.stop(t + 0.36);
    b.stop(t + 0.36);
  }

  private leadBar(b: number, t: number): void {
    const notes = LEAD[b];
    if (!notes) return;
    for (const [beat, pitch, dur, vel] of notes) {
      this.lead(pitch, t + beat * BEAT, dur * BEAT, vel);
    }
  }

  private lead(pitch: number, t: number, dur: number, vel: number): void {
    const ctx = this.ctx!;
    const f = hz(pitch);
    const from = this.lastLead ? this.lastLead : f;
    this.lastLead = f;
    const out = this.out(true);
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.04 * vel, t + 0.035);
    g.gain.setValueAtTime(0.04 * vel, t + dur * 0.86);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.5);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.Q.value = 1.1;
    lp.frequency.setValueAtTime(1300, t);
    lp.frequency.exponentialRampToValueAtTime(2600, t + 0.14);
    lp.frequency.exponentialRampToValueAtTime(1400, t + 0.7);
    const pan = ctx.createStereoPanner();
    pan.pan.value = -0.12;
    const oscs: OscillatorNode[] = [];
    for (const detune of [-3.5, 3.5]) {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(from, t);
      o.frequency.exponentialRampToValueAtTime(f, t + 0.055);
      o.detune.value = detune;
      o.connect(lp);
      oscs.push(o);
    }
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.setValueAtTime(from / 2, t);
    sub.frequency.exponentialRampToValueAtTime(f / 2, t + 0.055);
    const sg = ctx.createGain();
    sg.gain.value = 0.14;
    sub.connect(sg);
    sg.connect(lp);
    oscs.push(sub);
    // A slow vibrato, the thing that makes a synth line sing.
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 5.1;
    const depth = ctx.createGain();
    depth.gain.setValueAtTime(0, t);
    depth.gain.linearRampToValueAtTime(f * 0.0035, t + 0.35);
    depth.gain.linearRampToValueAtTime(f * 0.0022, t + dur);
    lfo.connect(depth);
    depth.connect(lp.frequency);
    lp.connect(g);
    g.connect(pan);
    pan.connect(out);
    this.send(g, 0.52, 0.5);
    for (const o of oscs) {
      o.start(t);
      o.stop(t + dur + 0.6);
    }
    lfo.start(t);
    lfo.stop(t + dur + 0.6);
  }

  /** A dark eighth-note sequencer under the second half. It is the pulse
   *  that keeps the middle eight alive while the lead is silent. */
  private lowArp(chord: Chord, t: number): void {
    const shape = [0, 0, 7, 0, 12, 7, 0, 7];
    for (let i = 0; i < 8; i++) {
      const f = hz(chord.root + 12 + shape[i]);
      this.pulse(f, t + i * 0.5 * BEAT, i % 4 === 0 ? 0.85 : 0.55);
    }
  }

  private pulse(f: number, t: number, vel: number): void {
    const ctx = this.ctx!;
    const out = this.out(true);
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.022 * vel, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.21);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 980;
    lp.Q.value = 1.4;
    const o = ctx.createOscillator();
    o.type = "square";
    o.frequency.value = f;
    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = f / 2;
    const sg = ctx.createGain();
    sg.gain.value = 0.4;
    o.connect(lp);
    sub.connect(sg);
    sg.connect(lp);
    lp.connect(g);
    g.connect(out);
    this.send(g, 0.12, 0.3);
    o.start(t);
    sub.start(t);
    o.stop(t + 0.3);
    sub.stop(t + 0.3);
  }

  private drums(t: number, b: number): void {
    this.kick(t, 0.95);
    this.kick(t + 2.5 * BEAT, 0.8);
    if (b % 4 === 3) this.kick(t + 3.5 * BEAT, 0.55);
    for (let i = 0; i < 8; i++) {
      this.hat(t + i * 0.5 * BEAT, i % 2 === 0 ? 0.8 : 0.45, false);
    }
    if (b % 2 === 1) this.hat(t + 3.5 * BEAT, 0.5, true);
    if (b >= 12) this.snare(t + 2 * BEAT, 0.8);
    if (b >= 20 && b % 4 === 0) this.snare(t + 3.75 * BEAT, 0.28);
    if (b === 15 || b === 23 || b === 29) {
      // A short fill into the next section.
      this.snare(t + 3 * BEAT, 0.32);
      this.snare(t + 3.25 * BEAT, 0.42);
      this.snare(t + 3.5 * BEAT, 0.55);
    }
  }

  private kick(t: number, vel: number): void {
    const ctx = this.ctx!;
    const out = this.out(false);
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2 * vel, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(148, t);
    o.frequency.exponentialRampToValueAtTime(46, t + 0.09);
    o.connect(g);
    g.connect(out);
    o.start(t);
    o.stop(t + 0.38);
    if (this.pump) {
      const p = this.pump.gain;
      p.setValueAtTime(1, t);
      p.linearRampToValueAtTime(0.7, t + 0.012);
      p.linearRampToValueAtTime(1, t + 0.3);
    }
  }

  private snare(t: number, vel: number): void {
    const ctx = this.ctx!;
    const out = this.out(false);
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05 * vel, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.19);
    const nz = this.noiseSrc();
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1750;
    bp.Q.value = 1.1;
    nz.connect(bp);
    bp.connect(g);
    g.connect(out);
    this.send(g, 0.55, 0);
    nz.start(t);
    nz.stop(t + 0.22);
    const body = ctx.createOscillator();
    body.type = "triangle";
    body.frequency.setValueAtTime(190, t);
    body.frequency.exponentialRampToValueAtTime(120, t + 0.09);
    const bg = ctx.createGain();
    bg.gain.value = 0;
    bg.gain.setValueAtTime(0.0001, t);
    bg.gain.exponentialRampToValueAtTime(0.045 * vel, t + 0.004);
    bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    body.connect(bg);
    bg.connect(out);
    body.start(t);
    body.stop(t + 0.14);
  }

  private hat(t: number, vel: number, open: boolean): void {
    const ctx = this.ctx!;
    const out = this.out(false);
    const g = ctx.createGain();
    g.gain.value = 0;
    const decay = open ? 0.22 : 0.045;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime((open ? 0.024 : 0.016) * vel, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    const nz = this.noiseSrc();
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 7200;
    const pan = ctx.createStereoPanner();
    pan.pan.value = open ? 0.3 : -0.18;
    nz.connect(hp);
    hp.connect(g);
    g.connect(pan);
    pan.connect(out);
    nz.start(t);
    nz.stop(t + decay + 0.03);
  }

  private hit(t: number): void {
    const ctx = this.ctx!;
    const out = this.out(false);
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.1, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(92, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.5);
    o.connect(g);
    g.connect(out);
    this.send(g, 0.7, 0);
    o.start(t);
    o.stop(t + 0.95);
    const nz = this.noiseSrc();
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 780;
    bp.Q.value = 0.7;
    const ng = ctx.createGain();
    ng.gain.value = 0;
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.045, t + 0.01);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    nz.connect(bp);
    bp.connect(ng);
    ng.connect(out);
    this.send(ng, 0.6, 0);
    nz.start(t);
    nz.stop(t + 0.6);
  }

  private riser(t: number, dur: number): void {
    const ctx = this.ctx!;
    const out = this.out(false);
    const g = ctx.createGain();
    g.gain.value = 0;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.045, t + dur * 0.9);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.08);
    const nz = this.noiseSrc();
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 1.4;
    bp.frequency.setValueAtTime(320, t);
    bp.frequency.exponentialRampToValueAtTime(5200, t + dur);
    nz.connect(bp);
    bp.connect(g);
    g.connect(out);
    this.send(g, 0.45, 0);
    nz.start(t);
    nz.stop(t + dur + 0.1);
  }
}

let singleton: MusicPlayer | null = null;

export function getMusicPlayer(): MusicPlayer {
  if (!singleton) singleton = new MusicPlayer();
  return singleton;
}
