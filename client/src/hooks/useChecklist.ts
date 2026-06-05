"use client";

import { useState, useEffect, useCallback } from "react";
import { db, LocalDailyLog } from "@/lib/db";
import { apiFetch } from "@/lib/api";
import { useOnline } from "@/components/providers/OnlineStatusProvider";

// ── Types matching the backend response ─────────
interface ChecklistResponse {
  id: string;
  logDate: string;
  prayer: string[];
  bibleReading: string[];
  spiritualBooks: string[];
  goodDeeds: string[];
  avoidingEvil: string[];
  updatedAt: string;
}

// ── The 5 toggle keys ───────────────────────────
export type ToggleKey =
  | "prayer"
  | "bibleReading"
  | "spiritualBooks"
  | "goodDeeds"
  | "avoidingEvil";

export interface ChecklistState {
  prayer: string[];
  bibleReading: string[];
  spiritualBooks: string[];
  goodDeeds: string[];
  avoidingEvil: string[];
}

const DEFAULT_STATE: ChecklistState = {
  prayer: [],
  bibleReading: [],
  spiritualBooks: [],
  goodDeeds: [],
  avoidingEvil: [],
};

// ── Helper: today's date as "YYYY-MM-DD" ────────
function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function ensureArray(v: unknown): string[] {
  if (Array.isArray(v)) return v;
  return [];
}

// ── The Hook ────────────────────────────────────
export function useChecklist() {
  const [checklist, setChecklist] = useState<ChecklistState>(DEFAULT_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { isOnline } = useOnline();

  const today = getTodayString();

  // ── Load today's checklist on mount ───────────
  useEffect(() => {
    async function loadChecklist() {
      setIsLoading(true);

      // 1. Try loading from local DB first (instant)
      const localLog = await db.dailyLogs
        .where("logDate")
        .equals(today)
        .first();

      if (localLog) {
        setChecklist({
          prayer: ensureArray(localLog.prayer),
          bibleReading: ensureArray(localLog.bibleReading),
          spiritualBooks: ensureArray(localLog.spiritualBooks),
          goodDeeds: ensureArray(localLog.goodDeeds),
          avoidingEvil: ensureArray(localLog.avoidingEvil),
        });
      }

      // 2. If online, also fetch from server (source of truth)
      if (isOnline) {
        try {
          const response = await apiFetch<ChecklistResponse>(
            `/api/checklist/today?date=${today}`
          );

          if (response && response.id) {
            const serverState = {
              prayer: ensureArray(response.prayer),
              bibleReading: ensureArray(response.bibleReading),
              spiritualBooks: ensureArray(response.spiritualBooks),
              goodDeeds: ensureArray(response.goodDeeds),
              avoidingEvil: ensureArray(response.avoidingEvil),
            };
            setChecklist(serverState);

            await db.dailyLogs
              .where("logDate")
              .equals(today)
              .modify({
                ...serverState,
                syncStatus: "synced",
                updatedAt: response.updatedAt,
              });
          }
        } catch {
          // Server unreachable — local data is fine
        }
      }

      setIsLoading(false);
    }

    loadChecklist();
  }, [today, isOnline]);

  // ── Save full state to Dexie ─────────────────
  const saveToDexie = useCallback(
    async (state: ChecklistState) => {
      const existing = await db.dailyLogs
        .where("logDate")
        .equals(today)
        .first();

      const logData = {
        logDate: today,
        ...state,
        syncStatus: "pending" as const,
        updatedAt: new Date().toISOString(),
      };

      if (existing?.id) {
        await db.dailyLogs.update(existing.id, logData);
      } else {
        await db.dailyLogs.add(logData as LocalDailyLog);
      }
    },
    [today]
  );

  // ── Sync full state to server ────────────────
  const syncToServer = useCallback(
    async (state: ChecklistState) => {
      if (!isOnline) return;

      try {
        await apiFetch<ChecklistResponse>("/api/checklist/today", {
          method: "PUT",
          body: JSON.stringify({ ...state, logDate: today }),
        });

        const log = await db.dailyLogs
          .where("logDate")
          .equals(today)
          .first();

        if (log?.id) {
          await db.dailyLogs.update(log.id, { syncStatus: "synced" });
        }
      } catch {
        // Failed to sync — stays "pending", will sync later
      }
    },
    [today, isOnline]
  );

  // ── Set selections for an activity ────────────
  const setSelections = useCallback(
    async (key: ToggleKey, selections: string[]) => {
      const newChecklist = { ...checklist, [key]: selections };
      setChecklist(newChecklist);
      setIsSaving(true);

      await saveToDexie(newChecklist);
      await syncToServer(newChecklist);

      setIsSaving(false);
    },
    [checklist, saveToDexie, syncToServer]
  );

  return { checklist, setSelections, isLoading, isSaving };
}
