/**
 * The shape of the user data we store after login/register.
 * This matches what the backend's AuthResponse returns.
 */
export interface AuthUser {
    token: string;
    role: "GodChild" | "Priest";
    mustChangePassword: boolean;
    formalName: string;
    spiritualName: string;
    phoneNumber: string;
  }
  
  // ── Storage Keys ────────────────────────────────
  const TOKEN_KEY = "theway_token";
  const USER_KEY = "theway_user";
  
  // ── Save ────────────────────────────────────────
  export function saveAuth(user: AuthUser): void {
    localStorage.setItem(TOKEN_KEY, user.token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  
  // ── Read ────────────────────────────────────────
  export function getStoredUser(): AuthUser | null {
    if (typeof window === "undefined") return null;
  
    const data = localStorage.getItem(USER_KEY);
    if (!data) return null;
  
    try {
      return JSON.parse(data) as AuthUser;
    } catch {
      return null;
    }
  }
  
  export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  }
  
  // ── Clear (Logout) ──────────────────────────────
  export function clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  