/** Locale-neutral data: ids, prices, colours, frequencies, ranges. */

export type PlateId =
  | "signal"
  | "bin"
  | "patch"
  | "fugue"
  | "ledger"
  | "seance"
  | "bench"
  | "signoff";

export const PLATE_ORDER: PlateId[] = [
  "signal",
  "bin",
  "patch",
  "fugue",
  "ledger",
  "seance",
  "bench",
  "signoff",
];

export const PLATE_DATA: Record<PlateId, { no: string; stock: "ink" | "bone" | "cobalt" }> = {
  signal: { no: "00", stock: "ink" },
  bin: { no: "01", stock: "ink" },
  patch: { no: "02", stock: "bone" },
  fugue: { no: "03", stock: "cobalt" },
  ledger: { no: "04", stock: "bone" },
  seance: { no: "05", stock: "ink" },
  bench: { no: "06", stock: "bone" },
  signoff: { no: "07", stock: "ink" },
};

export type BinId = "orb" | "pricing" | "cursor" | "onboarding" | "sound" | "footer";

export const BIN_IDS: BinId[] = ["orb", "pricing", "cursor", "onboarding", "sound", "footer"];

export const BIN_DATA: Record<BinId, { version: string; diff: string[] }> = {
  orb: {
    version: "v0.0.1",
    diff: ['- <section id="pricing">', '+ <orb spin="pricing">', "// wow: 10/10, find: 0/10"],
  },
  pricing: {
    version: "v0.3",
    diff: ["- price = 18000", "+ price = 18000 * weather", "+ price = 18000 * mercury"],
  },
  cursor: {
    version: "v1.2",
    diff: ["+ cursor: url(hat.svg), wait;", "- * { cursor: default }", "// hat removed in v1.2"],
  },
  onboarding: {
    version: "v2.0",
    diff: ["- signup.submit()", "+ breathe(540); then signup", "// inhale… exhale… churn"],
  },
  sound: {
    version: "v0.7",
    diff: ['- <a href="/work">Work</a>', "+ playTone(440); // Work", "// works until it doesn’t"],
  },
  footer: {
    version: "v1.0",
    diff: ["while (scrolled) { append(values) }", "// bottom = new top", "// please stop"],
  },
};

export const BIN_TILTS = [-2.4, 1.6, -1.1, 2.2, -1.8, 1.2];
export const BIN_DROPS = [14, 0, 26, 6, 20, 2];

export type TicketId = "sprint" | "build" | "date";

export const TICKET_IDS: TicketId[] = ["sprint", "build", "date"];

export const TICKET_DATA: Record<
  TicketId,
  {
    price: number;
    plus: boolean;
    seat: string;
    header: string;
    headerFg: string;
    tilt: number;
    drop: number;
  }
> = {
  sprint: {
    price: 18000,
    plus: false,
    seat: "04 · A",
    header: "var(--orange)",
    headerFg: "var(--ink)",
    tilt: -1.6,
    drop: 18,
  },
  build: {
    price: 48000,
    plus: true,
    seat: "04 · B",
    header: "var(--cobalt)",
    headerFg: "var(--bone)",
    tilt: 1.2,
    drop: 0,
  },
  date: {
    price: 14000,
    plus: false,
    seat: "04 · C",
    header: "var(--ink)",
    headerFg: "var(--bone)",
    tilt: -1.1,
    drop: 30,
  },
};

export type NeedId = "return" | "path" | "pulse" | "life";
export const NEED_IDS: NeedId[] = ["return", "path", "pulse", "life"];

export type SystemId = "interface" | "intelligence" | "data" | "reliability";
export const SYSTEM_IDS: SystemId[] = ["interface", "intelligence", "data", "reliability"];

export const NEED_COLOR: Record<NeedId, string> = {
  return: "#0d0c0a",
  path: "#2238f5",
  pulse: "#ff4d18",
  life: "#7a5cff",
};

export type PresetId = "house" | "rescue" | "showpiece";
export const PRESETS: { id: PresetId; conns: [NeedId, SystemId][] }[] = [
  {
    id: "house",
    conns: [
      ["return", "interface"],
      ["path", "intelligence"],
      ["pulse", "data"],
      ["life", "reliability"],
    ],
  },
  {
    id: "rescue",
    conns: [
      ["path", "interface"],
      ["pulse", "intelligence"],
      ["life", "reliability"],
    ],
  },
  {
    id: "showpiece",
    conns: [
      ["pulse", "interface"],
      ["pulse", "intelligence"],
      ["return", "data"],
    ],
  },
];

export type ChannelId = "scheduler" | "freight" | "club" | "museum" | "bakery" | "support";
export const CHANNEL_IDS: ChannelId[] = [
  "scheduler",
  "freight",
  "club",
  "museum",
  "bakery",
  "support",
];

export const CHANNEL_DATA: Record<
  ChannelId,
  { no: string; freq: number; rec: string; strength: number; wave: number[] }
> = {
  scheduler: {
    no: "01",
    freq: 88.1,
    rec: "13:04:22 / 00:41",
    strength: 86,
    wave: [4, 12, 7, 20, 9, 15, 5, 22, 6, 13, 4, 18, 8, 11, 3, 17, 6, 21, 9, 12],
  },
  freight: {
    no: "02",
    freq: 91.3,
    rec: "09:12:07 / 01:12",
    strength: 73,
    wave: [7, 4, 16, 9, 22, 5, 12, 18, 3, 10, 19, 6, 14, 4, 21, 8, 11, 17, 5, 13],
  },
  club: {
    no: "03",
    freq: 94.7,
    rec: "17:48:13 / 00:58",
    strength: 91,
    wave: [9, 21, 12, 5, 18, 7, 22, 14, 4, 19, 8, 16, 3, 11, 20, 6, 13, 9, 17, 5],
  },
  museum: {
    no: "04",
    freq: 99.5,
    rec: "11:26:54 / 00:37",
    strength: 64,
    wave: [3, 14, 8, 19, 5, 12, 21, 7, 16, 4, 10, 18, 6, 13, 9, 20, 5, 15, 8, 11],
  },
  bakery: {
    no: "05",
    freq: 102.9,
    rec: "06:03:41 / 00:29",
    strength: 58,
    wave: [6, 17, 4, 11, 20, 8, 14, 5, 18, 9, 12, 3, 21, 7, 15, 4, 19, 6, 10, 13],
  },
  support: {
    no: "06",
    freq: 107.1,
    rec: "21:19:02 / 00:44",
    strength: 79,
    wave: [11, 4, 19, 7, 14, 22, 5, 12, 3, 18, 8, 15, 6, 20, 4, 13, 9, 17, 7, 10],
  },
};

export type BenchModeId = "build" | "sprint" | "date" | "unsure";
export const BENCH_MODE_IDS: BenchModeId[] = ["build", "sprint", "date", "unsure"];

export type FugueStageId = "listen" | "loop" | "lash" | "lift" | "lull";
export const FUGUE_STAGE_DATA: Record<
  FugueStageId,
  { roman: string; start: number; end: number }
> = {
  listen: { roman: "I", start: 0, end: 2.7 },
  loop: { roman: "II", start: 1.4, end: 4.2 },
  lash: { roman: "III", start: 3.0, end: 6.8 },
  lift: { roman: "IV", start: 5.4, end: 7.4 },
  lull: { roman: "V", start: 6.7, end: 8 },
};
