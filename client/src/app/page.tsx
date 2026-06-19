"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/Logo";
import Link from "next/link";

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const { t, locale, switchLocale } = useLocale();
  const router = useRouter();

  // ── Splash screen state ───────────────────────
  const [showSplash, setShowSplash] = useState(true);
  const [splashExiting, setSplashExiting] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (isLoading || !user) return;

    if (user.mustChangePassword) {
      router.push("/change-password");
    } else if (user.role === "Priest") {
      router.push("/dashboard");
    } else {
      router.push("/today");
    }
  }, [user, isLoading, router]);

  // Handle splash screen timing
  useEffect(() => {
    // If user is logged in, skip splash entirely (they'll be redirected)
    if (user) {
      setShowSplash(false);
      return;
    }

    // If auth is still loading, keep showing splash (it IS the loading state)
    if (isLoading) return;

    // Auth finished, user is NOT logged in — check if splash was already shown this session
    const alreadyShown = sessionStorage.getItem("the-way-splash-shown");
    if (alreadyShown) {
      setShowSplash(false);
      return;
    }

    // First visit this session — show splash for 2 seconds then exit
    const timer = setTimeout(() => {
      setSplashExiting(true);
      sessionStorage.setItem("the-way-splash-shown", "true");
      // After exit animation completes, remove splash
      setTimeout(() => setShowSplash(false), 600);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoading, user]);

  // ── Splash Screen ──────────────────────────────
  // Shown while loading OR as a premium intro for first-time visitors
  if (showSplash) {
    return (
      <AnimatePresence>
        {!splashExiting && (
          <motion.div
            key="splash"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="min-h-screen flex flex-col items-center justify-center bg-charcoal text-cream-white"
          >
            {/* Glowing logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="drop-shadow-[0_0_30px_rgba(196,168,98,0.4)]"
            >
              <Logo size="xxl" />
            </motion.div>

            {/* App name */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-6 text-2xl font-ethiopic text-gold-muted tracking-wide"
            >
              መንገዱ — The Way
            </motion.p>

            {/* Subtle loading indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.4 }}
              className="mt-8 flex gap-1.5"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-gold-muted/50"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // ── If redirecting (logged-in user), show nothing ──
  if (user) {
    return null;
  }

  // ── Landing Page ───────────────────────────────
  return (
    <div className="min-h-screen relative overflow-hidden bg-charcoal text-cream-white flex flex-col">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40 mix-blend-luminosity"
        style={{ backgroundImage: "url('/landing-bg.jpg')" }}
      />
      
      {/* Soft gradient overlay for text readability */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-charcoal/80 via-charcoal/40 to-charcoal" />

      {/* Header */}
      <header className="relative z-20 px-6 py-4 flex justify-end">
        <button
          onClick={() => switchLocale(locale === "am" ? "en" : "am")}
          className="text-2xl opacity-80 hover:opacity-100 transition-opacity bg-charcoal/50 backdrop-blur-sm px-3 py-1 rounded-full border border-umber-soft/30"
          title={locale === "am" ? "Switch to English" : "ወደ አማርኛ ቀይር"}
        >
          {locale === "am" ? "🇬🇧" : "🇪🇹"}
        </button>
      </header>

      {/* Main Content */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="max-w-2xl"
        >
          {/* Logo — displayed as floating icon on dark bg */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="mb-8 flex justify-center"
          >
            <div className="drop-shadow-[0_0_30px_rgba(196,168,98,0.3)]">
              <Logo size="xxl" />
            </div>
          </motion.div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold font-ethiopic text-gold-muted mb-8 tracking-wide drop-shadow-lg">
            {t("nav.app_title")}
          </h1>

          {/* Verse */}
          <div className="mb-12 space-y-4">
            <p className="text-xl md:text-2xl font-ethiopic italic text-parchment-light leading-relaxed drop-shadow-md">
              &ldquo;{t("landing.verse")}&rdquo;
            </p>
            <p className="text-sm text-gold-bright/80 tracking-widest uppercase">
              — {t("landing.verse_ref")} —
            </p>
          </div>

          {/* Entry Doors (Buttons) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8">
            <Link href="/login" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-4 bg-gold-muted/90 hover:bg-gold-bright text-umber-deep font-bold rounded-xl shadow-[0_0_20px_rgba(196,168,98,0.3)] transition-all backdrop-blur-md"
              >
                {t("landing.enter_godchild")}
              </motion.button>
            </Link>

            <Link href="/login?role=priest" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto px-8 py-4 bg-parchment-dark/10 hover:bg-parchment-dark/20 text-cream-white border border-parchment-dark/50 font-bold rounded-xl transition-all backdrop-blur-md"
              >
                {t("landing.enter_priest")}
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 py-6 text-center text-xs text-parchment-dark/50 font-sans tracking-wide">
        © {new Date().getFullYear()} {t("nav.app_title")}. All rights reserved.
      </footer>
    </div>
  );
}
