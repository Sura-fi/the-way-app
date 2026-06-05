"use client";

import { createContext, useContext, useEffect, ReactNode } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { syncPendingLogs } from "@/lib/sync";

// ── Context ─────────────────────────────────────
interface OnlineContextType {
  isOnline: boolean;
}

const OnlineContext = createContext<OnlineContextType | undefined>(undefined);

// ── Provider ────────────────────────────────────
export function OnlineStatusProvider({ children }: { children: ReactNode }) {
  const { isOnline } = useOnlineStatus();

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      // Small delay to let the network stabilize
      const timer = setTimeout(() => {
        syncPendingLogs();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  return (
    <OnlineContext.Provider value={{ isOnline }}>
      {children}
    </OnlineContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────
export function useOnline() {
  const context = useContext(OnlineContext);
  if (context === undefined) {
    throw new Error("useOnline must be used within an OnlineStatusProvider");
  }
  return context;
}
