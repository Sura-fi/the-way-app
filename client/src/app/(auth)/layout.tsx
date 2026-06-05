"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Logo } from "@/components/ui/Logo";

/**
 * Shared layout for /login and /register pages.
 * Centers the form card vertically and horizontally
 * on a parchment background with a subtle fade-in.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-parchment-light">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* App logo + title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="xl" />
          </div>
          <h1 className="text-3xl font-bold font-ethiopic text-umber-deep">
            መንገዱ
          </h1>
          <p className="text-umber-soft mt-1">The Way</p>
        </div>

        {/* Auth card */}
        <div className="sacred-card">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

