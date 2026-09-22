import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { pt, type Dict, type TKey } from "./pt";
import { en } from "./en";
import { es } from "./es";
import { setSpeechLang } from "@/lib/audio";

export type Lang = "pt" | "en" | "es";

export const LANGS: { id: Lang; label: string; flag: string }[] = [
  { id: "pt", label: "PT", flag: "🇧🇷" },
  { id: "en", label: "EN", flag: "🇺🇸" },
  { id: "es", label: "ES", flag: "🇪🇸" },
];

const DICTS: Record<Lang, Dict> = { pt, en, es };
const KEY = "zeno-lang";

export function speechLangOf(lang: Lang): string {
  return lang === "en" ? "en-US" : lang === "es" ? "es-ES" : "pt-BR";
}

export type Translate = (key: TKey, vars?: Record<string, string | number>) => string;

function translate(lang: Lang, key: TKey, vars?: Record<string, string | number>): string {
  const raw = DICTS[lang][key] ?? pt[key] ?? String(key);
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? ""));
}

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translate;
}

const LanguageContext = createContext<Ctx>({ lang: "pt", setLang: () => {}, t: (k) => translate("pt", k) });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt");

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY) as Lang | null;
    if (stored && stored in DICTS) setLangState(stored);
  }, []);

  useEffect(() => {
    setSpeechLang(speechLangOf(lang));
    document.documentElement.lang = speechLangOf(lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(KEY, next);
  }, []);

  const t = useCallback<Translate>((key, vars) => translate(lang, key, vars), [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  return useContext(LanguageContext);
}

/** Atalho para telas que só precisam traduzir textos. */
export function useT(): Translate {
  return useContext(LanguageContext).t;
}
