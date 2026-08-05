import Link from "next/link";
import { Radio, ArrowRight, Zap, MessageSquare, Scissors, Users } from "lucide-react";

const features: Array<{
  icon: typeof Zap;
  title: string;
  desc: string;
  href?: string;
}> = [
  { icon: Zap, title: "Multi-agent", desc: "Claude, Grok, Codex, Cursor, Gemini & more" },
  { icon: MessageSquare, title: "Live chat", desc: "Talk with viewers in real time" },
  { icon: Scissors, title: "Highlights", desc: "Clip and share key moments", href: "/highlights" },
  { icon: Users, title: "Community", desc: "Follow creators, discover sessions", href: "/community" },
];

export function Hero() {
  return (
    <section className="gradient-hero">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 lg:py-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] text-xs font-semibold mb-6">
            <Radio className="h-3 w-3" />
            AI Agent Observability Platform
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
            style={{ fontFamily: "var(--font-outfit)" }}
          >
            Stream your AI agents{" "}
            <span className="gradient-text">building software</span>
          </h1>

          <p className="text-lg text-[var(--color-text-secondary)] leading-relaxed mb-8 max-w-xl">
            Turn any AI coding session into a live, replayable broadcast.
            Viewers watch every prompt and tool call — and can interact with
            your session in real time.
          </p>

          <div className="flex flex-wrap gap-3 mb-12">
            <a href="#get-started" className="btn-primary flex items-center gap-2">
              Stream your first session
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/explore" className="btn-secondary">
              Browse sessions
            </Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, desc, href }) => (
            <Link key={title} href={href || "#"} className="card p-5 block hover:border-[var(--color-primary)]/30 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center mb-3">
                <Icon className="h-5 w-5 text-[var(--color-primary)]" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{title}</h3>
              <p className="text-xs text-[var(--color-text-muted)]">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
