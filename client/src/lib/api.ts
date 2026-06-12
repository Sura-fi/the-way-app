import { clearAuth } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5111";

/**
 * A thin wrapper around fetch() that:
 * 1. Prepends the API base URL
 * 2. Attaches the JWT token from localStorage
 * 3. Sets JSON content-type headers
 * 4. Throws on non-OK responses
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // 1. Read the token from the stored user object (single source of truth)
  let token: string | null = null;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("theway_user");
      if (raw) token = JSON.parse(raw).token ?? null;
    } catch {
      token = null;
    }
  }

  // 2. Build headers — always send JSON, attach token if we have one
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // 3. Make the request
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // 4. If the response is not OK, throw an error with the server message
  if (!response.ok) {
    // 401 + we thought we were logged in → stale session
    if (response.status === 401 && typeof window !== "undefined") {
      const storedUser = localStorage.getItem("theway_user");
      if (storedUser) {
        clearAuth();
        window.location.href = "/login";
        throw new Error("Your session has expired. Please sign in again.");
      }
    }

    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message || `Request failed with status ${response.status}`
    );
  }

  // 5. Parse and return the JSON response
  //    (handle 204 No Content — return empty object)
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}
