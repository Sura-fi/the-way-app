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
    email?: string;
    profilePictureUrl?: string | null; 
  }
  
  // ── Storage Keys ────────────────────────────────
  const USER_KEY = "theway_user";
  
  // ── Save ────────────────────────────────────────
  export function saveAuth(user: AuthUser): void {
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
    const user = getStoredUser();
    return user?.token ?? null;
  }
  
  // ── Server-Side Token Validation ────────────────
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5111";
  
  export async function validateTokenWithServer(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.ok;
    } catch {
      // Network error — can't reach server; allow offline access
      return true;
    }
  }
  
  // ── Token Expiry Check ───────────────────────────
  export function isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  // ── Clear (Logout) ──────────────────────────────
  export function clearAuth(): void {
    localStorage.removeItem(USER_KEY);
  }
  
