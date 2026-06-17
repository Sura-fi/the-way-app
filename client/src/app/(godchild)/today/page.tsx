"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import QuoteCallout from "@/components/ui/QuoteCallout";
import ActivityCard from "@/components/ui/ActivityCard";
import ActivityCalendar from "@/components/ui/ActivityCalendar";
import { useChecklist, ToggleKey } from "@/hooks/useChecklist";
import { useOnline } from "@/components/providers/OnlineStatusProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import en from "@/locales/en.json";
import am from "@/locales/am.json";
import {
  Flame,
  BookOpen,
  BookMarked,
  HandHeart,
  ShieldCheck,
} from "lucide-react";

interface SubOption {
  key: string;
  label: string;
}

interface ActivityDef {
  key: ToggleKey;
  labelKey: string;
  icon: React.ReactNode;
  choiceKey: string;
}

const ACTIVITIES: ActivityDef[] = [
  { key: "prayer", labelKey: "today.prayer", icon: <Flame className="w-7 h-7" />, choiceKey: "prayer_choices" },
  { key: "bibleReading", labelKey: "today.bible_reading", icon: <BookOpen className="w-7 h-7" />, choiceKey: "bible_choices" },
  { key: "spiritualBooks", labelKey: "today.spiritual_books", icon: <BookMarked className="w-7 h-7" />, choiceKey: "spiritual_choices" },
  { key: "goodDeeds", labelKey: "today.good_deeds", icon: <HandHeart className="w-7 h-7" />, choiceKey: "deeds_choices" },
  { key: "avoidingEvil", labelKey: "today.avoiding_evil", icon: <ShieldCheck className="w-7 h-7" />, choiceKey: "evil_choices" },
];

const LOCALE_DATA: Record<string, typeof en> = { en, am };

function getSubOptions(locale: string, choiceKey: string): SubOption[] {
  const data = LOCALE_DATA[locale] || en;
  const choices = (data.today as Record<string, unknown>)[choiceKey];
  if (!choices || typeof choices !== "object") return [];
  return Object.entries(choices as Record<string, string>).map(([key, label]) => ({
    key,
    label,
  }));
}

function CheckMark() {
  return (
    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function TodayPage() {
  const { t, locale } = useLocale();
  const { checklist, setSelections, setSelectionsDebounced, isLoading, isSaving } = useChecklist();
  const { isOnline } = useOnline();

  const initialStep = useMemo(() => {
    const idx = ACTIVITIES.findIndex((a) => checklist[a.key].length === 0);
    return idx >= 0 ? idx : 0;
  }, [checklist]);

  const [currentStep, setCurrentStep] = useState(initialStep);
  const [allDone, setAllDone] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const completedCount = ACTIVITIES.filter((a) => checklist[a.key].length > 0).length;

  const handleConfirm = () => {
    setRefreshKey((k) => k + 1);
    if (currentStep < ACTIVITIES.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setAllDone(true);
    }
  };

  const handleSkip = (key: ToggleKey) => {
    setSelections(key, []);
    setRefreshKey((k) => k + 1);
    handleConfirm();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-parchment rounded-xl animate-pulse" />
        <div className="h-64 bg-parchment rounded-xl animate-pulse" />
        <div className="h-16 bg-parchment rounded-xl animate-pulse" />
        <div className="h-16 bg-parchment rounded-xl animate-pulse" />
      </div>
    );
  }

  if (allDone) {
    return (
      <div className="space-y-6">
        <QuoteCallout />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="sacred-card text-center py-12 space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-sage/10 flex items-center justify-center mx-auto">
            <Flame className="w-8 h-8 text-sage" />
          </div>
          <h2 className="text-2xl font-bold font-ethiopic text-umber-deep">
            {t("today.all_completed")}
          </h2>
          <p className="text-umber-soft text-sm">
            ✝ {new Date().toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric",
            })}
          </p>
        </motion.div>
        <div className="space-y-2">
          {ACTIVITIES.map((activity) => {
            const selections = checklist[activity.key];
            const done = selections.length > 0;
            return (
              <div
                key={activity.key}
                className={`rounded-xl border p-3 flex items-center gap-3 ${
                  done
                    ? "bg-sage/5 border-sage/20"
                    : "bg-parchment-dark/5 border-parchment-dark/20"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    done
                      ? "bg-sage shadow-[0_0_6px_rgba(90,122,94,0.35)]"
                      : "bg-parchment-dark/20"
                  }`}
                >
                  {done ? (
                    <CheckMark />
                  ) : (
                    <span className="w-2.5 h-2.5 rounded-full bg-parchment-dark/40" />
                  )}
                </div>
                <span
                  className={`font-medium font-ethiopic text-sm ${
                    done ? "text-sage" : "text-umber-soft"
                  }`}
                >
                  {t(activity.labelKey)}
                </span>
                <span
                  className={`text-xs ml-auto ${
                    done ? "text-sage/70" : "text-umber-soft/70 italic"
                  }`}
                >
                  {done ? `${selections.length} selected` : t("today.not_done")}
                </span>
              </div>
            );
          })}
        </div>

        <ActivityCalendar refreshKey={refreshKey} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <QuoteCallout />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-ethiopic text-umber-deep">
            {t("today.title")}
          </h1>
          <p className="text-xs text-umber-soft">
            {completedCount} / {ACTIVITIES.length} {t("today.progress")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-umber-soft">
          <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-sage" : "bg-gold-muted"}`} />
          {isOnline ? t("nav.online") : t("nav.offline")}
          {isSaving && (
            <span className="text-gold-muted animate-pulse">{t("today.saving")}</span>
          )}
        </div>
      </div>

      <div className="h-1.5 bg-parchment-dark/20 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-sage rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(completedCount / ACTIVITIES.length) * 100}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>

      <div className="space-y-3">
        {ACTIVITIES.map((activity, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const selections = checklist[activity.key];
          const options = getSubOptions(locale, activity.choiceKey);

          return (
            <ActivityCard
              key={activity.key}
              label={t(activity.labelKey)}
              icon={activity.icon}
              selections={selections}
              options={options}
              onChange={(next) => setSelections(activity.key, next)}
              onChangeText={(next) => setSelectionsDebounced(activity.key, next)}
              onConfirm={handleConfirm}
              onSkip={() => handleSkip(activity.key)}
              isActive={isActive}
              isCompleted={isCompleted}
              stepNumber={index + 1}
              totalSteps={ACTIVITIES.length}
              confirmLabel={t("today.confirm")}
              skipLabel={t("today.skip")}
              otherPlaceholder={t("today.other_placeholder")}
              notDoneLabel={t("today.not_done")}
            />
          );
        })}
      </div>

      <ActivityCalendar refreshKey={refreshKey} />
    </div>
  );
}
