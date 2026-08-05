"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Terminal, Check, Loader2 } from "lucide-react";

function CliAuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const code = (searchParams.get("code") || "").toUpperCase();

  const [status, setStatus] = useState<"idle" | "approving" | "done" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user && code) {
      const next = encodeURIComponent(`/cli/auth?code=${code}`);
      router.replace(`/login?next=${next}`);
    }
  }, [loading, user, code, router]);

  const approve = async () => {
    if (!code) return;
    setStatus("approving");
    setError("");
    try {
      const res = await fetch("/api/auth/device/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authorization failed");
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed");
    }
  };

  if (loading) {
    return (
      <div className="card p-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-[var(--color-primary)]" />
      </div>
    );
  }

  if (!code) {
    return (
      <div className="card p-8 text-center">
        <p className="text-[var(--color-text-muted)]">Missing authorization code. Run the CLI install again.</p>
        <Link href="/" className="btn-primary mt-4 inline-block">Go home</Link>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="card p-8 text-center">
        <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center mx-auto mb-4">
          <Check className="h-7 w-7 text-[var(--color-success)]" />
        </div>
        <h1 className="text-xl font-bold mb-2">CLI authorized</h1>
        <p className="text-[var(--color-text-muted)] text-sm">
          You can close this tab and return to your terminal.
          <br />
          Run <code className="text-[var(--color-primary)]">agentcast claude</code> to start streaming.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center">
          <Terminal className="h-5 w-5 text-[var(--color-primary)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-outfit)" }}>
            Authorize AgentCast CLI
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Signed in as {user?.displayName}
          </p>
        </div>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)] mb-4">
        The CLI on your machine wants to stream sessions to your AgentCast account.
        This is a one-time sign-in — no tokens to copy.
      </p>

      <div className="rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] p-4 mb-6 text-center">
        <p className="text-xs text-[var(--color-text-muted)] mb-1">Authorization code</p>
        <p className="text-2xl font-mono font-bold tracking-widest text-[var(--color-primary)]">{code}</p>
      </div>

      {error && (
        <p className="text-sm text-[var(--color-danger)] mb-4">{error}</p>
      )}

      <button
        onClick={approve}
        disabled={status === "approving" || !user}
        className="btn-primary w-full !py-3 disabled:opacity-50"
      >
        {status === "approving" ? "Authorizing…" : "Authorize CLI"}
      </button>
    </div>
  );
}

export default function CliAuthPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 gradient-hero">
      <div className="w-full max-w-md">
        <Suspense fallback={<div className="card p-10 text-center">Loading…</div>}>
          <CliAuthContent />
        </Suspense>
      </div>
    </div>
  );
}
