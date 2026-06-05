"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface SubOption {
  key: string;
  label: string;
}

interface ActivityCardProps {
  label: string;
  icon: React.ReactNode;
  selections: string[];
  options: SubOption[];
  onToggleSelection: (itemKey: string) => void;
  onConfirm: () => void;
  onSkip: () => void;
  isActive: boolean;
  isCompleted: boolean;
  stepNumber: number;
  totalSteps: number;
  confirmLabel?: string;
  skipLabel?: string;
}

export default function ActivityCard({
  label,
  icon,
  selections,
  options,
  onToggleSelection,
  onConfirm,
  onSkip,
  isActive,
  isCompleted,
  stepNumber,
  totalSteps,
  confirmLabel = "Confirm",
  skipLabel = "Skip",
}: ActivityCardProps) {
  // ── Upcoming (hidden) ─────────────────────────
  if (!isActive && !isCompleted) return null;

  // ── Completed (compact) ───────────────────────
  if (isCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        className="relative"
      >
        <div className="bg-sage/5 rounded-xl border border-sage/20 p-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-sage flex items-center justify-center shrink-0 shadow-[0_0_6px_rgba(90,122,94,0.35)]">
            <Check className="w-4 h-4 text-white" />
          </div>
          <span className="font-medium font-ethiopic text-sage text-sm">
            {label}
          </span>
          {selections.length > 0 && (
            <span className="text-xs text-sage/70 ml-auto">
              {selections.length} selected
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  // ── Active (full card with chips) ─────────────
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

        {/* Sub-options as horizontal chips */}
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const checked = selections.includes(option.key);
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => onToggleSelection(option.key)}
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
                <span className={checked ? "text-white" : ""}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onConfirm}
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
