"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";

export default function RegisterPage() {
  const { register } = useAuth();

  // ── Form State ────────────────────────────────
  const [formalName, setFormalName] = useState("");
  const [spiritualName, setSpiritualName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PHONE_REGEX = /^(\+251|0)[79]\d{8}$/;

  // ── Handle Submit ─────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (phoneNumber && !PHONE_REGEX.test(phoneNumber)) {
      setError("Please enter a valid Ethiopian phone number (e.g. 0912345678 or +251912345678).");
      return;
    }

    setIsSubmitting(true);

    try {
      await register({ formalName, spiritualName, email, password, phoneNumber });
      // Redirect happens inside AuthProvider.register()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <Link
          href="/login"
          className="absolute left-0 top-1/2 -translate-y-1/2 text-umber-soft hover:text-umber-deep transition-colors"
          aria-label="Go back to login"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-semibold text-center text-umber-deep">
          Create Account
        </h2>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-warm-red/10 border border-warm-red/30 text-warm-red text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Formal Name */}
      <div>
        <label
          htmlFor="reg-formal-name"
          className="block text-sm font-medium text-umber-soft mb-1"
        >
          Formal Name
        </label>
        <input
          id="reg-formal-name"
          type="text"
          required
          value={formalName}
          onChange={(e) => setFormalName(e.target.value)}
          placeholder="Full name"
          className="input-field"
        />
      </div>

      {/* Spiritual Name */}
      <div>
        <label
          htmlFor="reg-spiritual-name"
          className="block text-sm font-medium text-umber-soft mb-1"
        >
          Spiritual Name / የክርስትና ስም
        </label>
        <input
          id="reg-spiritual-name"
          type="text"
          required
          value={spiritualName}
          onChange={(e) => setSpiritualName(e.target.value)}
          placeholder="Baptismal name"
          className="input-field"
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="reg-email"
          className="block text-sm font-medium text-umber-soft mb-1"
        >
          Email
        </label>
        <input
          id="reg-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="input-field"
        />
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="reg-password"
          className="block text-sm font-medium text-umber-soft mb-1"
        >
          Password
        </label>
        <input
          id="reg-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          className="input-field"
        />
      </div>

      {/* Confirm Password */}
      <div>
        <label
          htmlFor="reg-confirm"
          className="block text-sm font-medium text-umber-soft mb-1"
        >
          Confirm Password
        </label>
        <input
          id="reg-confirm"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Type password again"
          className="input-field"
        />
      </div>

      {/* Phone Number (optional, GodChild only) */}
      <div>
        <label
          htmlFor="reg-phone"
          className="block text-sm font-medium text-umber-soft mb-1"
        >
          Phone Number (optional)
        </label>
        <input
          id="reg-phone"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="0912345678 or +251912345678"
          className="input-field"
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Creating Account..." : "Create Account"}
      </button>

      {/* Link to Login */}
      <p className="text-center text-sm text-umber-soft">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-gold-muted hover:text-gold-bright font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
