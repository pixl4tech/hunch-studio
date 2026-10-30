import { INTL_LOCALE, type Locale } from "./locale";

export function makeFormat(locale: Locale) {
  const intl = INTL_LOCALE[locale];
  const number = (value: number, digits = 0) =>
    new Intl.NumberFormat(intl, {
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    }).format(value);
  const currency = (value: number, suffix = "") => `€${number(value)}${suffix}`;
  const time = (date: Date, timeZone: string) =>
    new Intl.DateTimeFormat(intl, {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(date);
  const plural = (count: number, forms: { one: string; few?: string; many?: string; other: string }) => {
    const rule = new Intl.PluralRules(intl).select(count) as "one" | "few" | "many" | "other";
    return forms[rule] ?? forms.other;
  };
  return { intl, number, currency, time, plural };
}

export type Format = ReturnType<typeof makeFormat>;

export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}
