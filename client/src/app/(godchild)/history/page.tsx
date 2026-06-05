"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { History, ChevronDown, ChevronUp, Trash2, Target, CalendarDays, CheckCircle2 } from "lucide-react";
import ProgressGraph from "@/components/ui/ProgressGraph";

interface WeekSummary {
  daysWithActivity: number;
  totalActivities: number;
  completionRate: number;
  strongestAreas: string[];
  weakestAreas: string[];
}

interface WeekHistoryItem {
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  isCurrentWeek: boolean;
  isComplete: boolean;
  daysWithActivity: number;
  completionRate: number;
  reviewCount: number;
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

function WeekDetail({ weekNumber, onClear }: { weekNumber: number, onClear: () => void }) {
  const { t } = useLocale();
  const [data, setData] = useState<WeekLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeek() {
      try {
        const result = await apiFetch<WeekLogsResponse>(`/api/me/weeks/${weekNumber}`);
        setData(result);
      } catch {
        // Silent fail
      }
      setLoading(false);
    }
    fetchWeek();
  }, [weekNumber]);

  if (loading) return <div className="p-4 flex justify-center"><div className="w-6 h-6 border-2 border-gold-muted border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return <div className="p-4 text-center text-umber-soft text-sm">Failed to load week details.</div>;

  const validLogs: DailyLog[] = [];
  const dateRange: string[] = [];
  const currentD = new Date(data.weekStart);
  for (let i = 0; i < 7; i++) {
    dateRange.push(currentD.toISOString().split("T")[0]);
    currentD.setDate(currentD.getDate() + 1);
  }

  data.logs.forEach(log => {
    if (log && log.id !== "00000000-0000-0000-0000-000000000000") {
      validLogs.push(log);
    }
  });

  return (
    <div className="border-t border-parchment-dark/10 p-4 space-y-5 bg-parchment/20">
      <div className="w-full h-64 mb-6">
        <ProgressGraph logs={validLogs} dateRange={dateRange} />
      </div>
      
      {(data.isComplete || data.isCurrentWeek) && (
        <div className="bg-white/50 p-4 rounded-xl border border-parchment-dark/10 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-gold-muted" />
            <h4 className="font-bold text-sm text-umber-deep">Summary</h4>
          </div>
          <div className="flex justify-between text-xs text-umber-soft">
            <span>Strongest: {data.summary.strongestAreas.join(", ") || "—"}</span>
            <span>Needs Focus: {data.summary.weakestAreas.join(", ") || "—"}</span>
          </div>
        </div>
      )}

      {data.hasReview && (
        <div className="bg-sage/10 p-3 rounded-lg border border-sage/20 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-sage" />
          <span className="text-sm font-medium text-sage">{t("history.priest_reviewed") || "Priest Reviewed ✓"}</span>
        </div>
      )}

      {!data.isCurrentWeek && (
        <div className="flex justify-end pt-2">
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-warm-red hover:bg-warm-red/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Data
          </button>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [weeks, setWeeks] = useState<WeekHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadWeeks() {
      try {
        const data = await apiFetch<WeekHistoryItem[]>("/api/me/weeks");
        // Show newest first
        setWeeks(data.sort((a, b) => b.weekNumber - a.weekNumber));
      } catch {
        // Silent fail
      }
      setLoading(false);
    }
    loadWeeks();
  }, []);

  const handleClearWeek = async (weekNumber: number) => {
    if (!confirm(`Are you sure you want to clear all logs and reviews for Week ${weekNumber}?`)) return;
    
    setIsDeleting(true);
    try {
      await apiFetch(`/api/me/weeks/${weekNumber}`, { method: "DELETE" });
      setWeeks(weeks.filter(w => w.weekNumber !== weekNumber));
      setExpandedWeek(null);
    } catch {
      alert("Failed to clear week.");
    }
    setIsDeleting(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-parchment rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center gap-2 mb-6">
        <History className="w-6 h-6 text-gold-muted" />
        <h1 className="text-2xl font-bold font-ethiopic text-umber-deep">
          My Journey
        </h1>
      </div>

      {weeks.length === 0 ? (
        <div className="sacred-card text-center py-10 text-umber-soft">
          <CalendarDays className="w-10 h-10 mx-auto text-parchment-dark/50 mb-3" />
          <p>No history available yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {weeks.map(week => {
            const isExpanded = expandedWeek === week.weekNumber;
            const formatD = (dStr: string) => new Date(dStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });

            return (
              <motion.div 
                key={week.weekNumber}
                className="sacred-card p-0 overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <button
                  onClick={() => setExpandedWeek(isExpanded ? null : week.weekNumber)}
                  disabled={isDeleting}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-parchment-dark/5 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-umber-deep font-ethiopic">
                        {week.isCurrentWeek ? "Current Week" : `Week ${week.weekNumber}`}
                      </span>
                      {week.reviewCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-sage" title="Reviewed" />
                      )}
                    </div>
                    <p className="text-xs text-umber-soft">
                      {formatD(week.weekStart)} – {formatD(week.weekEnd)}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="block text-sm font-bold text-gold-muted">{week.completionRate}%</span>
                      <span className="text-[10px] uppercase tracking-wider text-umber-soft">{week.daysWithActivity}/7 Days</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-umber-soft" /> : <ChevronDown className="w-5 h-5 text-umber-soft" />}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden"
                    >
                      <WeekDetail weekNumber={week.weekNumber} onClear={() => handleClearWeek(week.weekNumber)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
