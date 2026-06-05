"use client";

import { useState, useEffect, FormEvent } from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/components/providers/LocaleProvider";
import { apiFetch } from "@/lib/api";
import { Trash2, MessageSquare, Calendar, Clock } from "lucide-react";

interface ReviewResponse {
  id: string;
  content: string;
  createdAt: string;
  expiresAt: string;
  priestName: string;
}

export default function ReviewSection({ userId }: { userId: string }) {
  const { t } = useLocale();
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [newReview, setNewReview] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchReviews() {
      try {
        const data = await apiFetch<ReviewResponse[]>(`/api/users/${userId}/reviews`);
        setReviews(data);
      } catch {
        // silently fail or show error
      }
      setIsLoading(false);
    }
    fetchReviews();
  }, [userId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newReview.trim()) return;
    setIsSubmitting(true);
    setError("");

    try {
      const created = await apiFetch<ReviewResponse>(`/api/users/${userId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ content: newReview.trim() })
      });
      setReviews([created, ...reviews]);
      setNewReview("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit review");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    try {
      await apiFetch(`/api/users/${userId}/reviews/${reviewId}`, { method: "DELETE" });
      setReviews(reviews.filter(r => r.id !== reviewId));
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const getDaysRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  };

  // Color based on expiry urgency
  const getExpiryStyle = (daysLeft: number) => {
    if (daysLeft > 60) {
      return {
        badge: "bg-sage/10 text-sage",
        border: "border-l-sage",
      };
    } else if (daysLeft > 30) {
      return {
        badge: "bg-gold-muted/10 text-gold-muted",
        border: "border-l-gold-muted",
      };
    } else {
      return {
        badge: "bg-warm-red/10 text-warm-red",
        border: "border-l-warm-red",
      };
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  };

  if (isLoading) {
    return <div className="h-32 bg-parchment rounded-xl animate-pulse mt-6" />;
  }

  return (
    <div className="space-y-6 mt-8">
      {/* Section Header with count */}
      <h2 className="text-lg font-semibold text-umber-deep flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        {t("priest.reviews") || "Reviews"}
        {reviews.length > 0 && (
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gold-muted/15 text-gold-muted">
            {reviews.length}
          </span>
        )}
      </h2>

      {/* Review Form */}
      <form onSubmit={handleSubmit} className="sacred-callout space-y-3">
        <textarea
          value={newReview}
          onChange={(e) => setNewReview(e.target.value)}
          placeholder={t("priest.review_placeholder") || "Write a spiritual review for this child..."}
          rows={3}
          maxLength={1000}
          className="input-field resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-umber-soft">{newReview.length}/1000</span>
          <button
            type="submit"
            disabled={isSubmitting || !newReview.trim()}
            className="btn-primary disabled:opacity-50"
          >
            {isSubmitting ? t("priest.publishing") || "Submitting..." : t("priest.submit_review") || "Submit Review"}
          </button>
        </div>
        {error && <p className="text-warm-red text-sm">{error}</p>}
      </form>

      {/* Divider between form and list */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-parchment-dark/30" />
          <span className="text-xs text-umber-soft/60 uppercase tracking-wider">
            {t("priest.reviews")}
          </span>
          <div className="flex-1 h-px bg-parchment-dark/30" />
        </div>
      )}

      {/* Review List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center text-umber-soft py-4 text-sm">
            {t("priest.no_reviews") || "No reviews yet."}
          </div>
        ) : (
          reviews.map(review => {
            const daysLeft = getDaysRemaining(review.expiresAt);
            const expiryStyle = getExpiryStyle(daysLeft);

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={review.id}
                className={`sacred-card space-y-3 relative group border-l-4 ${expiryStyle.border}`}
              >
                {/* Header: priest name + actions */}
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-umber-deep">
                    {review.priestName}
                  </p>
                  <div className="flex items-center gap-2">
                    {/* Expiry badge */}
                    <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 ${expiryStyle.badge}`}>
                      <Clock className="w-3 h-3" />
                      {daysLeft} {t("priest.days_remaining") || "days remaining"}
                    </span>
                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(review.id)}
                      className="text-warm-red opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-warm-red/10 rounded"
                      title="Delete Review"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Review content */}
                <p className="text-sm text-umber-deep whitespace-pre-wrap">
                  {review.content}
                </p>

                {/* Footer: created date */}
                <div className="flex items-center gap-1.5 text-xs text-umber-soft">
                  <Calendar className="w-3 h-3" />
                  <span>
                    {t("priest.review_created") || "Created"}: {formatDate(review.createdAt)}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
