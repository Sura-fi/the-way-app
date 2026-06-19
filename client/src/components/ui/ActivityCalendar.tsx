"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { ChevronLeft, ChevronRight, CloudOff } from "lucide-react";
import { db } from "@/lib/db";
import { apiFetch } from "@/lib/api";
import { useOnline } from "@/components/providers/OnlineStatusProvider";
import { useLocale } from "@/components/providers/LocaleProvider";

interface ActivityCalendarProps {
  refreshKey: number;
}

// Minimal shape the calendar needs — satisfied by BOTH the server response
// (ChecklistResponse) and a local Dexie LocalDailyLog, so neither path errors.
interface CalendarLog {
  logDate: string;
  prayer: string[];
  bibleReading: string[];
  spiritualBooks: string[];
  goodDeeds: string[];
  avoidingEvil: string[];
}

const ACTIVITY_FIELDS: (keyof Pick<
  CalendarLog,
  "prayer" | "bibleReading" | "spiritualBooks" | "goodDeeds" | "avoidingEvil"
>)[] = [
  "prayer",
  "bibleReading",
  "spiritualBooks",
  "goodDeeds",
  "avoidingEvil",
];

const DAY_NAMES = ["S", "M", "T", "W", "T", "F", "S"];

function countCompleted(log: CalendarLog): number {
  return ACTIVITY_FIELDS.filter(
    (field) => Array.isArray(log[field]) && log[field].length > 0
  ).length;
}

function getMonthDays(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) week.push(null);

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return weeks;
}

function ActivityCalendar({ refreshKey }: ActivityCalendarProps) {
  const { isOnline } = useOnline();
  const { t } = useLocale();

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [logs, setLogs] = useState<CalendarLog[]>([]);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, "0")}`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function loadMonth() {
      try {
        // Server is the source of truth — survives the offline-cache clear.
        const result = await apiFetch<CalendarLog[]>(
          `/api/me/logs?from=${monthStart}&to=${monthEnd}`
        );
        if (!cancelled) setLogs(result);
      } catch {
        // Offline / server unreachable — fall back to local Dexie.
        const local = await db.dailyLogs
          .where("logDate")
          .between(monthStart, monthEnd, true, true)
          .toArray();
        if (!cancelled) setLogs(local);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMonth();

    return () => {
      cancelled = true;
    };
    // isOnline added so reconnecting re-fetches the current month from the server.
  }, [monthStart, monthEnd, refreshKey, isOnline]);

  const logsByDate = useMemo(() => {
    const map = new Map<string, CalendarLog>();
    for (const log of logs) {
      map.set(log.logDate, log);
    }
    return map;
  }, [logs]);

  const weeks = useMemo(() => getMonthDays(year, month), [year, month]);

  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(currentDate);

  const goPrev = () =>
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goNext = () =>
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div className="sacred-card border-l-4 border-l-gold-muted relative overflow-hidden">
      {/* Decorative top bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-gold-muted/10 via-gold-muted to-gold-muted/10" />

      {/* Header with cross */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goPrev}
          className="p-1.5 rounded-lg hover:bg-gold-muted/10 transition-all text-gold-muted hover:text-gold-bright"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-gold-muted text-lg">✝</span>
          <span className="text-sm font-bold font-ethiopic text-umber-deep tracking-wide">
            {monthLabel}
          </span>
        </div>

        <button
          onClick={goNext}
          className="p-1.5 rounded-lg hover:bg-gold-muted/10 transition-all text-gold-muted hover:text-gold-bright"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 mb-1.5">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="text-center text-[10px] font-semibold text-gold-muted/60 uppercase tracking-widest py-1"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="space-y-0.5">
        {loading
          ? Array.from({ length: 5 }).map((_, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: 7 }).map((_, di) => (
                  <div
                    key={di}
                    className="h-9 rounded-md bg-parchment-dark/10 animate-pulse"
                  />
                ))}
              </div>
            ))
          : weeks.map((week, wi) => (
              <div
                key={wi}
                className={`grid grid-cols-7 gap-0.5 rounded-md px-0.5 py-0.5 ${
                  wi % 2 === 1 ? "bg-parchment/40" : ""
                }`}
              >
                {week.map((day, di) => {
                  if (day === null)
                    return <div key={di} className="h-9" />;

                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const log = logsByDate.get(dateStr);
                  const completed = log ? countCompleted(log) : 0;
                  const isToday = dateStr === today;

                  let bg = "";
                  let textColor = "text-umber-soft";
                  let dotColor = "";

                  if (completed === 5) {
                    bg = "bg-sage/20";
                    textColor = "text-sage font-bold";
                    dotColor = "bg-sage";
                  } else if (completed > 0) {
                    bg = "bg-gold-muted/15";
                    textColor = "text-gold-muted font-semibold";
                    dotColor = "bg-gold-muted";
                  }

                  return (
                    <div
                      key={di}
                      className={`h-9 rounded-lg flex flex-col items-center justify-center text-xs transition-all relative ${bg} ${textColor} ${
                        isToday
                          ? "ring-1 ring-gold-muted shadow-[0_0_6px_rgba(196,168,98,0.25)]"
                          : "hover:ring-1 hover:ring-parchment-dark/20"
                      }`}
                    >
                      <span className="font-ethiopic">{day}</span>
                      {completed > 0 && (
                        <span
                          className={`absolute -bottom-0.5 w-1 h-1 rounded-full ${dotColor}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
      </div>

      {/* Decorative divider */}
      <div className="flex items-center justify-center gap-2 my-3 text-[10px] text-gold-muted/30">
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-muted/20 to-transparent" />
        <span>✝</span>
        <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold-muted/20 to-transparent" />
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 text-[10px] text-umber-soft">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sage/50" />
          All 5
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-gold-muted/50" />
          Partial
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-parchment-dark/30" />
          None
        </span>
      </div>

      {/* Offline notice — calendar falls back to local data when offline */}
      {!isOnline && (
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-umber-soft/70">
          <CloudOff className="w-3 h-3" />
          <span>{t("today.offline_data")}</span>
        </div>
      )}
    </div>
  );
}

export default memo(ActivityCalendar);
