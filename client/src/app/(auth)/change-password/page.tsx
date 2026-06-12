"use client";

import { useState, FormEvent } from "react";
import { apiFetch } from "@/lib/api";
import { getStoredUser, saveAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();

  // ── Form State ────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Handle Submit ─────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation: passwords must match
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    // Client-side validation: minimum length
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      // Success: update localStorage so the app knows
      // mustChangePassword is now false
      const storedUser = getStoredUser();
      if (storedUser) {
        saveAuth({ ...storedUser, mustChangePassword: false });
      }

      // Redirect to dashboard (Priest is the only role
      // that has mustChangePassword = true)
      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Password change failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-xl font-semibold text-center text-umber-deep">
        Change Password
      </h2>

      <p className="text-sm text-umber-soft text-center">
        You must change your default password before continuing.
      </p>

      {/* Error Banner */}
      {error && (
        <div className="bg-warm-red/10 border border-warm-red/30 text-warm-red text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Current Password */}
      <div>
        <label
          htmlFor="current-password"
          className="block text-sm font-medium text-umber-soft mb-1"
        >
          Current Password
        </label>
        <div className="relative">
          <input
            id="current-password"
            type={showCurrentPassword ? "text" : "password"}
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••••"
            className="input-field pr-10"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-umber-soft hover:text-umber-deep transition-colors"
            aria-label={showCurrentPassword ? "Hide password" : "Show password"}
          >
            {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* New Password */}
      <div>
        <label
          htmlFor="new-password"
          className="block text-sm font-medium text-umber-soft mb-1"
        >
          New Password
        </label>
        <div className="relative">
          <input
            id="new-password"
            type={showNewPassword ? "text" : "password"}
            required
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            className="input-field pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-umber-soft hover:text-umber-deep transition-colors"
            aria-label={showNewPassword ? "Hide password" : "Show password"}
          >
            {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Confirm New Password */}
      <div>
        <label
          htmlFor="confirm-password"
          className="block text-sm font-medium text-umber-soft mb-1"
        >
          Confirm New Password
        </label>
        <div className="relative">
          <input
            id="confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="input-field pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-umber-soft hover:text-umber-deep transition-colors"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Changing Password..." : "Change Password"}
      </button>
    </form>
  );
}
