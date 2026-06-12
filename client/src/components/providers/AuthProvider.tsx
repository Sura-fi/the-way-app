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
  logout: () => void;
  updateProfile: (data: { phoneNumber: string }) => Promise<void>;
}

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

      saveAuth(response);
      setUser(response);
      router.push("/today");
    },
    [router]
  );

  // ── Logout ──────────────────────────────────
  const logout = useCallback(() => {
    clearAuth();
    setUser(null);
    router.push("/login");
  }, [router]);

  // ── Update Profile ─────────────────────────
  const updateProfile = useCallback(
    async (data: { phoneNumber: string }) => {
      await apiFetch("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });

      if (!user) return;
      const updated: AuthUser = { ...user, phoneNumber: data.phoneNumber };
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
