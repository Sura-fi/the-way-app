"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import {
  OTHER_KEY,
  OTHER_PREFIX,
  MAX_OTHER_LENGTH,
  isOtherEntry,
  getOtherText,
  stripEmptyOther,
} from "@/lib/activities";

interface SubOption {
  key: string;
  label: string;
}

interface ActivityCardProps {
  label: string;
  icon: React.ReactNode;
  selections: string[];
  options: SubOption[];
  onChange: (next: string[]) => void;
  onChangeText?: (next: string[]) => void;
  onConfirm: () => void;
  onSkip: () => void;
  isActive: boolean;
  isCompleted: boolean;
  stepNumber: number;
  totalSteps: number;
  confirmLabel?: string;
  skipLabel?: string;
  otherPlaceholder?: string;
  notDoneLabel?: string;
}

export default function ActivityCard({
  label,
  icon,
  selections,
  options,
  onChange,
  onChangeText,
  onConfirm,
  onSkip,
  isActive,
  isCompleted,
  stepNumber,
  totalSteps,
  confirmLabel = "Confirm",
  skipLabel = "Skip",
  otherPlaceholder = "What did you do?",
  notDoneLabel = "Not done yet",
}: ActivityCardProps) {
  // ── Upcoming (hidden) ─────────────────────────
  if (!isActive && !isCompleted) return null;

  // ── Completed/skipped (compact) ───────────────
  if (isCompleted) {
    const done = selections.length > 0;
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        className="relative"
      >
        <div
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
              <Check className="w-4 h-4 text-white" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-parchment-dark/40" />
            )}
          </div>
          <span
            className={`font-medium font-ethiopic text-sm ${
              done ? "text-sage" : "text-umber-soft"
            }`}
          >
            {label}
          </span>
          <span
            className={`text-xs ml-auto ${
              done ? "text-sage/70" : "text-umber-soft/70 italic"
            }`}
          >
            {done ? `${selections.length} selected` : notDoneLabel}
          </span>
        </div>
      </motion.div>
    );
  }

  // ── Active (full card) ────────────────────────
  const otherSelected = selections.some(isOtherEntry);
  const otherText = getOtherText(selections);

  const toggle = (optKey: string) => {
    if (optKey === OTHER_KEY) {
      // Toggle Other: remove all Other entries if already selected, else add empty prefix
      onChange(
        otherSelected
          ? selections.filter((s) => !isOtherEntry(s))
          : [...selections, OTHER_PREFIX]
      );
      return;
    }
    onChange(
      selections.includes(optKey)
        ? selections.filter((s) => s !== optKey)
        : [...selections, optKey]
    );
  };

  // Typing saves through the debounced path so we don't write every keystroke.
  const commitText = onChangeText ?? onChange;

  const handleOtherText = (text: string) => {
    const cleaned = text.slice(0, MAX_OTHER_LENGTH);
    const without = selections.filter((s) => !isOtherEntry(s));
    commitText([...without, OTHER_PREFIX + cleaned]);
  };

  const handleConfirm = () => {
    // Strip "Other:" with empty text, then flush immediately so any pending
    // debounced text save is superseded by this final write.
    onChange(stripEmptyOther(selections));
    onConfirm();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className="sacred-card space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gold-muted/10 flex items-center justify-center text-gold-muted">
            {icon}
          </div>
          <div>
            <h3 className="text-xl font-bold font-ethiopic text-umber-deep">
              {label}
            </h3>
            <p className="text-xs text-umber-soft">
              Step {stepNumber} of {totalSteps}
            </p>
          </div>
        </div>

        {/* Choice chips */}
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const checked =
              option.key === OTHER_KEY
                ? otherSelected
                : selections.includes(option.key);
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => toggle(option.key)}
                className={`flex items-center gap-1.5 rounded-full border transition-all text-xs px-3 py-1.5 min-h-[32px] ${
                  checked
                    ? "bg-sage border-sage text-white font-medium shadow-sm"
                    : "bg-cream-white border-parchment-dark/20 text-umber-soft hover:border-gold-muted/40 hover:bg-gold-muted/5"
                }`}
              >
                {checked && (
                  <span className="w-3.5 h-3.5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-white" />
                  </span>
                )}
                <span className={checked ? "text-white" : ""}>{option.label}</span>
              </button>
            );
          })}
        </div>

        {/* Free-text field — only shown when "Other" chip is selected */}
        {otherSelected && (
          <div>
            <input
              type="text"
              value={otherText}
              onChange={(e) => handleOtherText(e.target.value)}
              onBlur={() => onChange(selections)}
              placeholder={otherPlaceholder}
              maxLength={MAX_OTHER_LENGTH}
              autoFocus
              className="input-field text-sm py-2 w-full"
            />
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-umber-soft">
                {otherText.length}/{MAX_OTHER_LENGTH}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={handleConfirm}
            className="flex-1 bg-gold-muted hover:bg-gold-bright text-umber-deep font-bold py-3 px-6 rounded-xl transition-colors text-sm"
          >
            {confirmLabel}
          </button>
          <button
            onClick={onSkip}
            className="px-6 py-3 rounded-xl border border-parchment-dark/30 text-umber-soft hover:text-umber-deep hover:bg-parchment-dark/10 transition-colors text-sm font-medium"
          >
            {skipLabel}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
