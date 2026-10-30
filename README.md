# HUNCH® — a studio for software with a pulse

A site for a fictional two-desk **vibe-code studio**. Built as a printed studio zine — *Issue 03, The Feeling Issue* — instead of a hero / features / pricing / footer template.

**[Live site →](https://hunch-studio-eight.vercel.app)** · **[GitHub](https://github.com/pixl4tech/hunch-studio)**

![HUNCH](public/og.png)

## The idea

The whole page is one riso-printed issue. Eight numbered plates, a contents page, page-turn strips, crop marks, perforations, barcodes, a wax seal. No two plates share the same layout logic; each one is a different kind of printed page.

The art direction is a Risograph palette (ink, bone, orange, cobalt, lime), huge optical type, hairline technical labels — and a custom 3D "brushstroke specimen" printed with a screen-space halftone shader.

There are no scroll-reveal fades. Motion is either user-driven (dragging, patching, tuning, stamping) or a piece of print machinery (press-printing the headline, a platen flipping in the dock, a seal rotating).

## The plates

| Plate | What it is | What you can do |
| --- | --- | --- |
| **00 — The Signal** | The cover, a zine contents index, and a 3D specimen | Drag / poke the organism. Use the index or the bottom dock. Toggle the ink trail. |
| **01 — The Bin** | A draggable light table of six killed versions | Drag the filmstrip, flip a card, read the autopsy. |
| **02 — The Patch Bay** | Capabilities as a playable patch bay | Drag cables from a need to a system and get a generated spec. Presets and click-to-patch included. Take the patch to the Bench. |
| **03 — The Fugue** | The method as a draggable five-stave graphic score | Drag the needle; movements overlap and narrate. Solo a movement. Press **Play the fugue** to sweep the whole score and hear the five-note melody (it turns sound on). |
| **04 — The Ledger** | Three ways in, printed as tear-off tickets | Stamp a ticket. The selection follows you to the Bench form. |
| **05 — The Séance** | Client testimony as radio transmissions | Turn the dial, scan channels, change the frequency. |
| **06 — The Bench** | The site as the demo | Tune warmth / grain / tempo and watch the accent, grain and 3D organism change live. Request a session — the console drafts a real mailto. |
| **07 — Sign-Off** | Masthead, rotating seal, colophon, barcode | Pointer-driven ink misregistration on the giant wordmark. Copy the address, go back to the cover. |

## Stack

- **Vite + React 19 + TypeScript**
- **Three.js** with custom GLSL: a hand-built twisted ribbon geometry, vertex displacement, flat printed lighting, screen-space riso halftone, and square ink-fleck particles. No stock primitives, no post-processing stack.
- **Lenis** for the tuned scroll feel.
- **Hand-written CSS** (custom properties, fluid type, asymmetric grids) — no UI framework.
- **Fontsource** self-hosted fonts: Bricolage Grotesque, Instrument Serif, JetBrains Mono.

## Run it

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## Notes

- **No backend.** The session console doesn't send anything; it assembles the message and offers a mailto / copy-address route. The UI says so.
- **Fictional.** Clients, quotes and prices are invented; the studio is too.
- **Accessibility / care.** Semantic plates, keyboard support for patching, the score needle and the radio dial; focus states; `prefers-reduced-motion` freezes the 3D, the press intro, the marquee and the ink trail; WebGL has a printed fallback; the custom cursor is disabled on touch and on reduced motion; mobile layouts collapse intentionally rather than just shrinking.
- **Performance.** DPR clamped at 2, the organism pauses off-screen, the geometry is roughly 2.7k vertices, and there are no external image assets.
- **Sound** is opt-in, only in The Fugue. “Play the fugue” does a one-button 8-second audition of all five movements.

```
src/
  components/     the eight plates + chrome (boot, dock, cursor, ink)
  lib/            ticker, vibe context, scroll, plates, utilities
  styles/         base system + one stylesheet per plate
public/og.png     social card
```
