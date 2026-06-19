"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AuthUser, saveAuth, getStoredUser, clearAuth, isTokenExpired, validateTokenWithServer } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { db } from "@/lib/db";
import { syncPendingLogs } from "@/lib/sync";

// ── Types ───────────────────────────────────────
interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  formalName: string;
  spiritualName: string;
  email: string;
  password: string;
  phoneNumber: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: (confirmDiscard?: () => Promise<boolean>) => Promise<void>;
  updateProfile: (data: { phoneNumber?: string; formalName?: string; profilePicture?: string }) => Promise<void>;
  // updateProfile: (data: { phoneNumber: string }) => Promise<void>;
}

// Native-confirm fallback (bilingual) used only when no styled prompt is supplied.
// AuthProvider can't depend on LocaleProvider, so this is a plain literal.
const LOGOUT_DISCARD_FALLBACK =
  "You have activity that hasn't been saved to the server yet. Connect to the " +
  "internet before logging out, or it will be lost.\n\n" +
  "ገና ወደ አገልጋዩ ያልተቀመጠ እንቅስቃሴ አለዎት። ከመውጣትዎ በፊት ኢንተርኔት ያገናኙ፣ አለበለዚያ ይጠፋል።\n\n" +
  "Log out anyway?";

// ── Create Context ──────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider Component ──────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // On mount: restore user from localStorage if token is still valid
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      if (isTokenExpired(stored.token)) {
        clearAuth();
        setIsLoading(false);
        return;
      }

      // Validate the token with the server before allowing access
      validateTokenWithServer(stored.token).then((isValid) => {
        if (isValid) {
          setUser(stored);
        } else {
          clearAuth();
        }
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, []);

  // ── Login ───────────────────────────────────
  const login = useCallback(
    async (data: LoginData) => {
      const response = await apiFetch<AuthUser>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });

      // Drop any offline cache left by a previous identity on this device
      // so the new user never inherits another account's local logs.
      await db.dailyLogs.clear();

      saveAuth(response);
      setUser(response);

      // Redirect based on role and password status
      if (response.mustChangePassword) {
        router.push("/change-password");
      } else if (response.role === "Priest") {
        router.push("/dashboard");
      } else {
        router.push("/today");
      }
    },
    [router]
  );

  // ── Register ────────────────────────────────
  const register = useCallback(
    async (data: RegisterData) => {
      const response = await apiFetch<AuthUser>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });

      // Fresh identity — never inherit a prior account's local logs.
      await db.dailyLogs.clear();

      saveAuth(response);
      setUser(response);
      router.push("/today");
    },
    [router]
  );

  // ── Logout ──────────────────────────────────
  const logout = useCallback(
    async (confirmDiscard?: () => Promise<boolean>) => {
      // 1. Best-effort flush of this user's unsynced offline work (only possible
      //    online). On success, syncPendingLogs marks rows "synced".
      if (typeof navigator !== "undefined" && navigator.onLine) {
        try {
          await syncPendingLogs();
        } catch {
          // Offline or server unreachable — fall through to the guard below.
        }
      }

      // 2. Guard: if unsynced logs still remain (offline, or sync failed), confirm
      //    BEFORE wiping. Abort if the user declines — nothing is cleared.
      const pending = await db.dailyLogs
        .where("syncStatus")
        .equals("pending")
        .count();
      if (pending > 0) {
        const proceed = confirmDiscard
          ? await confirmDiscard()
          : typeof window !== "undefined"
          ? window.confirm(LOGOUT_DISCARD_FALLBACK)
          : true;
        if (!proceed) return; // stay logged in, cache intact
      }

      // 3. Safe to clear the per-device offline cache so the next account on this
      //    device can't read or sync this user's logs.
      await db.dailyLogs.clear();
      await db.cachedQuote.clear();

      clearAuth();
      setUser(null);
      router.push("/login");
    },
    [router]
  );

  // ── Update Profile ─────────────────────────
  const updateProfile = useCallback(
    async (data: { phoneNumber?: string; formalName?: string; profilePicture?: string }) => {
      await apiFetch("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });

      // if (!user) return;
      // const updated: AuthUser = { ...user, phoneNumber: data.phoneNumber };
      if (!user) return;
    const updated: AuthUser = {
      ...user,
      ...(data.phoneNumber !== undefined ? { phoneNumber: data.phoneNumber } : {}),
      ...(data.formalName !== undefined ? { formalName: data.formalName } : {}),
      ...(data.profilePicture !== undefined
        ? { profilePictureUrl: data.profilePicture === "" ? null : data.profilePicture }
        : {}),
    };
      saveAuth(updated);
      setUser(updated);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
