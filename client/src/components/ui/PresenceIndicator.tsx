"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { formatLastSeen, formatFullDateTime } from "@/lib/lastSeen";

// Payload of the "PresenceChanged" hub event
export interface PresenceChange {
  userId: string;
  isOnline: boolean;
  lastSeenAt: string;
}

export function PresenceIndicator({
  isOnline,
  lastSeenAt,
  className = "",
}: {
  isOnline: boolean;
  lastSeenAt?: string | null;
  className?: string;
}) {
  const { t, locale } = useLocale();
  const [now, setNow] = useState(() => new Date());

  // Re-render every minute so "12 min ago" doesn't go stale
  useEffect(() => {
    if (isOnline) return;
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, [isOnline]);

  if (isOnline) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 ${className}`}>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        {t("presence.online_now")}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs text-umber-soft ${className}`}
      title={lastSeenAt ? formatFullDateTime(lastSeenAt, locale) : undefined}
    >
      <span className="w-2 h-2 rounded-full bg-parchment-dark/60" />
      {formatLastSeen(lastSeenAt, t, locale, now)}
    </span>
  );
}
