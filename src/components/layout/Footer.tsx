import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)] mt-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold text-sm"
                style={{ background: "linear-gradient(135deg, var(--color-primary), #7c3aed)" }}
              >
                A
              </div>
              <span className="font-semibold" style={{ fontFamily: "var(--font-outfit)" }}>
                AgentCast
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
              The platform for streaming, replaying, and sharing AI agent coding sessions.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <li><Link href="/explore" className="hover:text-[var(--color-text)] transition-colors">Explore</Link></li>
              <li><Link href="/dashboard" className="hover:text-[var(--color-text)] transition-colors">Dashboard</Link></li>
              <li><Link href="/docs/cli" className="hover:text-[var(--color-text)] transition-colors">CLI</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <li><Link href="/docs/system-design" className="hover:text-[var(--color-text)] transition-colors">System Design</Link></li>
              <li><Link href="/docs/api" className="hover:text-[var(--color-text)] transition-colors">API Reference</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-sm mb-3">Account</h4>
            <ul className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <li><Link href="/login" className="hover:text-[var(--color-text)] transition-colors">Sign in</Link></li>
              <li><Link href="/signup" className="hover:text-[var(--color-text)] transition-colors">Create account</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
          © 2026 AgentCast. Open source under MIT license.
        </div>
      </div>
    </footer>
  );
}
