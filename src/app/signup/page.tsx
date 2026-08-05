"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default function SignupPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [form, setForm] = useState({
    email: "",
    username: "",
    displayName: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/config")
      .then((r) => r.json())
      .then((d) => setGoogleEnabled(!!d.googleEnabled))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 gradient-hero py-10">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-outfit)" }}>
          Create your account
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">Start streaming AI agent sessions for free</p>

        {googleEnabled && <GoogleSignInButton label="Sign up with Google" />}

        {googleEnabled && (
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[var(--color-border)]" />
            <span className="text-xs text-[var(--color-text-muted)]">or email</span>
            <div className="flex-1 h-px bg-[var(--color-border)]" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Display name</label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
              className="input"
              pattern="[a-z0-9_]{3,20}"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input"
              minLength={8}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-[var(--color-danger)] bg-red-50 dark:bg-red-950 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full !py-3 disabled:opacity-50">
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-sm text-center mt-6 text-[var(--color-text-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--color-primary)] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
