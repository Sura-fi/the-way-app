import Dexie, { type Table } from "dexie";

// ── The shape of a daily log stored locally ─────
export interface LocalDailyLog {
  id?: number; // Auto-incremented by Dexie
  logDate: string; // "2026-05-26" format
  prayer: string[];
  bibleReading: string[];
  spiritualBooks: string[];
  goodDeeds: string[];
  avoidingEvil: string[];
  syncStatus: "pending" | "synced";
  updatedAt: string; // ISO timestamp
}

// ── The shape of the cached Priest quote ────────
export interface CachedQuote {
  id: string; // Always "active" — we only store one
  content: string;
  publisherName: string;
  publishedAt: string;
}

// ── Define the database ─────────────────────────
class TheWayDB extends Dexie {
  dailyLogs!: Table<LocalDailyLog>;
  cachedQuote!: Table<CachedQuote>;

  constructor() {
    super("TheWayDB");

    // Version 1: original schema
    this.version(1).stores({
      dailyLogs: "++id, logDate, syncStatus",
      cachedQuote: "id",
    });
  }
}

// ── Export a single instance ────────────────────
export const db = new TheWayDB();
