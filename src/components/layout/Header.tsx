"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  Search,
  Menu,
  X,
  LayoutDashboard,
  Radio,
  LogOut,
  User,
  Terminal,
} from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";

export function Header() {
  const { user, loading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/explore?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white font-bold text-sm"
            style={{
              background: "linear-gradient(135deg, var(--color-primary), #7c3aed)",
            }}
          >
            A
          </div>
          <span
            className="font-semibold text-lg tracking-tight hidden sm:block"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            AgentCast
          </span>
        </Link>

        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-auto hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search sessions, creators, tags…"
              className="input pl-10 py-2"
            />
          </div>
        </form>

        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/explore"
            className="px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            Explore
          </Link>
          <Link
            href="/community"
            className="px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            Community
          </Link>
          <Link
            href="/highlights"
            className="px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            Highlights
          </Link>
          <Link
            href="/#agents"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <Terminal className="h-3.5 w-3.5" />
            Agents
          </Link>
          <Link
            href="/explore?status=live"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-live)] rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <Radio className="h-3.5 w-3.5" />
            Live
          </Link>
          {!loading && user ? (
            <>
              <Link href="/dashboard" className="btn-secondary text-sm flex items-center gap-1.5 !py-2 !px-3">
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              <div className="relative group">
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--color-surface-hover)]">
                  <UserAvatar name={user.displayName} avatar={user.avatar} size="md" />
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 card p-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-lg">
                  <Link
                    href={`/u/${user.username}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-[var(--color-surface-hover)]"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-[var(--color-surface-hover)]"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-[var(--color-surface-hover)] text-[var(--color-danger)]"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          ) : !loading ? (
            <>
              <Link href="/login" className="btn-secondary text-sm !py-2 !px-4">
                Sign in
              </Link>
              <Link href="/signup" className="btn-primary text-sm !py-2 !px-4">
                Get started
              </Link>
            </>
          ) : null}
        </nav>

        <button
          className="md:hidden p-2 text-[var(--color-text-secondary)]"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--color-border)] p-4 space-y-2 bg-[var(--color-surface)]">
          <form onSubmit={handleSearch}>
            <input type="search" placeholder="Search…" className="input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </form>
          <Link href="/explore" className="block py-2 text-sm" onClick={() => setMobileOpen(false)}>Explore</Link>
          <Link href="/community" className="block py-2 text-sm" onClick={() => setMobileOpen(false)}>Community</Link>
          <Link href="/highlights" className="block py-2 text-sm" onClick={() => setMobileOpen(false)}>Highlights</Link>
          <Link href="/dashboard" className="block py-2 text-sm" onClick={() => setMobileOpen(false)}>Dashboard</Link>
          {!user ? (
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="btn-secondary flex-1 text-center text-sm">Sign in</Link>
              <Link href="/signup" className="btn-primary flex-1 text-center text-sm">Get started</Link>
            </div>
          ) : (
            <button onClick={() => { logout(); setMobileOpen(false); }} className="text-sm text-[var(--color-danger)] py-2">
              Sign out
            </button>
          )}
        </div>
      )}
    </header>
  );
}
