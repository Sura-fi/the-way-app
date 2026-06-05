"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { apiFetch } from "@/lib/api";
import { getQuoteConnection, stopQuoteConnection } from "@/lib/signalr";

// ── Types ───────────────────────────────────────
export interface Quote {
  id: string;
  content: string;
  publishedAt: string;
  publisherName: string;
}

interface QuoteContextType {
  quote: Quote | null;
  isLoading: boolean;
}

// ── localStorage Cache Key ──────────────────────
const QUOTE_CACHE_KEY = "theway_cached_quote";

function cacheQuote(quote: Quote): void {
  localStorage.setItem(QUOTE_CACHE_KEY, JSON.stringify(quote));
}

function getCachedQuote(): Quote | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(QUOTE_CACHE_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data) as Quote;
  } catch {
    return null;
  }
}

// ── Context ─────────────────────────────────────
const QuoteContext = createContext<QuoteContextType | undefined>(undefined);

// ── Provider ────────────────────────────────────
export function QuoteProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const token = user?.token ?? null;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Fetch initial quote + start SignalR ────────
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function init() {
      if (!token) return;

      // 1. Load cached quote immediately (instant, works offline)
      const cached = getCachedQuote();
      if (cached && isMounted) {
        setQuote(cached);
      }

      // 2. Fetch active quote from server
      if (navigator.onLine) {
        try {
          const response = await apiFetch<Quote>("/api/quotes/active");
          if (response && response.id && isMounted) {
            setQuote(response);
            cacheQuote(response);
          }
        } catch {
          // Server unreachable — cached quote is fine
        }
      }

      if (isMounted) setIsLoading(false);

      // 3. Connect to SignalR for real-time updates
      try {
        const conn = getQuoteConnection(token);

        conn.on("ReceiveQuote", (newQuote: Quote) => {
          if (isMounted) {
            setQuote(newQuote);
            cacheQuote(newQuote);
          }
        });

        if (conn.state === "Disconnected") {
          await conn.start();
        }
      } catch {
        // SignalR connection failed — not critical
      }
    }

    init();

    // Cleanup on unmount or user change
    return () => {
      isMounted = false;
      stopQuoteConnection();
    };
  }, [token]);

  return (
    <QuoteContext.Provider value={{ quote, isLoading }}>
      {children}
    </QuoteContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────
export function useQuote() {
  const context = useContext(QuoteContext);
  if (context === undefined) {
    throw new Error("useQuote must be used within a QuoteProvider");
  }
  return context;
}
