"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

  // Always-latest mirror of `checklist` so debounced/immediate writes never
  // act on a stale closure (e.g. a chip click right after typing).
  const checklistRef = useRef(checklist);
  checklistRef.current = checklist;

  // Pending debounce timer for typed free-text ("Other") saves.
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // ── Persist a state to Dexie + server ─────────
  const persist = useCallback(
    async (state: ChecklistState) => {
      setIsSaving(true);
      await saveToDexie(state);
      await syncToServer(state);
      setIsSaving(false);
    },
    [saveToDexie, syncToServer]
  );

  // ── Set selections (immediate save) ───────────
  // Used by chips, skip, confirm, and field-blur.
  const setSelections = useCallback(
    (key: ToggleKey, selections: string[]) => {
      const next = { ...checklistRef.current, [key]: selections };
      checklistRef.current = next;
      setChecklist(next);

      // Cancel any pending typed-text save — this immediate write supersedes it.
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      persist(next);
    },
    [persist]
  );

  // ── Set selections (debounced save) ───────────
  // Used by the "Other" free-text input so typing doesn't save every keystroke.
  const setSelectionsDebounced = useCallback(
    (key: ToggleKey, selections: string[]) => {
      const next = { ...checklistRef.current, [key]: selections };
      checklistRef.current = next;
      setChecklist(next);
      setIsSaving(true);

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        debounceTimer.current = null;
        persist(checklistRef.current);
      }, 400);
    },
    [persist]
  );

  // ── Flush a pending save on unmount (safety net) ─
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
        persist(checklistRef.current);
      }
    };
  }, [persist]);

  return { checklist, setSelections, setSelectionsDebounced, isLoading, isSaving };
}
