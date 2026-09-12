// Shared types + helpers for priest comments ("reviews"),
// used by the priest's ReviewSection and the God Child's History / pop-up.

export interface ReviewResponse {
  id: string;
  content: string;
  createdAt: string;
  expiresAt: string;
  acknowledgedAt: string | null;
  weekNumber: number;
  priestName: string;
}

// Payload of the "ReviewAcknowledged" hub event
export interface ReviewAcknowledged {
  reviewId: string;
  godChildId: string;
  acknowledgedAt: string;
}

export function getDaysRemaining(expiresAt: string): number {
  const diff = new Date(expiresAt).getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
}

// Color based on expiry urgency
export function getExpiryStyle(daysLeft: number) {
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
}

export function formatReviewDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

// ── Pop-up bookkeeping (per device) ─────────────
// Ids of comments the God Child was already notified about,
// so the pop-up doesn't reappear after it was opened or dismissed.
const NOTIFIED_KEY = "theway_notified_reviews";

export function getNotifiedReviewIds(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(NOTIFIED_KEY) || "[]") as string[]);
  } catch {
    return new Set();
  }
}

export function markReviewsNotified(ids: string[]): void {
  try {
    const all = getNotifiedReviewIds();
    ids.forEach((id) => all.add(id));
    // Keep the list small — reviews expire after 3 months anyway
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(Array.from(all).slice(-200)));
  } catch {
    // Storage unavailable — worst case the pop-up shows again
  }
}
