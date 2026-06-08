"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { ArrowLeft, UserCircle, BookOpen } from "lucide-react";
import NoteSection from "@/components/ui/NoteSection";
import en from "@/locales/en.json";
import am from "@/locales/am.json";

export default function PriestProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, locale } = useLocale();

  const LOCALE_DATA = { en, am } as const;
  const l = LOCALE_DATA[locale as keyof typeof LOCALE_DATA] || en;
  const scripture = l.notes.priest_scripture;

  const initial = user?.spiritualName?.charAt(0)?.toUpperCase() || "?";

  const scriptureCard = (
    <div className="sacred-card bg-gradient-to-br from-gold-muted/5 to-parchment">
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
            {scripture.verses.map((verse: string, i: number) => (
              <li key={i} className="text-sm text-umber-deep flex items-start gap-2">
                <span className="text-gold-muted mt-0.5">✝</span>
                {verse}
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
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="inline-flex items-center gap-1.5 text-sm text-umber-soft hover:text-umber-deep transition-colors"
        aria-label="Go back to dashboard"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Profile header */}
      <div className="sacred-card text-center py-8 space-y-4">
        <div className="w-20 h-20 rounded-full bg-gold-muted/15 text-gold-muted text-3xl font-bold flex items-center justify-center mx-auto">
          {initial}
        </div>
        <div>
          <h1 className="text-2xl font-bold font-ethiopic text-umber-deep">
            {locale === "en" ? "Priest Dejene" : "ቀሲስ ደጀኔ"}
          </h1>
          <p className="text-sm text-umber-soft mt-1">{user?.formalName}</p>
        </div>
        <span className="inline-block px-4 py-1.5 rounded-full bg-sage/10 text-sage text-xs font-bold uppercase tracking-wider">
          {t("priest.god_father")}
        </span>
      </div>

      {/* Info card */}
      <div className="sacred-card space-y-4">
        <h2 className="text-sm font-semibold text-umber-deep flex items-center gap-2">
          <UserCircle className="w-4 h-4 text-gold-muted" />
          {t("priest.profile")}
        </h2>
        <div className="space-y-4 text-sm mt-4">
          <div className="flex justify-between items-center py-2 border-b border-parchment-dark/20">
            <span className="text-umber-soft">{t("priest.role")}</span>
            <span className="text-umber-deep font-medium bg-gold-muted/10 px-3 py-1 rounded-md">{t("priest.god_father")}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-parchment-dark/20">
            <span className="text-umber-soft">{t("auth.email")}</span>
            <span className="text-umber-deep font-medium">{user?.email || "—"}</span>
          </div>
        </div>
      </div>

      {/* Notes Section with John 21 card */}
      <NoteSection scriptureCard={scriptureCard} />
    </div>
  );
}
