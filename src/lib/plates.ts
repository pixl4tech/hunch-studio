export type PlateMeta = {
  id: string;
  no: string;
  label: string;
  note: string;
  stock: "ink" | "bone" | "cobalt";
};

export const PLATES: PlateMeta[] = [
  { id: "signal", no: "00", label: "The Signal", note: "a studio, by feel", stock: "ink" },
  { id: "bin", no: "01", label: "The Bin", note: "six things we killed", stock: "ink" },
  { id: "patch", no: "02", label: "The Patch Bay", note: "pull a cable", stock: "bone" },
  { id: "fugue", no: "03", label: "The Fugue", note: "five movements, overlapping", stock: "cobalt" },
  { id: "ledger", no: "04", label: "The Ledger", note: "three ways in", stock: "bone" },
  { id: "seance", no: "05", label: "The Séance", note: "six frequencies", stock: "ink" },
  { id: "bench", no: "06", label: "The Bench", note: "tune the site", stock: "bone" },
  { id: "signoff", no: "07", label: "Sign-Off", note: "and out", stock: "ink" },
];
