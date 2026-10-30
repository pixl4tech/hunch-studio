import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { en, type Content } from "./en";
import { ru } from "./ru";
import { fill, makeFormat, type Format } from "./format";
import {
  applyLang,
  DEFAULT_LOCALE,
  isLocale,
  persistLocale,
  readStoredLocale,
  readUrlLocale,
  resolveLocale,
  writeLocaleToUrl,
  type Locale,
} from "./locale";

type I18n = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  c: Content;
  fmt: Format;
  fill: typeof fill;
};

const Ctx = createContext<I18n | null>(null);

function setMeta(selector: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    const name = selector.match(/name="([^"]+)"/)?.[1];
    const property = selector.match(/property="([^"]+)"/)?.[1];
    if (name) el.setAttribute("name", name);
    if (property) el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => resolveLocale());
  const c = locale === "ru" ? ru : en;

  useEffect(() => {
    applyLang(locale);
    if (readUrlLocale()) persistLocale(locale);
    document.title = c.meta.title;
    setMeta('meta[name="description"]', c.meta.description);
    setMeta('meta[property="og:title"]', c.meta.ogTitle);
    setMeta('meta[property="og:description"]', c.meta.ogDescription);
    setMeta('meta[name="twitter:title"]', c.meta.ogTitle);
    setMeta('meta[name="twitter:description"]', c.meta.ogDescription);
    setMeta('meta[property="og:locale"]', locale === "ru" ? "ru_RU" : "en_GB");
  }, [locale, c]);

  useEffect(() => {
    const onPop = () => {
      const fromUrl = readUrlLocale();
      if (fromUrl && fromUrl !== locale) {
        setLocaleState(fromUrl);
        persistLocale(fromUrl);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    if (!isLocale(next)) return;
    setLocaleState(next);
    persistLocale(next);
    writeLocaleToUrl(next);
    applyLang(next);
  }, []);

  const value = useMemo<I18n>(
    () => ({ locale, setLocale, c, fmt: makeFormat(locale), fill }),
    [locale, setLocale, c],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const value = useContext(Ctx);
  if (!value) throw new Error("useI18n must be used inside LocaleProvider");
  return value;
}

/** [[em]]…[[/em]], [[b]]…[[/b]], [[br]] — no innerHTML. */
export function Rich({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  const stack: { tag: "em" | "b"; children: ReactNode[] }[] = [];
  const target = () => (stack.length ? stack[stack.length - 1].children : nodes);
  let key = 0;
  const token = /\[\[(\/?)(em|b)\]\]|\[\[br\]\]/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = token.exec(text))) {
    const before = text.slice(last, match.index);
    if (before) target().push(before);
    last = token.lastIndex;
    if (match[0] === "[[br]]") {
      target().push(<br key={`br-${key++}`} />);
    } else if (match[1] === "/") {
      const done = stack.pop();
      if (done) target().push(done.tag === "em" ? <em key={`t-${key++}`}>{done.children}</em> : <b key={`t-${key++}`}>{done.children}</b>);
    } else {
      stack.push({ tag: match[2] as "em" | "b", children: [] });
    }
  }
  const rest = text.slice(last);
  if (rest) target().push(rest);
  while (stack.length) {
    const done = stack.pop()!;
    target().push(done.tag === "em" ? <em key={`t-${key++}`}>{done.children}</em> : <b key={`t-${key++}`}>{done.children}</b>);
  }
  return <>{nodes}</>;
}
