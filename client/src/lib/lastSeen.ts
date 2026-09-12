// "Last seen" formatting in the viewer's local time zone.
// lastSeenAt comes from the server as UTC ("…Z"), so Date converts it automatically.

type Translate = (key: string) => string;

const intlLocale = (locale: string) => (locale === "am" ? "am-ET" : "en-US");

export function formatLastSeen(
  lastSeenAt: string | null | undefined,
  t: Translate,
  locale: string,
  now: Date = new Date()
): string {
  if (!lastSeenAt) return t("presence.never");

  const seen = new Date(lastSeenAt);
  const minutes = Math.floor((now.getTime() - seen.getTime()) / 60000);

  if (minutes < 1) return t("presence.just_now");
  if (minutes < 60) return t("presence.minutes_ago").replace("{n}", String(minutes));

  const intl = intlLocale(locale);
  const time = seen.toLocaleTimeString(intl, { hour: "numeric", minute: "2-digit" });

  // Whole calendar days between the two local dates
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(seen)) / 86400000);

  if (days <= 0) return t("presence.today_at").replace("{time}", time);
  if (days === 1) return t("presence.yesterday_at").replace("{time}", time);

  const day =
    days < 7
      ? seen.toLocaleDateString(intl, { weekday: "short" })
      : seen.toLocaleDateString(intl, { month: "short", day: "numeric" });

  return t("presence.on_at").replace("{day}", day).replace("{time}", time);
}

// Full date + time, used as a hover tooltip
export function formatFullDateTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(intlLocale(locale), {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
