"use client";

import { ReactNode, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useOnline } from "@/components/providers/OnlineStatusProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import ProtectedRoute from "@/components/providers/ProtectedRoute";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Users, UserCircle, Menu, X, Globe, LogOut } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function PriestLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { isOnline } = useOnline();
  const { t, locale, switchLocale } = useLocale();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);



  const navLinkClass = (active: boolean) =>
    `block px-3 py-2 rounded-lg text-sm transition-colors ${
      active
        ? "bg-gold-muted/20 text-gold-muted font-medium"
        : "text-parchment-dark hover:text-cream-white hover:bg-cream-white/5"
    }`;

  const sidebarNav = (onLinkClick?: () => void) => (
    <nav className="flex-1 px-4 py-4 space-y-1">
      <Link
        href="/dashboard"
        onClick={onLinkClick}
        className={navLinkClass(pathname === "/dashboard")}
      >
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-4 h-4" />
          <span>{t("priest.overview_publish")}</span>
        </div>
      </Link>
      <Link
        href="/dashboard"
        onClick={onLinkClick}
        className={navLinkClass(pathname?.startsWith("/users") ?? false)}
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>{t("priest.god_children")}</span>
        </div>
      </Link>
      <Link
        href="/dashboard/profile"
        onClick={onLinkClick}
        className={navLinkClass(pathname === "/dashboard/profile")}
      >
        <div className="flex items-center gap-2">
          <UserCircle className="w-4 h-4" />
          <span>{t("priest.profile")}</span>
        </div>
      </Link>
    </nav>
  );

  const sidebarBottom = (
    <div className="px-4 py-6 border-t border-umber-soft/20 space-y-4">
      {/* Online Status Pill */}
      <div className="flex items-center justify-center gap-2 py-1.5 px-3 rounded-full bg-cream-white/5 mx-2">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
          }`}
        />
        <span className="text-[10px] uppercase tracking-widest font-bold text-parchment-dark/80">
          {isOnline ? t("priest.online") : t("priest.offline")}
        </span>
      </div>

      {/* Language Toggle */}
      <button
        onClick={() => switchLocale(locale === "am" ? "en" : "am")}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm
                   bg-cream-white/5 hover:bg-cream-white/10 border border-transparent hover:border-cream-white/10 transition-all group"
        title={locale === "am" ? "Switch to English" : "ወደ አማርኛ ቀይር"}
      >
        <div className="flex items-center gap-2.5">
          <Globe className="w-4 h-4 text-parchment-dark group-hover:text-cream-white transition-colors" />
          <span className={`text-parchment-dark group-hover:text-cream-white transition-colors ${locale === 'en' ? 'font-ethiopic font-medium' : 'font-medium'}`}>
            {locale === "am" ? "English" : "አማርኛ"}
          </span>
        </div>
        <span className="text-lg opacity-70 group-hover:opacity-100 grayscale group-hover:grayscale-0 transition-all duration-300">
          {locale === "am" ? "🇬🇧" : "🇪🇹"}
        </span>
      </button>

      {/* Sign Out Button */}
      <button
        onClick={() => logout()}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium
                   text-parchment-dark hover:text-warm-red hover:bg-warm-red/10 transition-all group"
      >
        <LogOut className="w-4 h-4 opacity-70 group-hover:text-warm-red group-hover:opacity-100 transition-colors" />
        {t("priest.sign_out")}
      </button>
    </div>
  );

  return (
    <ProtectedRoute allowedRoles={["Priest"]}>
      <div className="min-h-screen bg-parchment-light flex">
        {/* ── Desktop Sidebar ─────────────────────── */}
        <aside className="hidden md:flex w-64 bg-charcoal text-cream-white flex-col">
          <div className="px-6 py-5 border-b border-umber-soft/20">
            <div className="flex items-center gap-3 mb-1">
              <Logo size="md" />
              <h1 className="font-ethiopic font-bold text-2xl text-gold-muted mt-1 tracking-wide">
                መንገዱ
              </h1>
            </div>
            <p className="text-xs text-parchment-dark mt-1">
              {t("priest.dashboard")}
            </p>
          </div>

          {sidebarNav()}

          {sidebarBottom}
        </aside>

        {/* ── Mobile top bar ──────────────────────── */}
        <nav className="md:hidden bg-cream-white border-b border-parchment-dark px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-30">
          <div className="flex items-center gap-2.5">
            <Logo size="sm" />
            <span className="font-ethiopic font-bold text-xl text-gold-muted mt-0.5 tracking-wide">
              መንገዱ
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-parchment-dark/20 transition-colors text-umber-soft"
          >
            <Menu className="w-5 h-5" />
          </button>
        </nav>

        {/* ── Mobile sidebar overlay ──────────────── */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden fixed inset-0 z-40 bg-charcoal/40"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 250 }}
                className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-charcoal text-cream-white flex flex-col"
              >
                <div className="flex justify-end p-4">
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="text-parchment-dark/60 hover:text-parchment-dark transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="px-6 pb-4 border-b border-umber-soft/20">
                  <div className="flex items-center gap-3 mb-1">
                    <Logo size="md" />
                    <h1 className="font-ethiopic font-bold text-2xl text-gold-muted mt-1 tracking-wide">
                      መንገዱ
                    </h1>
                  </div>
                  <p className="text-xs text-parchment-dark mt-1">
                    {t("priest.dashboard")}
                  </p>
                </div>

                {sidebarNav(() => setSidebarOpen(false))}

                {sidebarBottom}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ── User Drawer (profile info) ─────────── */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-charcoal/30"
                onClick={() => setDrawerOpen(false)}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 250 }}
                className="fixed top-0 right-0 bottom-0 z-60 w-72 bg-cream-white border-l border-parchment-dark shadow-xl flex flex-col"
              >
                <div className="flex justify-end p-4">
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="text-umber-soft/50 hover:text-umber-soft transition-colors text-lg"
                  >
                    ✕
                  </button>
                </div>

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
                  <span className="mt-2 px-3 py-0.5 rounded-full bg-gold-muted/10 text-gold-muted text-[10px] font-medium">
                    {t("priest.dashboard")}
                  </span>
                </div>

                <div className="flex-1 px-6 py-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-sage" : "bg-gold-muted animate-pulse"}`} />
                    <span className="text-sm text-umber-deep font-medium">
                      {isOnline ? t("priest.online") : t("priest.offline")}
                    </span>
                  </div>
                </div>

                <div className="p-6 border-t border-parchment-dark/30">
                  <button
                    onClick={() => logout()}
                    className="w-full py-3 rounded-xl border border-warm-red/30 text-warm-red font-medium text-sm hover:bg-warm-red/5 transition-colors"
                  >
                    {t("priest.sign_out")}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Main Content ────────────────────────── */}
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex-1 p-8 overflow-auto md:ml-0 mt-14 md:mt-0"
        >
          {children}
        </motion.main>
      </div>
    </ProtectedRoute>
  );
}
