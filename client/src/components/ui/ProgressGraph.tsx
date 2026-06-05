"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DailyLog {
  id: string;
  logDate: string;
  prayer: string[];
  bibleReading: string[];
  spiritualBooks: string[];
  goodDeeds: string[];
  avoidingEvil: string[];
}

interface ProgressGraphProps {
  logs: DailyLog[];
  dateRange: string[];
}

// ── Custom Tooltip ──────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const total = payload.reduce(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sum: number, entry: any) => sum + (entry.value || 0),
    0
  );

  return (
    <div
      className="rounded-xl border shadow-lg px-4 py-3"
      style={{
        backgroundColor: "#FAF6F0",
        borderColor: "#D3C1A1",
        fontFamily: "inherit",
      }}
    >
      <p className="font-medium text-sm text-umber-deep mb-2">{label}</p>
      <div className="space-y-1">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-umber-soft">{entry.name}</span>
            <span className="ml-auto font-medium text-umber-deep">
              {entry.value === 1 ? "✓" : "—"}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-parchment-dark/30 text-xs font-semibold text-umber-deep">
        {total}/5
      </div>
    </div>
  );
}

export default function ProgressGraph({ logs, dateRange }: ProgressGraphProps) {
  const { t } = useLocale();
  const logsByDate = new Map(logs.map((l) => [l.logDate, l]));

  const data = dateRange.map((date) => {
    const log = logsByDate.get(date);
    return {
      date: new Date(date + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "short",
      }),
      [t("today.prayer")]: log?.prayer && log.prayer.length > 0 ? 1 : 0,
      [t("today.bible_reading")]: log?.bibleReading && log.bibleReading.length > 0 ? 1 : 0,
      [t("today.spiritual_books")]: log?.spiritualBooks && log.spiritualBooks.length > 0 ? 1 : 0,
      [t("today.good_deeds")]: log?.goodDeeds && log.goodDeeds.length > 0 ? 1 : 0,
      [t("today.avoiding_evil")]: log?.avoidingEvil && log.avoidingEvil.length > 0 ? 1 : 0,
    };
  });

  const colors = [
    "#8A9A5B", // sage — Prayer
    "#C4A862", // gold — Bible Reading
    "#8B5A2B", // umber — Spiritual Books
    "#505050", // charcoal — Good Deeds
    "#D9534F", // warm-red — Avoiding Evil
  ];

  const activityKeys = [
    t("today.prayer"),
    t("today.bible_reading"),
    t("today.spiritual_books"),
    t("today.good_deeds"),
    t("today.avoiding_evil"),
  ];

  return (
    <div className="h-72 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#D3C1A1"
            opacity={0.3}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke="#8B7355"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#8B7355"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            ticks={[0, 1, 2, 3, 4, 5]}
            tickFormatter={(val) => `${val}/5`}
            domain={[0, 5]}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(211, 193, 161, 0.15)" }} />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
            iconType="circle"
            iconSize={8}
          />
          {activityKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="activities"
              fill={colors[i]}
              radius={i === activityKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
