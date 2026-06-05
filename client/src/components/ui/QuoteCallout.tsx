"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useQuote } from "@/components/providers/QuoteProvider";

import { useLocale } from "@/components/providers/LocaleProvider";

export default function QuoteCallout() {
  const { quote, isLoading } = useQuote();
  const { t } = useLocale();

  if (isLoading) {
    return (
      <div className="sacred-callout animate-pulse">
        <div className="h-4 bg-parchment rounded w-3/4 mb-2" />
        <div className="h-3 bg-parchment rounded w-1/2" />
      </div>
    );
  }

  if (!quote) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={quote.id}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sacred-callout"
      >
        {/* Cross icon + label */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-gold-muted text-lg">✝</span>
          <span className="text-xs font-medium text-gold-muted uppercase tracking-wide">
            {t("today.quote_title")}
          </span>
        </div>

        {/* Quote text */}
        <p className="font-ethiopic italic text-umber-deep leading-relaxed">
          &ldquo;{quote.content}&rdquo;
        </p>

        {/* Publisher + time */}
        <p className="text-xs text-umber-soft mt-3">
          — {t("priest.title")} {quote.publisherName} •{" "}
          {new Date(quote.publishedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
