import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/bricolage-grotesque/wght.css";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/jetbrains-mono/wght.css";
import "@fontsource-variable/onest/wght.css";
import "@fontsource-variable/playfair-display/wght.css";
import "@fontsource-variable/playfair-display/wght-italic.css";
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
import { LocaleProvider } from "./i18n";
import { applyLang, resolveLocale } from "./i18n/locale";

applyLang(resolveLocale());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LocaleProvider>
      <App />
    </LocaleProvider>
  </StrictMode>,
);
