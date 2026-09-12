"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import type { HubConnection } from "@microsoft/signalr";
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
  connection: HubConnection | null; // started real-time connection (null until connected)
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
  const [connection, setConnection] = useState<HubConnection | null>(null);

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

        // Share the connection so other components can subscribe (useHubEvent)
        if (isMounted) setConnection(conn);
      } catch {
        // SignalR connection failed — not critical
      }
    }

    init();

    // Cleanup on unmount or user change
    return () => {
      isMounted = false;
      setConnection(null);
      stopQuoteConnection();
    };
  }, [token]);

  return (
    <QuoteContext.Provider value={{ quote, isLoading, connection }}>
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

// ── Subscribe to a hub event for the lifetime of a component ──
export function useHubEvent<T>(event: string, handler: (payload: T) => void) {
  const { connection } = useQuote();

  // Always call the latest handler without re-subscribing
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!connection) return;
    const listener = (payload: T) => handlerRef.current(payload);
    connection.on(event, listener);
    return () => connection.off(event, listener);
  }, [connection, event]);
}
