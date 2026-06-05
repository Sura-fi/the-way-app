"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import en from "@/locales/en.json";
import am from "@/locales/am.json";

// ── Types ───────────────────────────────────────
type Locale = "en" | "am";
type Translations = typeof en;

interface LocaleContextType {
  locale: Locale;
  t: (key: string) => string;
  switchLocale: (newLocale: Locale) => void;
}

// ── Context ─────────────────────────────────────
const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

const translations: Record<Locale, Translations> = { en, am };

// ── Provider ────────────────────────────────────
export function LocaleProvider({ children }: { children: ReactNode }) {
  // Default to Amharic if not set
  const [locale, setLocale] = useState<Locale>("am");

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("theway_locale");
    if (saved === "en" || saved === "am") {
      setLocale(saved as Locale);
    }
  }, []);

  // Change locale & save to localStorage
  const switchLocale = useCallback((newLocale: Locale) => {
    setLocale(newLocale);
    localStorage.setItem("theway_locale", newLocale);
  }, []);

  // Translation function: looks up "nav.app_title"
  const t = useCallback(
    (path: string): string => {
      const keys = path.split(".");
      let value: unknown = translations[locale];

      for (const key of keys) {
        if (value === undefined || value === null || typeof value !== "object") {
          value = undefined;
          break;
        }
        value = (value as Record<string, unknown>)[key];
      }

      // Fallback to English if Amharic translation is missing
      if (value === undefined && locale !== "en") {
        let fallback: unknown = translations["en"];
        for (const key of keys) {
          if (fallback === undefined || fallback === null || typeof fallback !== "object") {
            fallback = undefined;
            break;
          }
          fallback = (fallback as Record<string, unknown>)[key];
        }
        value = fallback;
      }

      return (value as string) || path; // Return the path itself if missing entirely
    },
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, t, switchLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────
export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return context;
}
