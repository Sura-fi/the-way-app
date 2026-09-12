"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function Avatar({
  src,
  name,
  sizeClasses = "w-20 h-20",
  textClasses = "text-3xl",
  zoomable = false,
}: {
  src?: string | null;
  name?: string;
  sizeClasses?: string;
  textClasses?: string;
  zoomable?: boolean; // tap the photo to see it bigger
}) {
  const [open, setOpen] = useState(false);
  const initial = name?.charAt(0)?.toUpperCase() || "?";

  const circle = (
    <div
      className={`${sizeClasses} rounded-full overflow-hidden bg-gold-muted/15 text-gold-muted ${textClasses} font-bold flex items-center justify-center shrink-0`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name || "avatar"} className="w-full h-full object-cover" />
      ) : (
        initial
      )}
    </div>
  );

  // Nothing to enlarge without a photo
  if (!zoomable || !src) return circle;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-muted"
        aria-label={name ? `View ${name}'s photo` : "View photo"}
      >
        {circle}
      </button>
      <AvatarViewer open={open} src={src} name={name} onClose={() => setOpen(false)} />
    </>
  );
}

// Full-screen photo viewer. Rendered in a portal so parents with
// transforms/overflow (drawers, cards) can't clip it.
function AvatarViewer({
  open,
  src,
  name,
  onClose,
}: {
  open: boolean;
  src: string;
  name?: string;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] flex flex-col items-center justify-center p-6 bg-charcoal/80"
          onClick={onClose}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-cream-white/80 hover:text-cream-white hover:bg-cream-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            src={src}
            alt={name || "photo"}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[90vw] max-h-[75vh] rounded-2xl shadow-2xl object-contain"
          />
          {name && (
            <p className="mt-4 text-lg font-ethiopic text-cream-white">{name}</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
