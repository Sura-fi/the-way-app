"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ("GodChild" | "Priest")[];
}

/**
 * Wraps a page to enforce authentication and optional role checks.
 *
 * Usage:
 *   <ProtectedRoute>                         → any logged-in user
 *   <ProtectedRoute allowedRoles={["Priest"]}> → Priest only
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; // Still checking localStorage, wait

    // Not logged in → send to login
    if (!user) {
      router.push("/login");
      return;
    }

    // Logged in but wrong role → send to their home page
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.push(user.role === "Priest" ? "/dashboard" : "/today");
      return;
    }
  }, [user, isLoading, router, allowedRoles]);

  // Show nothing while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment-light">
        <div className="text-umber-soft animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  // Not authenticated or wrong role → show nothing (redirect is happening)
  if (!user) return null;
  if (allowedRoles && !allowedRoles.includes(user.role)) return null;

  // All good — render the page
  return <>{children}</>;
}
