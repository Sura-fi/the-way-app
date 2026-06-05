"use client";

import { motion } from "framer-motion";

interface ToggleProps {
  label: string;
  sublabel?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function Toggle({
  label,
  sublabel,
  checked,
  onChange,
  disabled = false,
}: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`
        w-full flex items-center justify-between
        p-4 rounded-xl border transition-all duration-200
        ${
          checked
            ? "bg-sage/10 border-sage shadow-sm"
            : "bg-cream-white border-parchment-dark hover:border-gold-muted"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {/* Left side: labels */}
      <div className="text-left">
        <span
          className={`block font-medium font-ethiopic text-base ${
            checked ? "text-sage" : "text-umber-deep"
          }`}
        >
          {label}
        </span>
        {sublabel && (
          <span className="block text-sm text-umber-soft mt-0.5">
            {sublabel}
          </span>
        )}
      </div>

      {/* Right side: toggle pill */}
      <div
        className={`
          relative w-12 h-7 rounded-full transition-colors duration-200
          ${checked ? "bg-sage" : "bg-parchment-dark"}
        `}
      >
        <motion.div
          className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-cream-white shadow"
          animate={{ x: checked ? 20 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
        {/* Gold glow when toggling ON */}
        {checked && (
          <motion.div
            className="absolute inset-0 rounded-full bg-gold-bright/20"
            initial={{ opacity: 1, scale: 1.2 }}
            animate={{ opacity: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </div>
    </button>
  );
}
