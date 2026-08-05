"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const ERROR_MESSAGES: Record<string, string> = {
  google_denied: "Google sign-in was cancelled.",
  google_failed: "Google sign-in failed. Try again or use email.",
  google_state: "Sign-in session expired. Please try again.",
  google_missing: "Google sign-in was incomplete.",
};

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  const nextPath = searchParams.get("next");
  const redirectTo = nextPath && nextPath.startsWith("/") ? nextPath : "/dashboard";

  useEffect(() => {
    fetch("/api/auth/config")
      .then((r) => r.json())
      .then((d) => setGoogleEnabled(!!d.googleEnabled))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err && ERROR_MESSAGES[err]) setError(ERROR_MESSAGES[err]);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card w-full max-w-md p-8">
      <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-outfit)" }}>
        Welcome back
      </h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">Sign in to your AgentCast account</p>

      {googleEnabled && <GoogleSignInButton nextPath={redirectTo} />}

      {googleEnabled && (
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[var(--color-border)]" />
          <span className="text-xs text-[var(--color-text-muted)]">or email</span>
          <div className="flex-1 h-px bg-[var(--color-border)]" />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1.5 block">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-[var(--color-danger)] bg-red-50 dark:bg-red-950 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full !py-3 disabled:opacity-50">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-sm text-[var(--color-text-muted)] text-center mt-6">
        Demo: <code className="text-[var(--color-primary)]">demo@agentcast.io</code> / <code className="text-[var(--color-primary)]">demo1234</code>
      </p>

      <p className="text-sm text-center mt-4 text-[var(--color-text-muted)]">
        No account?{" "}
        <Link href="/signup" className="text-[var(--color-primary)] font-medium hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 gradient-hero">
      <Suspense fallback={<div className="card w-full max-w-md p-8">Loading…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
