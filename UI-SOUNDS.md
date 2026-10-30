# UI sounds — inventory and mapping

Every interactive element was classified by **material**, **gesture** and **object properties** before choosing a sound. The rule: the sound should describe the object being touched, not the button being clicked.

All sounds are synthesised in `src/lib/sfx.ts`. No samples.

## The gate

There is one master switch in the dock: **Audio → Sound**. It is off on a first visit, persists in `localStorage`, and gates every interface sound.

- `Sound` off → no AudioContext is created; all `playSfx()` calls return.
- `Music` is a second switch in the same panel. Turning it on also turns `Sound` on.
- Turning `Sound` off stops HUNCH FM and closes the Fugue.
- Pressing **Play the fugue** (or its Sound button) turns `Sound` on, because that is an explicit gesture.

Implementation: `data-sfx="…"` attributes are handled by one delegated `pointerdown`/`keydown` listener in `App.tsx`; drag gestures (filmstrip, dial, needle, fader, organism) call the same tiny API with their own throttle.

## Materials and principles

| Family | Character | Sound behaviour |
| --- | --- | --- |
| Paper | fibre, dry, light, transient | short filtered noise, 20–80 ms; tear gets crackle; stamp gets a low body |
| Ink | wet, heavy, viscous | low-passed noise with a downward sweep; no transient |
| Metal | cold, resonant, decisive | two quick partials, a click and a contact tick |
| Rubber / cable | soft, elastic, weighty | low thunk plus a small socket click |
| Mechanical | precise, small, deliberate | wood click + tiny spring; detents for the radio |
| Air / room | depth, distance | brief room send; never long reverb |

Sounds are randomised by ±6 % in pitch and ±10 % in level, and throttled per name (35–120 ms) so a drag or a fast click cannot machine-gun. Loudness is kept well below HUNCH FM.

## Inventory

### Global chrome

| Element | Object / character | Interaction | Sound |
| --- | --- | --- | --- |
| Boot — “Skip the ceremony” | printed curtain, paper drum | one click | `whoosh` — low air + paper settle |
| Dock — plate 00–07 | index tabs on newsprint | click | `tick` — dry paper snap |
| Dock — ← / → | page edge | click | `page` — short paper slide |
| Dock — Audio button | recessed metal switch with a tiny VU | open/close options | `tick` |
| Dock — Sound | master relay | toggle | `switch` — two-part mechanical click |
| Dock — Music | tape/relay switch | toggle | `switch` |
| Dock — Ink | squeegee bottle | toggle | `ink` — wet low-pass squelch |
| Page-turn strip | heavy cover stock | click | `page` |

### 00 — Signal / the 3D specimen

| Element | Object / character | Interaction | Sound |
| --- | --- | --- | --- |
| Contents rows | printed contents tabs | click | `tick` |
| “Start a hunch”, CTAs | letterpress button | click | `page` |
| “Open the bin” | paper drawer | click | `tick` |
| 3D organism | inflated, inked mesh | pointer down / drag | `wobble` — soft rubbery body |
| 3D organism | same | release | `plop` — small rubber landing |

### 01 — The Bin

| Element | Object / character | Interaction | Sound |
| --- | --- | --- | --- |
| Filmstrip | glossy film on a light table | drag | `paperDrag` — granular paper/film friction |
| Filmstrip | same | release after a drag | `paper` — film settles |
| Killed-version card | matte card, slight tilt | click to flip | `paper` — card tap |
| ← / → specimens | plastic transport knob | click | `tick` |

### 02 — The Patch Bay

| Element | Object / character | Interaction | Sound |
| --- | --- | --- | --- |
| Jack socket | brass hole, rubber cable | pick / click / keyboard | `plug` — thunk + socket contact tick |
| Cable | rubber jack lead | cut / remove | `plug` — unplug and release |
| Preset | relay bank | click | `relay` — lower, electrical click |
| “Pull everything” | bundle of cables | click | `plug` |
| “Take it to the bench” | printed patch sheet | click | `paper` |
| “Copy the spec” | carbon copy | click | `success` — two soft printed notes |

### 03 — The Fugue

| Element | Object / character | Interaction | Sound |
| --- | --- | --- | --- |
| Movement label I–V | stave tab | click | `tick` |
| Play / Stop | transport lever | click | `transport` — low platen thud + motor click |
| Sound | switch | toggle | `switch` |
| Reset | needle return | click | `tick` |
| Needle / ruler | steel needle on paper | drag or arrow keys | `needle` — fine paper scratch |

### 04 — The Ledger

| Element | Object / character | Interaction | Sound |
| --- | --- | --- | --- |
| Ticket | perforated ticket stub | click to select | `tear` — perforation rip with crackle |
| Ticket | rubber stamp, ink pad | after selection | `stamp` — low press + paper slap |
| Ticket | same | click to deselect | `paper` — stub lifts |
| “Take this ticket” | torn-off slip | click | `page` |

### 05 — The Séance

| Element | Object / character | Interaction | Sound |
| --- | --- | --- | --- |
| Dial | Bakelite tuning knob | drag / arrow keys | `dial` — ratchet detent + short static |
| ← Tune / Tune → | mechanical station buttons | click | `dial` |
| Frequency list | printed dial scale | click | `dial` |
| Scan | relay/auto-scan switch | toggle | `relay` |

### 06 — The Bench

| Element | Object / character | Interaction | Sound |
| --- | --- | --- | --- |
| Fader — warmth / grain / tempo | paper-covered slide pot | drag | `fader` — soft friction tick |
| Reset / Detune | instrument switch | click | `switch` |
| Mode buttons | rotary selector | click | `switch` |
| Name / email / message | typewriter keys | typing | `type` — quiet key tick (throttled) |
| “Transmit” | rubber stamp / dispatch | submit | `stamp` |
| “Copy the address” | carbon copy | click | `success` |
| Attached patch — remove | paper clip | click | `paper` |
| Mail-app button | paper slip | click | `paper` |
| “Write another” | fresh form | click | `tick` |

### 07 — Sign-Off

| Element | Object / character | Interaction | Sound |
| --- | --- | --- | --- |
| Copy the address | wax-seal press | click | `success` |
| Mail link | paper envelope | click | `paper` |
| Back to cover / top | page edge | click | `page` |
| Giant HUNCH wordmark | misregistered ink | pointer enter | `ink` — one soft squelch, then silence |

## Deliberate silences

- Scrolling, parallax and the drifting 3D specimen make no sound: continuous noise would fight the music and the print metaphor.
- The misregistered wordmark only sounds when the pointer **enters** it; tracking it would be a rattle.
- Hover states are silent except the ink wordmark.
- The Fugue and HUNCH FM have their own engines; interface sounds use a separate, quieter bus, so a stamp never ducks the music.
