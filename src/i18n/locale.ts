export type Locale = "en" | "ru";

export const LOCALES: Locale[] = ["en", "ru"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE = "hunch:locale";

export const INTL_LOCALE: Record<Locale, string> = {
  en: "en-GB",
  ru: "ru-RU",
};

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "ru";
}

export function readStoredLocale(): Locale | null {
  try {
    const value = localStorage.getItem(LOCALE_STORAGE);
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

export function readUrlLocale(search = window.location.search): Locale | null {
  try {
    const value = new URLSearchParams(search).get("lang")?.toLowerCase();
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

/** URL wins; otherwise the stored preference; otherwise English. */
export function resolveLocale(): Locale {
  return readUrlLocale() ?? readStoredLocale() ?? DEFAULT_LOCALE;
}

export function persistLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE, locale);
  } catch {
    /* private mode */
  }
}

/** Set ?lang= without touching the hash or any other query parameter. */
export function writeLocaleToUrl(locale: Locale): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", locale);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  } catch {
    /* no history */
  }
}

export function applyLang(locale: Locale): void {
  const root = document.documentElement;
  root.lang = locale;
  root.dataset.locale = locale;
}
