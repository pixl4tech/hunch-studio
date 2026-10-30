# Prompt history — HUNCH / Issue 03

## 1. One-shot brief

```text
Design and build a website for a "vibe code" development studio. This is a creativity test — go wild.

Invent every section yourself. Invent the whole visual style yourself. Pick the colors, the tech stack, everything — your call.

I want:

unusual, non-standard structure
unusual layout and design
custom animation and 3D
something I haven't seen before
I don't want:

banal fade-in / slide-in / scroll-reveal animations on blocks
generic hero + features + pricing + footer templates
safe, default, template-y design
anything obvious, cliché, or "just fine"
Surprise me. If it looks like something you've seen a thousand times — redo it.
```

**Result before corrections:** [`1bf508c` — HUNCH — software by feel](https://github.com/pixl4tech/hunch-studio/commit/1bf508c805f77afb8e690bf52084a64bc46bfde8)

## 2. Refinement prompts by commit

### `18dc71f` — The Fugue becomes a five-movement piece

[Commit](https://github.com/pixl4tech/hunch-studio/commit/18dc71f45626f9488f5697a0f1aacf48fd2cfa13)

```text
- Rebuild Plate 03 as a real five-movement composition, not decorative notes.
- One subject: F–A–C–B♭–A–G. Five transformations: augmented Listen, ostinato Loop, retrograde/diminished Lash (+ borrowed E♭), rising harmonised Lift, retrograded Lull resolving G→F.
- 8 bars of 4/4 at 75 BPM; 1 week = 1 bar; 25.6 s total; voices overlap.
- Sample-free WebAudio ensemble: felt, plucks, saw bass, sub, bells, pad, ticks, air + synthetic room.
- One score drives both audio and stave: pitch → height, duration → length, played notes light up.
- Add Play/Stop, tap-to-audition, draggable + keyboard needle, live movement readout.
```

### `678ceca` — Balance the Fugue, remove two audio glitches

[Commit](https://github.com/pixl4tech/hunch-studio/commit/678ceca2712d51ddf84cd416becd5cd15e4b5466)

```text
- Route the Lash sub-oscillator through its envelope (it was a constant 0.4).
- Start every envelope from an explicit 0 (GainNode defaults to 1; felt noise leaked a full-scale sample).
- Let felt notes sustain for their written length — the 9.8-beat Listen pedal must not cut at 2.6 s.
- Use a seeded, smoothed, energy-normalised IR; add a soft limiter and master headroom.
- Rebalance stems: tame Lash, lift Loop/Lift/Lull; target peak < 0.7, no clipping.
```

### `1d777e9` — HUNCH FM, global audio, UI sounds, new icon

[Commit](https://github.com/pixl4tech/hunch-studio/commit/1d777e94e438aa18d550ce1724fc765ff9729ad1)

Functional changes only; docs/metadata from this commit are excluded below.

```text
- HUNCH FM: original 32-bar loop at 92 BPM (~83 s), A minor, Am–F–C–G | Am–F–Dm–E7; pads, syncopated bass, 16th arps + dotted delay, lyrical lead, restrained drums, dark low sequencer; no samples.
- Duck HUNCH FM under the Fugue with gain + low-pass (0.7 s out, 1.4 s in); brief duck for needle entries; master off stops music and Fugue.
- Fix Fugue overlaps: quiet house-chord bed per week, 0.6 s voice fades, thin Loop under Lash, no E♭ in Lash build/tear, hold Lull's 3rd until the final bar.
- Fix HUNCH FM lead: align melody to the real grid (dark over Dm–E7, bright over C–G), simplify pads, remove the ♭9 cadence, lower/warm the lead, add low sequencer and fills.
- Global Audio popover: Sound master + separate Music switch, both off by default, persisted; Sound gates everything; Fugue Play enables Sound.
- UI SFX: synthesised switches, paper, ticket tear + stamp, jack, relay, dial, fader, ink, wobble/plop, type, page, success; gated, throttled, randomised; data-sfx + delegated listener; document in UI-SOUNDS.md.
- Icon: riso-misregistered H (ink square, bone H, orange/cobalt offsets, lime dot) as icon.svg + 180 px touch icon, linked in index.html.
```

## 3. Excluded

| Commit | Reason |
| --- | --- |
| [`d877f10`](https://github.com/pixl4tech/hunch-studio/commit/d877f10eb5892a3b9901bbee22e4f786fb84f959) | README live link + `.gitignore` — docs/deploy only. |
| Docs in `1d777e9` | README, PROMPT.md, UI-SOUNDS.md, model colophon, `meta generator`. |
