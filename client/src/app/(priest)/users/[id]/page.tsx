"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "@/components/providers/LocaleProvider";
import { apiFetch } from "@/lib/api";
import en from "@/locales/en.json";
import {
  ArrowLeft,
  Flame,
  BarChart3,
  Table2,
  ClipboardList,
  UserX,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Target,
  Mail,
  Phone
} from "lucide-react";
import ReviewSection from "@/components/ui/ReviewSection";
import ProgressGraph from "@/components/ui/ProgressGraph";

// Keep this synchronized with backend UserDetailResponse
interface UserDetail {
  id: string;
  formalName: string;
  spiritualName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  totalLogs: number;
  completionRate: number;
  currentStreak: number;
  joinedAt: string;
  currentWeekNumber: number;
  currentDayInWeek: number;
  currentWeekStart: string;
  currentWeekEnd: string;
}

interface DailyLog {
  id: string;
  logDate: string;
  prayer: string[];
  bibleReading: string[];
  spiritualBooks: string[];
  goodDeeds: string[];
  avoidingEvil: string[];
  updatedAt: string;
}

interface WeekSummary {
  daysWithActivity: number;
  totalActivities: number;
  completionRate: number;
  strongestAreas: string[];
  weakestAreas: string[];
}

interface WeekLogsResponse {
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  isCurrentWeek: boolean;
  isComplete: boolean;
  logs: (DailyLog | null)[];
  summary: WeekSummary;
  hasReview: boolean;
}

const CHOICE_LABELS: Record<string, string> = {};
function getChoiceLabel(key: string): string {
  if (CHOICE_LABELS[key]) return CHOICE_LABELS[key];
  for (const section of ["prayer_choices", "bible_choices", "spiritual_choices", "deeds_choices", "evil_choices"]) {
    const data = (en.today as Record<string, unknown>)[section] as Record<string, string> | undefined;
    if (data?.[key]) {
      CHOICE_LABELS[key] = data[key];
      return data[key];
    }
  }
  return key;
}

function formatSelections(items: string[] | undefined): string {
  if (!items || items.length === 0) return "—";
  return items.map(getChoiceLabel).join(", ");
}

function parseLocalDate(dateString: string) {
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function PriestUserDetailPage() {
  const { t } = useLocale();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [weekData, setWeekData] = useState<WeekLogsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingWeek, setIsLoadingWeek] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "graph">("table");

  // ── Fetch user details ───────────
  useEffect(() => {
    async function fetchUser() {
      setIsLoading(true);
      try {
        const userData = await apiFetch<UserDetail>(`/api/users/${userId}`);
        setUser(userData);
        setSelectedWeek(userData.currentWeekNumber);
      } catch {
        // Handle error silently
      }
      setIsLoading(false);
    }
    if (userId) fetchUser();
  }, [userId]);

  // ── Fetch specific week ───────────
  useEffect(() => {
    async function fetchWeek() {
      if (!selectedWeek || !userId) return;
      setIsLoadingWeek(true);
      try {
        const data = await apiFetch<WeekLogsResponse>(`/api/users/${userId}/logs/week/${selectedWeek}`);
        setWeekData(data);
      } catch {
        setWeekData(null);
      }
      setIsLoadingWeek(false);
    }
    fetchWeek();
  }, [userId, selectedWeek]);

  // ── Toggle user active status ─────────────────
  const handleToggleStatus = async () => {
    if (!user) return;
    const confirmMsg = user.isActive ? t("priest.confirm_deactivate") : t("priest.confirm_activate");
    if (!confirm(confirmMsg)) return;

    setIsTogglingStatus(true);
    try {
      await apiFetch(`/api/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      setUser({ ...user, isActive: !user.isActive });
    } catch {
      // Handle error silently
    }
    setIsTogglingStatus(false);
  };

  // ── Hard Delete user ──────────────────────────
  const handleDelete = async () => {
    if (!user) return;
    if (!confirm(t("priest.confirm_delete"))) return;

    setIsDeleting(true);
    try {
      await apiFetch(`/api/users/${userId}`, { method: "DELETE" });
      router.replace("/dashboard");
    } catch {
      // Handle error silently
    }
    setIsDeleting(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-4">
        <div className="h-8 w-48 bg-parchment rounded animate-pulse" />
        <div className="h-32 bg-parchment rounded-xl animate-pulse" />
        <div className="h-64 bg-parchment rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="sacred-card text-center text-umber-soft py-8">
        {t("priest.user_not_found")}
      </div>
    );
  }

  // Calculate dates for the table (always 7 days based on week bounds)
  const dateRange: string[] = [];
  const validLogs: DailyLog[] = [];
  const logsByDate = new Map<string, DailyLog>();

  if (weekData) {
    // Week logs are always 7 items, null if not exist/future
    const currentD = parseLocalDate(weekData.weekStart);
    for (let i = 0; i < 7; i++) {
      const y = currentD.getFullYear();
      const m = String(currentD.getMonth() + 1).padStart(2, "0");
      const d = String(currentD.getDate()).padStart(2, "0");
      dateRange.push(`${y}-${m}-${d}`);
      currentD.setDate(currentD.getDate() + 1);
    }

    weekData.logs.forEach(log => {
      if (log && log.id !== "00000000-0000-0000-0000-000000000000") {
        logsByDate.set(log.logDate, log);
        validLogs.push(log);
      }
    });
  }

  // Map server category keys to translated display names
  const categoryLabel = (key: string): string => {
    const map: Record<string, string> = {
      Prayer: t("today.prayer"),
      BibleReading: t("today.bible_reading"),
      SpiritualBooks: t("today.spiritual_books"),
      GoodDeeds: t("today.good_deeds"),
      AvoidingEvil: t("today.avoiding_evil"),
    };
    return map[key] ?? key;
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* ── Header & Stats Card ─────────────────── */}
      <div className="sacred-card flex flex-col pt-6 pb-6 px-4 sm:px-8 relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-muted/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

        {/* Top bar: back + status */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-1.5 text-umber-soft hover:text-umber-deep hover:bg-gold-muted/10 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${user.isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
              {user.isActive ? t("priest.active") : t("priest.inactive")}
            </span>
          </div>

          {/* User info */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-2">
              <h1 className="text-3xl font-bold font-ethiopic text-umber-deep">
                {user.formalName}
              </h1>
              <p className="text-xl font-ethiopic text-umber-soft/80 italic">
                {user.spiritualName}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-umber-deep/70 mb-3">
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-parchment-dark" />
                {user.email}
              </div>
              {user.phoneNumber && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-parchment-dark" />
                  {user.phoneNumber}
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-umber-soft bg-parchment-dark/10 px-2.5 py-1 rounded-md border border-parchment-dark/10">
                Joined {new Date(user.joinedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <span className="text-xs font-bold text-gold-muted bg-gold-muted/10 px-2.5 py-1 rounded-md border border-gold-muted/20">
                Week {user.currentWeekNumber} • Day {user.currentDayInWeek}
              </span>
            </div>
          </div>

          {/* Admin actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleStatus}
              disabled={isTogglingStatus}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${user.isActive
                  ? "bg-warm-red/10 text-warm-red hover:bg-warm-red/20"
                  : "bg-sage/10 text-sage hover:bg-sage/20"
                } disabled:opacity-50`}
            >
              <UserX className="w-3.5 h-3.5" />
              {user.isActive ? t("priest.deactivate") : t("priest.activate")}
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-warm-red/10 text-warm-red hover:bg-warm-red/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? t("priest.deleting") : t("priest.delete_godchild")}
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-parchment-dark/30 my-6 relative" />

        {/* Global Stats Row */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center px-4 relative gap-6 sm:gap-0">
          
          {/* Lifetime Logs */}
          <div className="group relative flex items-center gap-4 cursor-help">
            <div className="w-12 h-12 rounded-xl bg-gold-muted/10 flex items-center justify-center transition-all duration-300 group-hover:bg-gold-muted/20 group-hover:scale-105">
              <ClipboardList className="w-6 h-6 text-gold-muted" />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-gold-muted leading-none mb-1">
                {user.totalLogs}
              </span>
              <span className="text-sm font-medium text-umber-deep leading-tight border-b border-dashed border-umber-deep/30 pb-0.5">
                Lifetime Logs
              </span>
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 rounded-xl bg-charcoal/95 backdrop-blur-md text-cream-white text-xs font-medium opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl z-20 text-center leading-relaxed">
              The total number of individual spiritual activities completed across all days since joining.
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-charcoal/95"></div>
            </div>
          </div>

          {/* Current Pace */}
          <div className="group relative flex items-center gap-4 cursor-help">
            <div className="relative w-16 h-16 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gold-muted/20"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-gold-muted transition-all duration-1000 ease-out"
                  strokeWidth="4"
                  strokeDasharray={`${user.completionRate}, 100`}
                  stroke="currentColor"
                  fill="none"
                  strokeLinecap="round"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xs font-bold text-gold-muted">
                {user.completionRate}%
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-umber-deep leading-tight mt-1 border-b border-dashed border-umber-deep/30 pb-0.5">
                Current Pace
              </span>
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 rounded-xl bg-charcoal/95 backdrop-blur-md text-cream-white text-xs font-medium opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl z-20 text-center leading-relaxed">
              The percentage of possible activities completed so far in their current 7-day week (out of 35).
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-charcoal/95"></div>
            </div>
          </div>

          {/* Current Streak */}
          <div className="group relative flex items-center gap-4 cursor-help">
            <div className="w-12 h-12 rounded-xl bg-warm-red/10 flex items-center justify-center transition-all duration-300 group-hover:bg-warm-red/20 group-hover:scale-105">
              <Flame className="w-6 h-6 text-warm-red" />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-warm-red leading-none mb-1">
                {user.currentStreak}
              </span>
              <span className="text-sm font-medium text-umber-deep leading-tight border-b border-dashed border-umber-deep/30 pb-0.5">
                Current Streak
              </span>
            </div>
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 p-3 rounded-xl bg-charcoal/95 backdrop-blur-md text-cream-white text-xs font-medium opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-xl z-20 text-center leading-relaxed">
              Consecutive days with at least one logged activity. Missing an entire day resets this to 0.
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-charcoal/95"></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Weekly View Section ──────────────────── */}
      <div className="sacred-card p-0 overflow-hidden">
        {/* Week Navigator */}
        <div className="bg-parchment-dark/10 p-4 border-b border-parchment-dark/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSelectedWeek(prev => prev ? Math.max(1, prev - 1) : 1)}
              disabled={selectedWeek === 1}
              className="p-1 rounded text-umber-soft hover:bg-white hover:text-umber-deep disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center min-w-0 sm:min-w-32">
              <span className="font-bold text-umber-deep">
                {selectedWeek === user.currentWeekNumber ? "Current Week (W" + selectedWeek + ")" : "Week " + selectedWeek}
              </span>
              {weekData && (
                <span className="text-xs text-umber-soft">
                  {parseLocalDate(weekData.weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {parseLocalDate(weekData.weekEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
            <button 
              onClick={() => setSelectedWeek(prev => prev ? Math.min(user.currentWeekNumber, prev + 1) : user.currentWeekNumber)}
              disabled={selectedWeek === user.currentWeekNumber}
              className="p-1 rounded text-umber-soft hover:bg-white hover:text-umber-deep disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-1 bg-parchment-dark/10 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${viewMode === "table"
                  ? "bg-white text-umber-deep shadow-sm"
                  : "text-umber-soft hover:text-umber-deep"
                }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              {t("priest.view_table")}
            </button>
            <button
              onClick={() => setViewMode("graph")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${viewMode === "graph"
                  ? "bg-white text-umber-deep shadow-sm"
                  : "text-umber-soft hover:text-umber-deep"
                }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              {t("priest.view_graph")}
            </button>
          </div>
        </div>

        {isLoadingWeek ? (
          <div className="p-8 flex justify-center">
            <div className="animate-pulse flex space-x-4">
              <div className="h-12 w-12 bg-parchment rounded-full"></div>
              <div className="space-y-3">
                <div className="h-4 w-48 bg-parchment rounded"></div>
                <div className="h-4 w-32 bg-parchment rounded"></div>
              </div>
            </div>
          </div>
        ) : weekData ? (
          <>
            {viewMode === "table" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-parchment-dark/5">
                      <th className="px-2 sm:px-5 py-2 sm:py-3 text-[11px] sm:text-sm font-medium text-umber-deep border-b border-parchment-dark/20 whitespace-nowrap">Day</th>
                      <th className="px-2 sm:px-5 py-2 sm:py-3 text-[11px] sm:text-sm font-medium text-umber-deep border-b border-parchment-dark/20 text-center">Prayer</th>
                      <th className="px-2 sm:px-5 py-2 sm:py-3 text-[11px] sm:text-sm font-medium text-umber-deep border-b border-parchment-dark/20 text-center">Bible Reading</th>
                      <th className="px-2 sm:px-5 py-2 sm:py-3 text-[11px] sm:text-sm font-medium text-umber-deep border-b border-parchment-dark/20 text-center">Spiritual Books</th>
                      <th className="px-2 sm:px-5 py-2 sm:py-3 text-[11px] sm:text-sm font-medium text-umber-deep border-b border-parchment-dark/20 text-center">Good Deeds</th>
                      <th className="px-2 sm:px-5 py-2 sm:py-3 text-[11px] sm:text-sm font-medium text-umber-deep border-b border-parchment-dark/20 text-center">Avoiding Evil</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-parchment-dark/10">
                    {dateRange.map((date, i) => {
                      const log = logsByDate.get(date);
                      const d = parseLocalDate(date);
                      
                      const todayLocal = new Date();
                      const todayY = todayLocal.getFullYear();
                      const todayM = String(todayLocal.getMonth() + 1).padStart(2, "0");
                      const todayD = String(todayLocal.getDate()).padStart(2, "0");
                      const todayStr = `${todayY}-${todayM}-${todayD}`;
                      
                      const isToday = date === todayStr;
                      const isFuture = date > todayStr;

                      return (
                        <tr key={date} className={`transition-colors ${isToday ? "bg-sage/5" : "hover:bg-parchment-dark/5"}`}>
                          <td className="px-2 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className={`font-medium ${isToday ? "text-sage font-bold" : "text-umber-deep"}`}>
                                Day {i + 1}
                              </span>
                              <span className="text-[10px] uppercase tracking-wider text-umber-soft">
                                {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                              </span>
                            </div>
                          </td>

                          {[
                            log?.prayer,
                            log?.bibleReading,
                            log?.spiritualBooks,
                            log?.goodDeeds,
                            log?.avoidingEvil,
                          ].map((items, idx) => {
                            const hasItems = items && items.length > 0;
                            return (
                              <td key={idx} className="px-2 sm:px-3 py-3 sm:py-4 text-center max-w-[60px] sm:max-w-40">
                                {isFuture ? (
                                  <span className="inline-block w-2 h-2 rounded-full bg-parchment-dark/20" />
                                ) : hasItems ? (
                                  <span className="text-[10px] sm:text-xs text-umber-deep leading-snug block truncate">
                                    {formatSelections(items)}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-parchment-dark/10 text-parchment-dark/40 font-bold text-xs">
                                    —
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {viewMode === "graph" && (
              <div className="p-5">
                <ProgressGraph logs={validLogs} dateRange={dateRange} />
              </div>
            )}

            {/* 7th Day Summary (Visible if week is complete or it's day 7) */}
            {(weekData.isComplete || (weekData.isCurrentWeek && user.currentDayInWeek === 7)) && (
              <div className="border-t border-parchment-dark/20 bg-parchment/30 p-6 relative">
                {!weekData.isCurrentWeek && (
                  <div className="relative sm:absolute sm:top-6 sm:right-6 mt-2 sm:mt-0">
                    <button
                      onClick={async () => {
                        if (!confirm(`Clear all logs and reviews for Week ${selectedWeek}?`)) return;
                        try {
                          await apiFetch(`/api/users/${userId}/weeks/${selectedWeek}`, { method: "DELETE" });
                          window.location.reload();
                        } catch {
                          alert("Failed to clear week data");
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-warm-red hover:bg-warm-red/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear Week Data
                    </button>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <Target className="w-5 h-5 text-gold-muted" />
                  <h3 className="font-bold text-umber-deep">{t("priest.week_summary").replace("{week}", String(selectedWeek))}</h3>
                  {weekData.hasReview ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sage/15 text-sage border border-sage/20">
                      ✓ {t("priest.reviewed")}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warm-red/10 text-warm-red border border-warm-red/20">
                      {t("priest.needs_review")}
                    </span>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white/50 p-4 rounded-xl border border-parchment-dark/10">
                    <div className="text-sm text-umber-soft mb-1">{t("priest.active_days")}</div>
                    <div className="text-2xl font-bold text-umber-deep">{weekData.summary.daysWithActivity} <span className="text-sm font-normal text-umber-soft">/ 7</span></div>
                  </div>
                  <div className="bg-white/50 p-4 rounded-xl border border-parchment-dark/10">
                    <div className="text-sm text-umber-soft mb-1">{t("priest.completion_rate")}</div>
                    <div className="text-2xl font-bold text-gold-muted">{weekData.summary.completionRate}%</div>
                  </div>

                  {/* Qualitative — Walking Strong */}
                  {weekData.summary.strongestAreas.length > 0 && (
                    <div className="bg-white/50 p-4 rounded-xl border border-parchment-dark/10 sm:col-span-2">
                      <div className="text-sm text-umber-soft mb-1">{t("priest.walking_strong")}</div>
                      <p className="text-sm text-sage italic leading-relaxed">
                        {weekData.summary.strongestAreas.length === 5
                          ? t("priest.summary_excellent").replace("{name}", user.spiritualName)
                          : t("priest.summary_good")
                              .replace("{name}", user.spiritualName)
                              .replace("{activity}", weekData.summary.strongestAreas
                                .map(categoryLabel).join(` ${t("common.and")} `))}
                      </p>
                    </div>
                  )}

                  {/* Qualitative — Gentle Encouragement */}
                  {weekData.summary.weakestAreas.length > 0 && (
                    <div className="bg-white/50 p-4 rounded-xl border border-parchment-dark/10 sm:col-span-2">
                      <div className="text-sm text-umber-soft mb-1">{t("priest.encouragement")}</div>
                      <p className="text-sm text-warm-red/80 italic leading-relaxed">
                        {t("priest.summary_low")
                            .replace("{name}", user.spiritualName)
                            .replace("{activity}", weekData.summary.weakestAreas
                              .map(categoryLabel).join(` ${t("common.and")} `))}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-8 text-center text-umber-soft">Failed to load week data.</div>
        )}
      </div>

      {/* Priest Reviews */}
      <ReviewSection userId={userId} />

    </div>
  );
}
