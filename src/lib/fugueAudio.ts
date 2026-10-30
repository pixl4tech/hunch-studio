/**
 * A small, sample-free ensemble for Plate 03.
 *
 * Five voices, one per movement:
 *   felt  — Listen   soft triangle + key noise, long decay
 *   pluck — Loop     filtered pluck with a click, ping-ponged
 *   lash  — Lash     saw pair through a falling filter, plus sub
 *   bell  — Lift     inharmonic partials, wide and bright
 *   pad   — Lull     detuned saws, slow swell
 * plus sub (pedal), tick (whip) and air (noise sweep).
 *
 * Everything is scheduled against AudioContext.currentTime, so the needle can
 * be driven by the audio clock instead of setInterval. A synthetic impulse
 * response gives the ensemble one shared room.
 */

import {
  HOUSE,
  SCORE,
  SEC_PER_BEAT,
  midiToHz,
  type MovementId,
  type Note,
} from "./fugueScore";

type Built = {
  out: AudioNode;
  wet: number;
};

export class FuguePlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private verbSend: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private buses = new Set<GainNode>();
  private current: GainNode | null = null;

  constructor(private injected?: AudioContext) {}

  /** Idempotent. Returns false when the browser has no WebAudio. */
  ensure(): boolean {
    if (this.ctx) {
      if (!this.injected && this.ctx.state === "suspended") void this.ctx.resume().catch(() => {});
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

    const master = ctx.createGain();
    master.gain.value = 1.2;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 22;
    comp.ratio.value = 3.4;
    comp.attack.value = 0.006;
    comp.release.value = 0.28;
    // Safety limiter: catches the rare convolution transient, leaves the body alone.
    const limit = ctx.createDynamicsCompressor();
    limit.threshold.value = -1.5;
    limit.knee.value = 0;
    limit.ratio.value = 20;
    limit.attack.value = 0.002;
    limit.release.value = 0.12;
    // Transparent soft ceiling: only the rare convolution spikes touch it.
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

    // A 1.7 s synthetic room. Cheap, deterministic, and it makes five plain
    // oscillators sound like five instruments in one studio.
    const len = Math.max(1, Math.floor(ctx.sampleRate * 1.7));
    const ir = ctx.createBuffer(2, len, ctx.sampleRate);
    let energy = 0;
    let seed = 0x1a2b3c4d;
    const rnd = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const smooth = 1 - Math.exp((-2 * Math.PI * 4200) / ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const t = i / len;
        const attack = i < 96 ? i / 96 : 1;
        const raw = (rnd() * 2 - 1) * Math.pow(1 - t, 3.1) * attack;
        lp += smooth * (raw - lp);
        data[i] = lp;
        energy += lp * lp;
      }
    }
    // Normalise the tail: without this a 2 s noise IR multiplies the wet bus
    // by ~100 and the compressor does the mixing instead of the score.
    const norm = 1 / Math.sqrt(Math.max(1e-9, energy));
    for (let ch = 0; ch < 2; ch++) {
      const data = ir.getChannelData(ch);
      for (let i = 0; i < len; i++) data[i] *= norm;
    }
    const verb = ctx.createConvolver();
    verb.buffer = ir;
    const wet = ctx.createGain();
    wet.gain.value = 0.34;
    const send = ctx.createGain();
    send.gain.value = 1;
    send.connect(verb);
    verb.connect(wet);
    wet.connect(master);
    this.verbSend = send;

    const noiseLen = Math.floor(ctx.sampleRate * 1.2);
    const noise = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const nd = noise.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) nd[i] = rnd() * 2 - 1;
    this.noise = noise;

    if (this.injected && "resume" in ctx) void (ctx as AudioContext).resume().catch(() => {});
    return true;
  }

  now(): number {
    return this.ctx ? this.ctx.currentTime : 0;
  }

  /**
   * Play a set of movements. Every note of every requested movement is
   * scheduled at once — overlapping movements overlap in sound.
   * Returns the audio-clock start time and the last beat scheduled.
   */
  play(
    ids: MovementId[],
    fromBeat = 0,
    lead = 0.14,
    untilBeat = Number.POSITIVE_INFINITY,
  ): { start: number; endBeat: number } | null {
    if (!this.ensure()) return null;
    const ctx = this.ctx!;
    this.stop();

    const t0 = ctx.currentTime + lead;
    let endBeat = fromBeat;
    const buckets = new Map<string, Note[]>();

    const add = (key: string, n: Note) => {
      if (n.beat + n.dur < fromBeat) return;
      // Do not schedule a chord that began before the needle: it would start
      // in the past and click. The next change covers the gap.
      if (n.beat < fromBeat - 0.01) return;
      const list = buckets.get(key) ?? [];
      list.push(n);
      buckets.set(key, list);
      endBeat = Math.max(endBeat, n.beat + n.dur);
    };

    // The room plays under every audition, so a soloed movement still sits in
    // the same harmony as the full piece. A chord that began before the
    // needle is re-struck at the needle, with its remaining length.
    for (const n of HOUSE) {
      if (n.beat + n.dur <= fromBeat || n.beat >= untilBeat) continue;
      const start = Math.max(n.beat, fromBeat);
      const end = Math.min(n.beat + n.dur, untilBeat);
      add("house", { ...n, beat: start, dur: end - start });
    }
    for (const id of ids) {
      for (const n of SCORE[id]) add(id, n);
    }

    const life = Math.max(1.6, (endBeat - fromBeat) * SEC_PER_BEAT + 4);
    const bus = this.openBus(life);

    // Each voice enters through its own short fade, so overlapping movements
    // arrive as voices rather than as competing tracks.
    for (const [key, list] of buckets) {
      const first = Math.min(...list.map((n) => n.beat));
      const at = t0 + Math.max(0, first - fromBeat) * SEC_PER_BEAT;
      const group = ctx.createGain();
      group.gain.setValueAtTime(0.0001, at);
      group.gain.linearRampToValueAtTime(1, at + (key === "house" ? 1.2 : 0.6));
      group.connect(bus);
      for (const n of list) {
        this.schedule(n, t0 + (n.beat - fromBeat) * SEC_PER_BEAT, group, 1);
      }
    }
    this.current = bus;
    return { start: t0, endBeat };
  }

  /**
   * A two-or-three note signature used when the needle crosses a movement
   * while dragging. Short, quiet, no transport.
   */
  entry(id: MovementId): void {
    if (!this.ensure()) return;
    const ctx = this.ctx!;
    const bus = this.current ?? this.openBus(4);
    this.current = bus;
    const notes = [...SCORE[id]]
      .filter((n) => n.voice !== "tick" && n.voice !== "air")
      .sort((a, b) => a.beat - b.beat)
      .slice(0, 3);
    const t0 = ctx.currentTime + 0.04;
    notes.forEach((n, i) => this.schedule(n, t0 + i * 0.14, bus, 0.62));
  }

  stop(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    for (const bus of this.buses) {
      try {
        const g = bus.gain;
        g.cancelScheduledValues(t);
        g.setValueAtTime(Math.max(0.0001, g.value), t);
        g.exponentialRampToValueAtTime(0.0001, t + 0.09);
      } catch {
        /* the bus was already torn down */
      }
      window.setTimeout(() => this.disposeBus(bus), 240);
    }
    this.buses.clear();
    this.current = null;
  }

  private openBus(life: number): GainNode {
    const ctx = this.ctx!;
    const bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(this.master!);
    this.buses.add(bus);
    window.setTimeout(() => this.disposeBus(bus), Math.max(600, life * 1000 + 400));
    return bus;
  }

  private disposeBus(bus: GainNode): void {
    this.buses.delete(bus);
    if (this.current === bus) this.current = null;
    try {
      bus.disconnect();
    } catch {
      /* noop */
    }
  }

  private schedule(n: Note, when: number, bus: GainNode, gain: number): void {
    const built = this.build(n, when);
    const out = built.out;
    out.connect(bus);
    if (built.wet > 0 && this.verbSend) {
      const send = this.ctx!.createGain();
      send.gain.value = built.wet * gain;
      out.connect(send);
      send.connect(this.verbSend);
    }
    // Scale the voice by the entry gain without touching the score's dynamics.
    if (gain !== 1) {
      (out as GainNode).gain.value *= gain;
    }
  }

  private amp(when: number, peak: number, attack: number, decay: number): GainNode {
    const g = this.ctx!.createGain();
    // A GainNode defaults to 1. If a source starts on the same sample as the
    // first automation event, one full-scale sample can slip through.
    g.gain.value = 0;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0003, peak), when + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, when + decay);
    return g;
  }

  private noiseSrc(loop = false): AudioBufferSourceNode {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noise;
    src.loop = loop;
    return src;
  }

  private panner(pan: number): AudioNode {
    const ctx = this.ctx!;
    if (typeof ctx.createStereoPanner !== "function") return ctx.createGain();
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    return p;
  }

  private build(n: Note, when: number): Built {
    const ctx = this.ctx!;
    const f = midiToHz(n.pitch);
    const d = n.dur * SEC_PER_BEAT;
    const out = ctx.createGain();
    out.gain.value = 1;

    switch (n.voice) {
      case "felt": {
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 3400;
        lp.Q.value = 0.4;
        // A held felt note keeps a little sustain until its written end, then
        // releases. The old single decay cut the 9.8-beat Listen pedal at 2.6 s.
        const peak = n.vel * 0.17;
        const sustain = Math.max(0.0004, peak * 0.3);
        const env = ctx.createGain();
        env.gain.value = 0;
        env.gain.setValueAtTime(0.0001, when);
        env.gain.exponentialRampToValueAtTime(peak, when + 0.013);
        env.gain.exponentialRampToValueAtTime(sustain, when + Math.max(0.35, d * 0.9));
        env.gain.exponentialRampToValueAtTime(0.0001, when + d + 1.3);
        const o1 = ctx.createOscillator();
        o1.type = "triangle";
        o1.frequency.value = f;
        const o2 = ctx.createOscillator();
        o2.type = "sine";
        o2.frequency.value = f * 2.004;
        const g2 = ctx.createGain();
        g2.gain.value = 0.2;
        o1.connect(lp);
        o2.connect(g2);
        g2.connect(lp);
        lp.connect(env);
        env.connect(out);
        // The touch of a key: a whisper of filtered noise.
        const nz = this.noiseSrc();
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 1900;
        const ng = this.amp(when, n.vel * 0.05, 0.004, 0.06);
        nz.connect(hp);
        hp.connect(ng);
        ng.connect(out);
        nz.start(when);
        nz.stop(when + 0.09);
        o1.start(when);
        o2.start(when);
        o1.stop(when + d + 1.4);
        o2.stop(when + d + 1.4);
        return { out, wet: 0.42 };
      }

      case "pluck": {
        const bp = ctx.createBiquadFilter();
        bp.type = "lowpass";
        bp.frequency.value = Math.min(5600, f * 5.5);
        bp.Q.value = 1.1;
        const env = this.amp(when, n.vel * 0.34, 0.004, 0.24 + d * 0.35);
        const o1 = ctx.createOscillator();
        o1.type = "triangle";
        o1.frequency.value = f;
        const o2 = ctx.createOscillator();
        o2.type = "square";
        o2.frequency.value = f * 1.004;
        const g2 = ctx.createGain();
        g2.gain.value = 0.32;
        const pan = this.panner(Math.round(n.beat * 2) % 2 === 0 ? -0.28 : 0.28);
        o1.connect(bp);
        o2.connect(g2);
        g2.connect(bp);
        bp.connect(env);
        env.connect(pan);
        pan.connect(out);
        const nz = this.noiseSrc();
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 3200;
        const ng = this.amp(when, n.vel * 0.045, 0.002, 0.03);
        nz.connect(hp);
        hp.connect(ng);
        ng.connect(out);
        nz.start(when);
        nz.stop(when + 0.05);
        o1.start(when);
        o2.start(when);
        o1.stop(when + 0.5);
        o2.stop(when + 0.5);
        return { out, wet: 0.2 };
      }

      case "lash": {
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.setValueAtTime(2600, when);
        lp.frequency.exponentialRampToValueAtTime(380, when + 0.26);
        lp.Q.value = 2.4;
        const env = this.amp(when, n.vel * 0.26, 0.005, 0.18 + d * 0.5);
        const o1 = ctx.createOscillator();
        o1.type = "sawtooth";
        o1.frequency.value = f;
        const o2 = ctx.createOscillator();
        o2.type = "sawtooth";
        o2.frequency.value = f * 1.006;
        const g2 = ctx.createGain();
        g2.gain.value = 0.55;
        const sub = ctx.createOscillator();
        sub.type = "sine";
        sub.frequency.value = f / 2;
        const sg = ctx.createGain();
        sg.gain.value = 0.5;
        o1.connect(lp);
        o2.connect(g2);
        g2.connect(lp);
        lp.connect(env);
        env.connect(out);
        sub.connect(sg);
        sg.connect(env);
        o1.start(when);
        o2.start(when);
        sub.start(when);
        const end = when + Math.max(0.35, d + 0.35);
        o1.stop(end);
        o2.stop(end);
        sub.stop(end);
        return { out, wet: 0.18 };
      }

      case "sub": {
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 300;
        const env = this.amp(when, n.vel * 0.1, 0.02, d + 0.55);
        const o1 = ctx.createOscillator();
        o1.type = "sine";
        o1.frequency.value = f;
        const o2 = ctx.createOscillator();
        o2.type = "triangle";
        o2.frequency.value = f * 2;
        const g2 = ctx.createGain();
        g2.gain.value = 0.18;
        o1.connect(lp);
        o2.connect(g2);
        g2.connect(lp);
        lp.connect(env);
        env.connect(out);
        o1.start(when);
        o2.start(when);
        o1.stop(when + d + 0.7);
        o2.stop(when + d + 0.7);
        return { out, wet: 0.1 };
      }

      case "bell": {
        const partials: [number, number, number][] = [
          [1, 1, Math.max(1.1, d * 0.9 + 1.3)],
          [2.756, 0.22, Math.max(0.7, d * 0.5 + 0.6)],
          [5.404, 0.045, 0.38],
        ];
        const pan = this.panner(n.pitch > 76 ? 0.22 : -0.16);
        pan.connect(out);
        for (const [ratio, level, dec] of partials) {
          const o = ctx.createOscillator();
          o.type = "sine";
          o.frequency.value = f * ratio;
          const g = this.amp(when, n.vel * 0.34 * level, 0.008, dec);
          o.connect(g);
          g.connect(pan);
          o.start(when);
          o.stop(when + dec + 0.05);
        }
        return { out, wet: 0.55 };
      }

      case "pad": {
        const lp = ctx.createBiquadFilter();
        lp.type = "lowpass";
        lp.frequency.value = 620;
        lp.Q.value = 0.7;
        const env = ctx.createGain();
        env.gain.value = 0;
        const peak = n.vel * 0.26;
        env.gain.setValueAtTime(0.0001, when);
        env.gain.linearRampToValueAtTime(peak, when + 0.55);
        env.gain.setValueAtTime(peak, when + d * 0.88);
        env.gain.linearRampToValueAtTime(0.0001, when + d + 1.7);
        const o1 = ctx.createOscillator();
        o1.type = "sawtooth";
        o1.frequency.value = f;
        const o2 = ctx.createOscillator();
        o2.type = "sawtooth";
        o2.frequency.value = f * 1.008;
        const o3 = ctx.createOscillator();
        o3.type = "sawtooth";
        o3.frequency.value = f * 0.994;
        const g2 = ctx.createGain();
        g2.gain.value = 0.5;
        const g3 = ctx.createGain();
        g3.gain.value = 0.5;
        o1.connect(lp);
        o2.connect(g2);
        g2.connect(lp);
        o3.connect(g3);
        g3.connect(lp);
        lp.connect(env);
        env.connect(out);
        const end = when + d + 1.85;
        [o1, o2, o3].forEach((o) => {
          o.start(when);
          o.stop(end);
        });
        return { out, wet: 0.5 };
      }

      case "tick": {
        const nz = this.noiseSrc();
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 2100;
        bp.Q.value = 1.6;
        const env = this.amp(when, n.vel * 0.06, 0.002, 0.045);
        nz.connect(bp);
        bp.connect(env);
        env.connect(out);
        nz.start(when);
        nz.stop(when + 0.06);
        return { out, wet: 0.14 };
      }

      case "air": {
        const nz = this.noiseSrc(true);
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.Q.value = 1.3;
        bp.frequency.setValueAtTime(420, when);
        bp.frequency.exponentialRampToValueAtTime(2600, when + d * 0.8);
        const env = ctx.createGain();
        env.gain.value = 0;
        env.gain.setValueAtTime(0.0001, when);
        env.gain.linearRampToValueAtTime(n.vel * 0.05, when + d * 0.45);
        env.gain.linearRampToValueAtTime(0.0001, when + d);
        nz.connect(bp);
        bp.connect(env);
        env.connect(out);
        nz.start(when);
        nz.stop(when + d + 0.05);
        return { out, wet: 0.4 };
      }
    }
  }
}
