/**
 * PLATE 03 — THE FUGUE
 *
 * "A hunch, heard five ways."
 *
 * The plate is a real five-movement miniature, not a set of blips. Everything
 * below is the score: the audio engine reads it, the stave draws it, and the
 * needle follows it. One subject, five transformations.
 *
 *   subject   F4  A4  C5  B♭4  A4  G4      (rises, peaks, ends unresolved)
 *
 *   I  Listen   augmented (×1.6), two octaves up — felt piano, wide air
 *   II  Loop    the head as a strict eighth-note ostinato — muted plucks
 *   III Lash    retrograde, diminished, with a borrowed E♭ — saw bass + ticks
 *   IV  Lift    the subject spread into a rising bell arpeggio, harmonised
 *   V   Lull    retrograde, slowed down, and the G finally falls to F
 *
 * Time: 1 week = 1 bar of 4/4 at ♩=75 (0.8 s per beat). Eight bars = 25.6 s.
 * That is deliberate: the week ranges on the plate overlap, so the voices
 * overlap too. The piece is an actual fugue, not a timeline with sound effects.
 *
 * Registers are kept apart on purpose — Listen high, Loop mid, Lash low,
 * Lift mid-high, Lull low-mid — so simultaneous entries stay consonant.
 */

export type Voice = "felt" | "pluck" | "lash" | "sub" | "bell" | "pad" | "tick" | "air";

export type Note = {
  /** Absolute position in beats from week 0. 1 week = 4 beats. */
  beat: number;
  /** MIDI note number. Ignored by the noise-based voices (tick, air). */
  pitch: number;
  /** Length in beats. Tails may ring past this. */
  dur: number;
  /** 0..1 — the score's own dynamics. */
  vel: number;
  voice: Voice;
};

export type MovementId = "listen" | "loop" | "lash" | "lift" | "lull";

export const BEATS_PER_WEEK = 4;
export const SEC_PER_BEAT = 0.8; // ♩ = 75
export const TOTAL_BEATS = BEATS_PER_WEEK * 8;
export const PIECE_SECONDS = TOTAL_BEATS * SEC_PER_BEAT;

/** F4 A4 C5 Bb4 A4 G4 */
export const SUBJECT = [65, 69, 72, 70, 69, 67] as const;

const note = (beat: number, pitch: number, dur: number, vel: number, voice: Voice): Note => ({
  beat,
  pitch,
  dur,
  vel,
  voice,
});

/* ------------------------------------------------------------------ *
 * I — LISTEN. The subject at two octaves, stretched, with room to breathe.
 * ------------------------------------------------------------------ */
const LISTEN_AT = [0.4, 2.0, 2.8, 3.6, 5.2, 6.0];
const LISTEN_LEN = [1.6, 0.8, 0.8, 1.6, 0.8, 3.2];
const LISTEN_VEL = [0.5, 0.42, 0.38, 0.44, 0.4, 0.34];

const listen: Note[] = SUBJECT.map((pitch, i) =>
  note(LISTEN_AT[i], pitch + 12, LISTEN_LEN[i], LISTEN_VEL[i], "felt"),
);
// A low F pedal under the whole movement: the room tone, not a bassline.
// It is the only thing on the floor while we listen.
listen.push(note(0.15, 53, 9.8, 0.18, "felt"));

/* ------------------------------------------------------------------ *
 * II — LOOP. The head of the subject, stuck on repeat. Clicks, not phrases.
 * ------------------------------------------------------------------ */
const loop: Note[] = [];
const LOOP_A = [65, 69, 72, 69];
for (let i = 0; i < 12; i++) {
  loop.push(note(5.6 + i * 0.5, LOOP_A[i % 4], 0.4, i % 4 === 0 ? 0.6 : 0.36, "pluck"));
}
const LOOP_B = [65, 69, 72, 74, 72, 69];
for (let i = 0; i < 11; i++) {
  const beat = 11.6 + i * 0.5;
  // One dropped click, sixteenth 7 — the loop breathing, not a machine.
  if (i === 7) continue;
  loop.push(note(beat, LOOP_B[i % 6], 0.4, i % 3 === 0 ? 0.55 : 0.32, "pluck"));
}
loop.push(note(12, 41, 0.9, 0.22, "sub"), note(14, 46, 0.9, 0.22, "sub"), note(16, 41, 0.9, 0.22, "sub"));

/* ------------------------------------------------------------------ *
 * III — LASH. Retrograde subject, cut short, over a hard F pedal.
 * The borrowed E♭ arrives in the second phrase and stays in the teeth.
 * ------------------------------------------------------------------ */
const lash: Note[] = [];
const LASH_BASS: [number, number][] = [
  [12, 41],
  [14, 46],
  [16, 41],
  [18, 48],
  [20, 41],
  [22, 46],
  [24, 48],
  [26, 41],
];
LASH_BASS.forEach(([beat, pitch], i) =>
  lash.push(note(beat, pitch, i === LASH_BASS.length - 1 ? 1.1 : 1.85, 0.3, "sub")),
);

const LASH_RIFF_1 = [...SUBJECT].reverse(); // G A Bb C A F
LASH_RIFF_1.forEach((pitch, i) =>
  lash.push(note(12.5 + i * 0.45, pitch, 0.34, i === 3 ? 0.62 : 0.44, "lash")),
);

// One low F under the breath between the two phrases: the floor never leaves.
lash.push(note(15.4, 41, 1.1, 0.16, "sub"));

const LASH_RIFF_2 = LASH_RIFF_1.map((p) => p + 5); // C D Eb F D Bb — the borrowed b7
LASH_RIFF_2.forEach((pitch, i) =>
  lash.push(note(16.5 + i * 0.45, pitch, 0.34, i === 3 || i === 4 ? 0.66 : 0.46, "lash")),
);

// The build: four notes, twice, then the E♭ on top.
const LASH_BUILD = [65, 69, 70, 72, 65, 69, 70, 72, 75];
LASH_BUILD.forEach((pitch, i) =>
  lash.push(note(20 + i * 0.5, pitch, 0.36, 0.42 + i * 0.035, "lash")),
);

// The tear: the whole subject falls off the table.
const LASH_TEAR = [77, 75, 74, 72, 70, 69];
LASH_TEAR.forEach((pitch, i) =>
  lash.push(note(24.5 + i * 0.42, pitch, 0.34, 0.74 - i * 0.055, "lash")),
);

// Whipcrack ticks, from the build to the tear.
for (let i = 0; i < 14; i++) {
  lash.push(note(19.5 + i * 0.5, 72, 0.08, 0.08 + i * 0.009, "tick"));
}

/* ------------------------------------------------------------------ *
 * IV — LIFT. The subject opened into an ascent, harmonised in fifths.
 * Bells over an open F–C drone; the one loud, warm thing in the piece.
 * ------------------------------------------------------------------ */
const lift: Note[] = [
  note(21.6, 53, 8, 0.15, "pad"),
  note(21.6, 60, 8, 0.11, "pad"),
  note(25.6, 55, 4, 0.08, "pad"),
  note(21.6, 77, 6.6, 0.24, "air"),
];
const LIFT_LINE: [number, number, number][] = [
  [21.6, 60, 1.3],
  [22.8, 64, 1.0],
  [23.8, 65, 1.2],
  [25.0, 69, 1.0],
  [26.0, 72, 1.4],
  [27.2, 74, 0.8],
  [28.0, 77, 1.8],
];
LIFT_LINE.forEach(([beat, pitch, dur], i) =>
  lift.push(note(beat, pitch, dur, 0.34 + i * 0.045, "bell")),
);
// Fifth and octave doublings on the arrival only.
lift.push(note(26.0, 79, 1.2, 0.26, "bell"));
lift.push(note(28.0, 84, 1.6, 0.24, "bell"));

/* ------------------------------------------------------------------ *
 * V — LULL. The subject backwards and slow, over an Fmaj7 that will not
 * hurry. The unresolved G from Listen is finally allowed to fall to F.
 * ------------------------------------------------------------------ */
const lull: Note[] = [
  note(26.8, 53, 3.2, 0.15, "pad"),
  note(26.8, 57, 3.2, 0.12, "pad"),
  note(26.8, 60, 3.2, 0.11, "pad"),
  note(26.8, 64, 3.2, 0.09, "pad"),
  note(30.0, 53, 1.4, 0.13, "pad"),
  note(30.0, 57, 1.4, 0.11, "pad"),
  note(30.0, 60, 1.4, 0.1, "pad"),
  note(30.0, 67, 1.4, 0.09, "pad"),
  note(31.2, 53, 2.2, 0.14, "pad"),
  note(31.2, 57, 2.2, 0.11, "pad"),
  note(31.2, 60, 2.2, 0.1, "pad"),
];
const LULL_LINE: [number, number, number, number][] = [
  [27.2, 67, 1.0, 0.3],
  [28.2, 69, 0.8, 0.27],
  [29.0, 70, 1.0, 0.28],
  [30.0, 72, 1.2, 0.33],
  [30.8, 70, 0.55, 0.25],
  [31.2, 69, 0.5, 0.26],
  [31.65, 67, 0.45, 0.22],
  [31.9, 65, 2.4, 0.36],
];
LULL_LINE.forEach(([beat, pitch, dur, vel]) => lull.push(note(beat, pitch, dur, vel, "felt")));
lull.push(note(31.9, 77, 2, 0.11, "bell"));

export const SCORE: Record<MovementId, Note[]> = { listen, loop, lash, lift, lull };

export const MOVEMENT_IDS: MovementId[] = ["listen", "loop", "lash", "lift", "lull"];

/** Every note in the piece, for progress/debug readouts. */
export const NOTE_COUNT = MOVEMENT_IDS.reduce((n, id) => n + SCORE[id].length, 0);

/** Last sound in the piece, in beats (tails included). */
export const LAST_BEAT = Math.max(
  ...MOVEMENT_IDS.flatMap((id) => SCORE[id].map((n) => n.beat + n.dur)),
);

export function scoreFor(id: MovementId): Note[] {
  return SCORE[id];
}

export function movementSpan(id: MovementId): { from: number; to: number } {
  const notes = SCORE[id];
  return {
    from: Math.min(...notes.map((n) => n.beat)),
    to: Math.max(...notes.map((n) => n.beat + n.dur)),
  };
}

export function midiToHz(pitch: number): number {
  return 440 * Math.pow(2, (pitch - 69) / 12);
}
