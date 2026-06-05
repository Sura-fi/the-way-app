"use client";

import { ReactNode, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useOnline } from "@/components/providers/OnlineStatusProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { usePathname } from "next/navigation";
import Link from "next/link";
import ProtectedRoute from "@/components/providers/ProtectedRoute";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, History, User } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function GodChildLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isOnline } = useOnline();
  const { t, locale, switchLocale } = useLocale();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const initial = user?.spiritualName?.charAt(0)?.toUpperCase() || "?";

  return (
    <ProtectedRoute allowedRoles={["GodChild"]}>
      <div className="min-h-screen bg-parchment-light">
        {/* Top Navbar */}
        <nav className="bg-cream-white border-b border-parchment-dark px-4 py-3 flex items-center justify-between">
          {/* Left: Logo + App Name + Online Status */}
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div className="flex flex-col justify-center">
              <span className="font-ethiopic font-bold text-lg text-gold-muted leading-tight">
                {t("nav.app_title")}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-umber-soft mt-0.5">
                <span
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    isOnline ? "bg-sage shadow-[0_0_4px_rgba(90,122,94,0.6)]" : "bg-gold-muted animate-pulse"
                  }`}
                />
                <span className="uppercase tracking-wider font-medium">{isOnline ? t("nav.online") : t("nav.offline")}</span>
              </div>
            </div>
          </div>

          {/* Right: lang toggle + avatar */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => switchLocale(locale === "am" ? "en" : "am")}
              className="text-lg opacity-70 hover:opacity-100 transition-opacity"
              title={locale === "am" ? "Switch to English" : "ወደ አማርኛ ቀይር"}
            >
              {locale === "am" ? "🇬🇧" : "🇪🇹"}
            </button>

            <button
              onClick={() => setDrawerOpen(true)}
              className="w-8 h-8 rounded-full bg-gold-muted/15 text-gold-muted font-bold text-sm flex items-center justify-center hover:bg-gold-muted/25 transition-colors"
              title={user?.spiritualName || "User"}
            >
              {initial}
            </button>
          </div>
        </nav>

        {/* User Drawer */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-charcoal/30"
                onClick={() => setDrawerOpen(false)}
              />

              {/* Drawer panel */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 250 }}
                className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-cream-white border-l border-parchment-dark shadow-xl flex flex-col"
              >
                {/* Close button */}
                <div className="flex justify-end p-4">
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="text-umber-soft/50 hover:text-umber-soft transition-colors text-lg"
                  >
                    ✕
                  </button>
                </div>

                {/* User info */}
                <div className="flex flex-col items-center px-6 pb-6 border-b border-parchment-dark/30">
                  <div className="w-16 h-16 rounded-full bg-gold-muted/15 text-gold-muted text-2xl font-bold flex items-center justify-center mb-3">
                    ✝
                  </div>
                  <h2 className="text-xl font-bold font-ethiopic text-gold-muted text-center leading-snug">
                    {user?.spiritualName}
                  </h2>
                  <p className="text-sm text-umber-soft mt-1">
                    {user?.formalName}
                  </p>
                </div>

                {/* Details */}
                <div className="flex-1 px-6 py-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-sage/60" />
                    <span className="text-sm text-umber-deep font-medium">
                      {t("priest.god_children") || "God Child"}
                    </span>
                  </div>
                  {user?.phoneNumber && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-umber-soft">📞</span>
                      <span className="text-sm text-umber-deep font-medium">
                        {user.phoneNumber}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOnline ? "bg-sage" : "bg-gold-muted animate-pulse"
                      }`}
                    />
                    <span className="text-sm text-umber-deep font-medium">
                      {isOnline ? t("nav.online") : t("nav.offline")}
                    </span>
                  </div>
                </div>

                {/* Sign out */}
                <div className="p-6 border-t border-parchment-dark/30">
                  <button
                    onClick={logout}
                    className="w-full py-3 rounded-xl border border-warm-red/30 text-warm-red font-medium text-sm hover:bg-warm-red/5 transition-colors"
                  >
                    {t("nav.sign_out")}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Page Content */}
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-lg mx-auto px-4 py-6 pb-24"
        >
          {children}
        </motion.main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-cream-white border-t border-parchment-dark pb-safe z-30">
          <div className="max-w-lg mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/today" className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${pathname === '/today' ? 'text-sage' : 'text-umber-soft hover:text-umber-deep'}`}>
              <CalendarDays className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold">{t("nav.tab_today")}</span>
            </Link>
            <Link href="/history" className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${pathname === '/history' ? 'text-sage' : 'text-umber-soft hover:text-umber-deep'}`}>
              <History className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold">{t("nav.tab_history")}</span>
            </Link>
            <Link href="/profile" className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${pathname === '/profile' ? 'text-sage' : 'text-umber-soft hover:text-umber-deep'}`}>
              <User className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-bold">{t("nav.tab_profile")}</span>
            </Link>
          </div>
        </nav>
      </div>
    </ProtectedRoute>
  );
}
