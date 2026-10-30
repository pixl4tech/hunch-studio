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

## 3. Post-release refinements

The **functional** history currently ends at [`a675887`](https://github.com/pixl4tech/hunch-studio/commit/a6758879e11e4cca6c57845fde1c370650f3c594) — the ink-layer fade. The commit immediately after this document update is documentation only.

### `efd7963` — Document the prompt history

[Commit](https://github.com/pixl4tech/hunch-studio/commit/efd7963213820a3fb219f06a6051f1fc13d1a6a8)

Documentation only: this file was rewritten so the one-shot brief points at the first commit and every functional commit has a terse reproduction prompt.

### `22fe618` — Record session token usage

[Commit](https://github.com/pixl4tech/hunch-studio/commit/22fe6189ed6358dba3a133d77626377d52b6f39c)

Documentation/UI credit only. Added a cumulative session block to the README colophon and the Sign-Off credits:

```text
prompt tokens read   1,272,527   @ 483 tok/s   (89,602,204 reused)
tokens written         818,340   @ 42.1 tok/s
```

### `d424f1a` — Match the model credit to the colophon body style

[Commit](https://github.com/pixl4tech/hunch-studio/commit/d424f1a20100dda91d57d387297141159db555fa)

Visual fix only: `.signoff__col p` had higher specificity, so the model credit rendered at 13.5 px display instead of 7.5 px mono. It now uses `.signoff__sm` plus a small top margin — same size, font, colour and line-height as the other colophon text.

### `b2a4d11` — EN / RU localisation, AI-native copy, Cyrillic type

[Commit](https://github.com/pixl4tech/hunch-studio/commit/b2a4d11d1d8bcb880ee485795de6bff301b8f151)

```text
- Add a typed i18n layer: en.ts is the source of truth; ru.ts is checked against Content.
- Move every client string into dictionaries: copy, data arrays, aria/title/placeholder, mailto drafts, meta, CSS text. Keep ids, prices, colours, frequencies and ranges in content/data.
- Locale resolution: ?lang > localStorage > en. Add Language to the dock Settings popover; switching updates UI, URL (replaceState, hash preserved), html lang, title/meta and fonts immediately. Persist the explicit URL locale.
- Rewrite EN around a clearer AI-native web studio: interface, intelligence (LLM/RAG/agents), data, reliability; tie every plate to a capability, process step, engagement or proof.
- Adapt RU rather than translating literally: keep industry terms in English, bilingual plate names in contents and short RU labels in the dock, Intl numbers/currency, Onest + Playfair Display for Cyrillic, RU-specific wordmark and ledger scaling.
```

### `88df661` — Fade the ink trail, cut idle render work

[Commit](https://github.com/pixl4tech/hunch-studio/commit/88df6611d5a3ec86ba2c8f1f9c76381c7295537f)

```text
- InkTrail: lazy rAF, only while ink exists; stop clearing a full-screen canvas in idle; DPR 2→1.5; initial 12 s hard clear.
- Seismograph: pause offscreen via IntersectionObserver, cap at 30 fps, cache its rect, DPR 1.5.
- 3D organism: DPR 2→1.5 desktop and 1.25 on narrow screens.
- Custom cursor: settle and stop the rAF loop when idle; Sign-Off misprint pauses when offscreen.
- Audit: Signal's tick hot spot 439→122 hits at idle and 0 when offscreen; FPS stays 60.
```

### `f207848` — Turn off the settings-panel shadow

[Commit](https://github.com/pixl4tech/hunch-studio/commit/f20784842d6a6e7f251ea7e063a2b872882c60bc)

```text
- Remove box-shadow from the dock Settings panel; keep the dark background, hairline border and lime top rule.
```

### `a7ce767` — Let the cursor settle while held

[Commit](https://github.com/pixl4tech/hunch-studio/commit/a7ce7671a22b783399b20396bc82551534235b03)

```text
- The cursor loop may stop as soon as it reaches the pointer, even with the button held; pointer events restart it when needed.
```

### `a675887` — Fade the ink canvas itself, not just the pigment

[Commit](https://github.com/pixl4tech/hunch-studio/commit/a6758879e11e4cca6c57845fde1c370650f3c594)

```text
- Start a 6 s opacity fade on the ink canvas at 3 s, stop the rAF loop at 6 s, and clear/hide the node at 10.5 s.
- The layer is invisible by ~9 s: no faint transparent ghost and no abrupt pop at the hard clear.
```

## 4. Excluded

| Commit | Reason |
| --- | --- |
| [`d877f10`](https://github.com/pixl4tech/hunch-studio/commit/d877f10eb5892a3b9901bbee22e4f786fb84f959) | README live link + `.gitignore` — docs/deploy only. |
| Docs in `1d777e9` | README, PROMPT.md, UI-SOUNDS.md, model colophon, `meta generator`. |
| `efd7963`, `22fe618`, `d424f1a` | Documentation/colophon/credit only; recorded above for history, no functional prompt. |
