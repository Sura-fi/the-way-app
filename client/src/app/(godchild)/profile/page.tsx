"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { db } from "@/lib/db";
import { Flame, BookOpen, CalendarDays, Phone, Edit3, Check, X } from "lucide-react";
import type { LocalDailyLog } from "@/lib/db";
import NoteSection from "@/components/ui/NoteSection";
import en from "@/locales/en.json";
import am from "@/locales/am.json";

interface ProfileStats {
  totalDays: number;
  thisMonth: number;
  streak: number;
}

function calcStreak(logs: LocalDailyLog[]): number {
  const today = new Date();
  let streak = 0;

  for (let i = 0; ; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const log = logs.find((l) => l.logDate === dateStr);
    if (!log) break;

    const hasActivity = [
      log.prayer,
      log.bibleReading,
      log.spiritualBooks,
      log.goodDeeds,
      log.avoidingEvil,
    ].some((arr) => Array.isArray(arr) && arr.length > 0);

    if (!hasActivity) break;
    streak++;
  }

  return streak;
}

const PHONE_REGEX = /^(\+251|0)[79]\d{8}$/;

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { t, locale } = useLocale();
  const [stats, setStats] = useState<ProfileStats>({
    totalDays: 0,
    thisMonth: 0,
    streak: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  const LOCALE_DATA = { en, am } as const;
  const l = LOCALE_DATA[locale as keyof typeof LOCALE_DATA] || en;
  const scripture = l.notes.godchild_scripture;

  useEffect(() => {
    async function loadStats() {
      const allLogs = await db.dailyLogs.toArray();

      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

      const totalDays = allLogs.length;
      const thisMonth = allLogs.filter((l) => l.logDate >= monthStart).length;
      const streak = calcStreak(allLogs);

      setStats({ totalDays, thisMonth, streak });
      setLoading(false);
    }

    loadStats();
  }, []);

  const initial = user?.spiritualName?.charAt(0)?.toUpperCase() || "?";

  const handleEditPhone = () => {
    setPhoneDraft(user?.phoneNumber || "");
    setPhoneError("");
    setEditingPhone(true);
  };

  const handleCancelPhone = () => {
    setEditingPhone(false);
    setPhoneError("");
  };

  const handleSavePhone = async () => {
    const trimmed = phoneDraft.trim();
    if (trimmed && !PHONE_REGEX.test(trimmed)) {
      setPhoneError("Invalid Ethiopian phone number");
      return;
    }
    setSavingPhone(true);
    try {
      await updateProfile({ phoneNumber: trimmed });
      setEditingPhone(false);
      setPhoneError("");
    } catch {
      setPhoneError("Failed to save. Try again.");
    }
    setSavingPhone(false);
  };

  const scriptureCard = (
    <div className="sacred-card bg-gradient-to-br from-sage/5 to-parchment">
      <div className="flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-gold-muted mt-0.5 shrink-0" />
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-umber-deep">
            {scripture.title}
          </h3>
          <p className="text-sm text-umber-soft/70 italic leading-relaxed">
            {scripture.intro}
          </p>
          <ul className="space-y-1">
            {scripture.works.map((work: string, i: number) => (
              <li key={i} className="text-sm text-umber-deep flex items-start gap-2">
                <span className="text-gold-muted mt-0.5">✦</span>
                {work}
              </li>
            ))}
          </ul>
          <p className="text-xs text-umber-soft font-medium">
            — {scripture.reference}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="sacred-card text-center py-8 space-y-4">
        <div className="w-20 h-20 rounded-full bg-gold-muted/15 text-gold-muted text-3xl font-bold flex items-center justify-center mx-auto">
          {initial}
        </div>
        <div>
          <h1 className="text-2xl font-bold font-ethiopic text-umber-deep">
            {user?.spiritualName}
          </h1>
          <p className="text-sm text-umber-soft mt-1">{user?.formalName}</p>
        </div>
        <span className="inline-block px-4 py-1 rounded-full bg-sage/10 text-sage text-xs font-medium">
          {t("priest.god_children") || "God Child"}
        </span>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-parchment rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="sacred-card text-center py-4 space-y-1">
            <CalendarDays className="w-5 h-5 mx-auto text-gold-muted" />
            <p className="text-2xl font-bold text-umber-deep">{stats.totalDays}</p>
            <p className="text-xs text-umber-soft uppercase tracking-wider">
              {t("profile.total_days") || "Total Days"}
            </p>
          </div>
          <div className="sacred-card text-center py-4 space-y-1">
            <BookOpen className="w-5 h-5 mx-auto text-gold-muted" />
            <p className="text-2xl font-bold text-umber-deep">{stats.thisMonth}</p>
            <p className="text-xs text-umber-soft uppercase tracking-wider">
              {t("profile.this_month") || "This Month"}
            </p>
          </div>
          <div className="sacred-card text-center py-4 space-y-1">
            <Flame className="w-5 h-5 mx-auto text-gold-muted" />
            <p className="text-2xl font-bold text-umber-deep">{stats.streak}</p>
            <p className="text-xs text-umber-soft uppercase tracking-wider">
              {t("profile.streak") || "Day Streak"}
            </p>
          </div>
        </div>
      )}

      {/* Phone Number */}
      <div className="sacred-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-gold-muted" />
            {editingPhone ? (
              <div className="flex-1">
                <input
                  type="tel"
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  placeholder="0912345678 or +251912345678"
                  className="input-field text-sm py-1.5"
                  autoFocus
                />
                {phoneError && (
                  <p className="text-xs text-warm-red mt-1">{phoneError}</p>
                )}
              </div>
            ) : (
              <span className="text-sm text-umber-deep">
                {user?.phoneNumber || (locale === "am" ? "ስልክ የለም" : "No phone")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {editingPhone ? (
              <>
                <button
                  onClick={handleSavePhone}
                  disabled={savingPhone}
                  className="p-1.5 rounded-lg text-sage hover:bg-sage/10 disabled:opacity-50 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancelPhone}
                  className="p-1.5 rounded-lg text-warm-red hover:bg-warm-red/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={handleEditPhone}
                className="p-1.5 rounded-lg text-umber-soft hover:bg-parchment-dark/10 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <NoteSection scriptureCard={scriptureCard} />
    </div>
  );
}
