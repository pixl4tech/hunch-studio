import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/bricolage-grotesque/wght.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "./styles/base.css";
import "./styles/plate-signal.css";
import "./styles/plate-bin.css";
import "./styles/plate-patch.css";
import "./styles/plate-fugue.css";
import "./styles/plate-ledger.css";
import "./styles/plate-seance.css";
import "./styles/plate-bench.css";
import "./styles/plate-signoff.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
