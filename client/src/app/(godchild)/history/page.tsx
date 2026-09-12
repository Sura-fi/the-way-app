"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/components/providers/LocaleProvider";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { History, ChevronDown, ChevronUp, Trash2, Target, CalendarDays, CheckCircle2, MessageSquare, Clock, Cross } from "lucide-react";
import ProgressGraph from "@/components/ui/ProgressGraph";
import {
  ReviewResponse,
  getDaysRemaining,
  getExpiryStyle,
  formatReviewDate,
  markReviewsNotified,
} from "@/lib/reviews";

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
  reviews: ReviewResponse[];
}

function WeekDetail({
  weekNumber,
  focusReviewId,
  onClear,
}: {
  weekNumber: number;
  focusReviewId: string | null;
  onClear: () => void;
}) {
  const { t } = useLocale();
  const [data, setData] = useState<WeekLogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [amenBusy, setAmenBusy] = useState<string | null>(null);
  const [amenError, setAmenError] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeek() {
      try {
        const result = await apiFetch<WeekLogsResponse>(`/api/me/weeks/${weekNumber}`);
        setData(result);
        setReviews(result.reviews ?? []);
      } catch {
        // Silent fail
      }
      setLoading(false);
    }
    fetchWeek();
  }, [weekNumber]);

  // Scroll to (and briefly highlight) the comment opened from the pop-up
  useEffect(() => {
    if (!focusReviewId || !data) return;
    const scrollTimer = setTimeout(() => {
      document
        .getElementById(`review-${focusReviewId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightId(focusReviewId);
    }, 350); // let the expand animation settle first
    const clearTimer = setTimeout(() => setHighlightId(null), 3000);
    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [focusReviewId, data]);

  const handleAmen = async (reviewId: string) => {
    setAmenBusy(reviewId);
    setAmenError(null);
    try {
      const updated = await apiFetch<ReviewResponse>(`/api/me/reviews/${reviewId}/acknowledge`, {
        method: "POST",
      });
      setReviews((rs) => rs.map((r) => (r.id === reviewId ? updated : r)));
      markReviewsNotified([reviewId]);
    } catch {
      setAmenError(reviewId);
    }
    setAmenBusy(null);
  };

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

  // Compute Strongest / Needs Focus locally so never-done activities
  // correctly surface as "Needs Focus" (god-child view only).
  const CATEGORY_LABELS: { key: keyof DailyLog; labelKey: string }[] = [
    { key: "prayer", labelKey: "today.prayer" },
    { key: "bibleReading", labelKey: "today.bible_reading" },
    { key: "spiritualBooks", labelKey: "today.spiritual_books" },
    { key: "goodDeeds", labelKey: "today.good_deeds" },
    { key: "avoidingEvil", labelKey: "today.avoiding_evil" },
  ];

  const counts = CATEGORY_LABELS.map((c) => ({
    label: t(c.labelKey),
    count: validLogs.filter((l) => {
      const v = l[c.key];
      return Array.isArray(v) && v.length > 0;
    }).length,
  }));
  const maxCount = Math.max(0, ...counts.map((c) => c.count));
  const strongest = counts.filter((c) => c.count === maxCount && c.count > 0).map((c) => c.label);
  const needsFocus = counts.filter((c) => c.count < maxCount).map((c) => c.label);

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
          <div className="space-y-2 text-xs">
            <div className="flex flex-col gap-0.5">
              <span className="text-umber-soft font-medium">Strongest</span>
              <span className="text-sage">{strongest.join(", ") || "—"}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-umber-soft font-medium">Needs Focus</span>
              <span className="text-warm-red/80">{needsFocus.join(", ") || "—"}</span>
            </div>
          </div>
        </div>
      )}

      {data.hasReview && (
        <div className="bg-sage/10 p-3 rounded-lg border border-sage/20 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-sage" />
          <span className="text-sm font-medium text-sage">{t("history.priest_reviewed") || "Priest Reviewed ✓"}</span>
        </div>
      )}

      {/* Priest comments written during this week */}
      {reviews.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-gold-muted" />
            <h4 className="font-bold text-sm text-umber-deep">{t("history.father_comments")}</h4>
          </div>
          {reviews.map((review) => {
            const daysLeft = getDaysRemaining(review.expiresAt);
            const expiryStyle = getExpiryStyle(daysLeft);

            return (
              <div
                key={review.id}
                id={`review-${review.id}`}
                className={`bg-white/60 rounded-xl border border-parchment-dark/10 border-l-4 ${expiryStyle.border} p-4 space-y-3 transition-shadow duration-500 ${
                  highlightId === review.id ? "ring-2 ring-gold-muted shadow-lg" : ""
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm font-medium text-umber-deep">{review.priestName}</p>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${expiryStyle.badge}`}>
                    <Clock className="w-3 h-3" />
                    {daysLeft} {t("priest.days_remaining")}
                  </span>
                </div>

                <p className="text-sm text-umber-deep whitespace-pre-wrap">{review.content}</p>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-umber-soft">{formatReviewDate(review.createdAt)}</span>
                  {review.acknowledgedAt ? (
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-sage/10 text-sage font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      {t("history.amen")} · {formatReviewDate(review.acknowledgedAt)}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAmen(review.id)}
                      disabled={amenBusy === review.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sage/15 text-sage text-sm font-medium font-ethiopic hover:bg-sage/25 disabled:opacity-50 transition-colors"
                    >
                      <Cross className="w-4 h-4" strokeWidth={2.25} />
                      {t("history.amen")}
                    </button>
                  )}
                </div>
                {amenError === review.id && (
                  <p className="text-xs text-warm-red">{t("history.amen_failed")}</p>
                )}
              </div>
            );
          })}
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

function HistorySkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-parchment rounded-xl animate-pulse" />)}
    </div>
  );
}

// useSearchParams needs a Suspense boundary for the production build (Next 14)
export default function HistoryPage() {
  return (
    <Suspense fallback={<HistorySkeleton />}>
      <HistoryContent />
    </Suspense>
  );
}

function HistoryContent() {
  const searchParams = useSearchParams();
  const focusWeek = Number(searchParams.get("week")) || null;
  const focusReviewId = searchParams.get("review");

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

  // Open the week linked from a comment pop-up (also when already on this page)
  useEffect(() => {
    if (focusWeek) setExpandedWeek(focusWeek);
  }, [focusWeek, focusReviewId]);

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
    return <HistorySkeleton />;
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
                      <WeekDetail
                        weekNumber={week.weekNumber}
                        focusReviewId={week.weekNumber === focusWeek ? focusReviewId : null}
                        onClear={() => handleClearWeek(week.weekNumber)}
                      />
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
