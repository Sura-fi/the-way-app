"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useOnline } from "@/components/providers/OnlineStatusProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import ProtectedRoute from "@/components/providers/ProtectedRoute";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, History, User } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { APP_VERSION } from "@/lib/version";

interface PriestInfo {
  formalName: string;
  spiritualName: string;
  phoneNumber: string;
  profilePictureUrl?: string | null;
}

export default function GodChildLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isOnline } = useOnline();
  const { t, locale, switchLocale } = useLocale();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [priest, setPriest] = useState<PriestInfo | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);

  // Resolves the styled logout-confirm modal: true = discard & log out, false = stay.
  const logoutResolver = useRef<((proceed: boolean) => void) | null>(null);

  // Bridge handed to logout(): opens the modal and resolves with the user's choice.
  const confirmDiscard = () =>
    new Promise<boolean>((resolve) => {
      logoutResolver.current = resolve;
      setConfirmLogout(true);
    });

  const resolveLogout = (proceed: boolean) => {
    logoutResolver.current?.(proceed);
    logoutResolver.current = null;
    setConfirmLogout(false);
  };

  // Fetch the god child's priest once (for the drawer contact block).
  useEffect(() => {
    apiFetch<PriestInfo>("/api/me/priest")
      .then(setPriest)
      .catch(() => {});
  }, []);

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
             <Avatar src={user?.profilePictureUrl} name={user?.spiritualName} sizeClasses="w-8 h-8" textClasses="text-sm" />
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
                  <Avatar src={user?.profilePictureUrl} name={user?.spiritualName} 
                  sizeClasses="w-16 h-16" textClasses="text-2xl" />
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

                {/* Priest contact */}
                {priest && (
                  <div className="px-6 py-4 border-t border-parchment-dark/30">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={priest.profilePictureUrl}
                        name={priest.spiritualName}
                        sizeClasses="w-10 h-10"
                        textClasses="text-base"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-umber-deep">
                          {t("priest.god_father")}
                        </p>
                        {priest.phoneNumber && (
                          <p className="text-xs text-umber-soft">{priest.phoneNumber}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sign out */}
                <div className="p-6 border-t border-parchment-dark/30">
                  <button
                    onClick={() => logout(confirmDiscard)}
                    className="w-full py-3 rounded-xl border border-warm-red/30 text-warm-red font-medium text-sm hover:bg-warm-red/5 transition-colors"
                  >
                    {t("nav.sign_out")}
                  </button>
                  <p className="mt-3 text-center text-[10px] text-umber-soft/60 tracking-wider">
                    v{APP_VERSION}
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Logout confirm modal — only shown when unsynced offline data would be lost */}
        <AnimatePresence>
          {confirmLogout && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-charcoal/40"
              onClick={() => resolveLogout(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", damping: 24, stiffness: 280 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-2xl bg-cream-white border border-parchment-dark shadow-xl p-6"
              >
                <h3 className="text-lg font-bold font-ethiopic text-umber-deep text-center">
                  {t("nav.logout_confirm_title")}
                </h3>
                <p className="mt-2 text-sm text-umber-soft text-center leading-relaxed">
                  {t("nav.logout_confirm_body")}
                </p>
                <div className="mt-6 space-y-2.5">
                  <button
                    onClick={() => resolveLogout(false)}
                    className="w-full py-3 rounded-xl bg-sage/15 text-sage font-medium text-sm hover:bg-sage/25 transition-colors"
                  >
                    {t("nav.logout_stay")}
                  </button>
                  <button
                    onClick={() => resolveLogout(true)}
                    className="w-full py-3 rounded-xl border border-warm-red/40 text-warm-red font-medium text-sm hover:bg-warm-red/10 transition-colors"
                  >
                    {t("nav.logout_discard")}
                  </button>
                </div>
              </motion.div>
            </motion.div>
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
