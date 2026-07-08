import { useUIStore } from "@/store/ui";
import type { Lang } from "./i18n";

export type Currency = "EGP" | "USD" | "EUR" | "SAR";

const RATES: Record<Currency, number> = {
  EGP: 1,
  USD: 1 / 50,
  EUR: 1 / 55,
  SAR: 1 / 13.5,
};

const SYMBOL: Record<Currency, string> = {
  EGP: "ج.م",
  USD: "$",
  EUR: "€",
  SAR: "ر.س",
};

export function formatCurrency(amountEGP: number, currency: Currency, lang: Lang) {
  const converted = amountEGP * RATES[currency];
  const locale = lang === "ar" ? "ar-EG" : "en-US";
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: currency === "EGP" ? 0 : 2,
  }).format(converted);
  return lang === "ar" ? `${formatted} ${SYMBOL[currency]}` : `${SYMBOL[currency]} ${formatted}`;
}

export function useMoney() {
  const currency = useUIStore((s) => s.currency);
  const lang = useUIStore((s) => s.lang);
  return (n: number) => formatCurrency(n, currency, lang);
}

export function formatDateLoc(iso: string, lang: Lang) {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-EG" : "en-US", { dateStyle: "medium" }).format(new Date(iso));
}
