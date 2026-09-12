"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, X } from "lucide-react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useHubEvent } from "@/components/providers/QuoteProvider";
import { apiFetch } from "@/lib/api";
import { ReviewResponse, getNotifiedReviewIds, markReviewsNotified } from "@/lib/reviews";

/**
 * In-app pop-up for the God Child: "You received a comment from …".
 * Tapping it opens the week the comment belongs to on the History tab.
 */
export default function CommentNotifier() {
  const { t } = useLocale();
  const router = useRouter();
  const [pending, setPending] = useState<ReviewResponse[]>([]);

  // Comments that arrived while the app was closed
  useEffect(() => {
    apiFetch<ReviewResponse[]>("/api/me/reviews/pending")
      .then((list) => {
        const notified = getNotifiedReviewIds();
        setPending(list.filter((r) => !notified.has(r.id)));
      })
      .catch(() => {
        // Offline — they'll show next time
      });
  }, []);

  // Comments written while the app is open
  useHubEvent<ReviewResponse>("ReviewReceived", (review) => {
    setPending((p) => (p.some((r) => r.id === review.id) ? p : [review, ...p]));
  });

  const newest = pending[0];

  const dismiss = () => {
    markReviewsNotified(pending.map((r) => r.id));
    setPending([]);
  };

  const open = () => {
    if (!newest) return;
    dismiss();
    router.push(`/history?week=${newest.weekNumber}&review=${newest.id}`);
  };

  const title = !newest
    ? ""
    : pending.length === 1
    ? t("notify.comment_one").replace("{name}", newest.priestName)
    : t("notify.comment_many")
        .replace("{count}", String(pending.length))
        .replace("{name}", newest.priestName);

  return (
    <AnimatePresence>
      {newest && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", damping: 24, stiffness: 280 }}
          className="fixed top-3 inset-x-0 z-[45] px-4"
        >
          <div className="max-w-lg mx-auto flex items-start gap-3 rounded-2xl bg-cream-white border border-gold-muted/40 shadow-xl p-4">
            <button type="button" onClick={open} className="flex-1 flex items-start gap-3 text-left">
              <span className="w-9 h-9 rounded-full bg-gold-muted/15 text-gold-muted flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold font-ethiopic text-umber-deep leading-snug">
                  {title}
                </span>
                <span className="block text-xs text-umber-soft mt-0.5">
                  {t("notify.tap_to_open").replace("{week}", String(newest.weekNumber))}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="p-1 text-umber-soft/60 hover:text-umber-soft transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
