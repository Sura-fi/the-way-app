"use client";

import { useState, useEffect, FormEvent } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useLocale } from "@/components/providers/LocaleProvider";
import { Feather, Users } from "lucide-react";

// ── Types ───────────────────────────────────────
interface UserSummary {
  id: string;
  formalName: string;
  spiritualName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  currentDayInWeek: number;
  currentWeekNumber: number;
}

interface QuoteResponse {
  id: string;
  content: string;
  publishedAt: string;
  publisherName: string;
}

export default function DashboardPage() {
  const { t } = useLocale();

  // ── User List State ───────────────────────────
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ── Quote Publish State ───────────────────────
  const [quoteText, setQuoteText] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState("");

  // ── Fetch users ───────────────────────────────
  useEffect(() => {
    async function fetchUsers() {
      setIsLoadingUsers(true);
      try {
        const statusParam = statusFilter !== "all"
          ? `&isActive=${statusFilter === "active"}`
          : "";
        const data = await apiFetch<UserSummary[]>(
          `/api/users?search=${encodeURIComponent(search)}&page=${page}&pageSize=${pageSize}${statusParam}`
        );
        setUsers(data);
      } catch {
        // Handle error silently
      }
      setIsLoadingUsers(false);
    }

    // Debounce: wait 300ms after user stops typing or filter changes
    const timer = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, page]);

  // Reset to page 1 if search or filter changes
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  // ── Publish Quote ─────────────────────────────
  const handlePublish = async (e: FormEvent) => {
    e.preventDefault();
    setPublishError("");
    setPublishSuccess(false);

    if (!quoteText.trim()) {
      setPublishError(t("priest.quote_empty_error"));
      return;
    }

    if (quoteText.length > 500) {
      setPublishError(t("priest.quote_length_error"));
      return;
    }

    setIsPublishing(true);
    try {
      await apiFetch<QuoteResponse>("/api/quotes", {
        method: "POST",
        body: JSON.stringify({ content: quoteText }),
      });
      setPublishSuccess(true);
      setQuoteText("");
      // Auto-hide success message after 3 seconds
      setTimeout(() => setPublishSuccess(false), 3000);
    } catch (err) {
      setPublishError(
        err instanceof Error ? err.message : "Failed to publish"
      );
    }
    setIsPublishing(false);
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-umber-deep">{t("priest.dashboard")}</h1>
        <p className="text-umber-soft text-sm mt-1">
          {t("priest.manage_subtitle")}
        </p>
      </div>

      {/* ── Quote Publish Section ──────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sacred-callout"
      >
        <div className="flex items-center gap-2 mb-3">
          <Feather className="w-5 h-5 text-gold-muted" />
          <h2 className="text-lg font-semibold text-umber-deep">
            {t("priest.publish_quote")}
          </h2>
        </div>
        <p className="text-sm text-umber-soft mb-3">
          {t("priest.quote_broadcast")}
        </p>

        <form onSubmit={handlePublish} className="space-y-3">
          <textarea
            value={quoteText}
            onChange={(e) => setQuoteText(e.target.value)}
            placeholder={t("priest.quote_placeholder")}
            rows={3}
            maxLength={500}
            className="input-field resize-none font-ethiopic"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-umber-soft">
              {quoteText.length}/500
            </span>
            <button
              type="submit"
              disabled={isPublishing || !quoteText.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2">
                {isPublishing ? (
                  <span>{t("priest.publishing")}</span>
                ) : (
                  <>
                    <Feather className="w-4 h-4" />
                    <span>{t("priest.publish_btn")}</span>
                  </>
                )}
              </div>
            </button>
          </div>
        </form>

        {/* Success message */}
        {publishSuccess && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sage text-sm mt-2 font-medium"
          >
            {t("priest.quote_success")}
          </motion.p>
        )}

        {/* Error message */}
        {publishError && (
          <p className="text-warm-red text-sm mt-2">{publishError}</p>
        )}
      </motion.div>

      {/* ── God Children List ─────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-umber-deep mb-3 flex items-center gap-2">
          <Users className="w-5 h-5" />
          {t("priest.god_children")}
        </h2>

        {/* Search + Filter */}
        <div className="flex items-center gap-3 mb-4">
          <input
            type="text"
            placeholder={t("priest.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field flex-1"
          />
          <div className="flex items-center gap-1 bg-parchment-dark/10 rounded-lg p-0.5 shrink-0">
            {(["all", "active", "inactive"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setStatusFilter(opt)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  statusFilter === opt
                    ? "bg-white text-umber-deep shadow-sm"
                    : "text-umber-soft hover:text-umber-deep"
                }`}
              >
                {opt === "all" ? "All" : opt === "active" ? t("priest.active") : t("priest.inactive")}
              </button>
            ))}
          </div>
        </div>

        {/* User Table */}
        {isLoadingUsers ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-14 bg-parchment rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="sacred-card text-center text-umber-soft py-8">
            {search
              ? `${t("priest.no_users_search")} "${search}"`
              : t("priest.no_users")}
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href={`/users/${user.id}`}
                  className={`sacred-card flex items-center justify-between group transition-all ${
                    !user.isActive ? "opacity-50 border-parchment-dark/20" : ""
                  }`}
                >
                  <div>
                    <p className="font-medium text-umber-deep group-hover:text-gold-muted transition-colors flex items-center gap-2">
                      {user.formalName}
                      {user.currentDayInWeek >= 5 && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-bold ${user.currentDayInWeek === 7 ? 'bg-warm-red/20 text-warm-red animate-pulse' : 'bg-gold-muted/20 text-gold-muted'}`}>
                          Day {user.currentDayInWeek}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-umber-soft font-ethiopic">
                      {user.spiritualName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border ${
                        user.isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                      {user.isActive ? t("priest.active") : t("priest.inactive")}
                    </span>
                    <p className="text-xs text-umber-soft mt-1">
                      W{user.currentWeekNumber} • {t("priest.joined")}{" "}
                      {new Date(user.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
            
            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-6 px-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-sm font-medium text-umber-soft hover:text-umber-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              <span className="text-xs font-bold text-umber-soft">
                Page {page}
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={users.length < pageSize}
                className="text-sm font-medium text-umber-soft hover:text-umber-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
