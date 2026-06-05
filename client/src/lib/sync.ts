import { db } from "@/lib/db";
import { apiFetch } from "@/lib/api";

/**
 * Syncs all pending local logs to the server.
 * Called on app load and when network is restored.
 */
export async function syncPendingLogs(): Promise<void> {
  // 1. Find all logs that haven't been synced
  const pendingLogs = await db.dailyLogs
    .where("syncStatus")
    .equals("pending")
    .toArray();

  if (pendingLogs.length === 0) return;

  // 2. Map to the shape the server expects
  const entries = pendingLogs.map((log) => ({
    logDate: log.logDate,
    prayer: log.prayer,
    bibleReading: log.bibleReading,
    spiritualBooks: log.spiritualBooks,
    goodDeeds: log.goodDeeds,
    avoidingEvil: log.avoidingEvil,
  }));

  try {
    // 3. Send all pending logs in one batch request
    await apiFetch("/api/checklist/sync", {
      method: "POST",
      body: JSON.stringify(entries),
    });

    // 4. Mark all as synced
    const ids = pendingLogs
      .map((log) => log.id)
      .filter((id): id is number => id !== undefined);

    await db.dailyLogs
      .where("id")
      .anyOf(ids)
      .modify({ syncStatus: "synced" });

  } catch {
    // Server unreachable — will retry next time
  }
}
