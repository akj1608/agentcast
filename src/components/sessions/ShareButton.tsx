"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Check, Copy, Link2, Code } from "lucide-react";

interface ShareButtonProps {
  url: string;
  title: string;
}

export function ShareButton({ url, title }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const copy = async (text: string, label: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt("Copy this link:", text);
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url, text: `Watch "${title}" on Agentshow` });
        setOpen(false);
        return;
      } catch {
        // user cancelled
      }
    }
    await copy(url, "link");
  };

  const embedCode = `<iframe src="${url}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="btn-secondary text-sm flex items-center gap-1.5 !py-2"
      >
        <Share2 className="h-4 w-4" />
        Share
        {copied === "link" && <span className="text-[var(--color-success)] text-xs ml-1">Copied!</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 card p-2 shadow-xl z-50">
          <button
            onClick={nativeShare}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg hover:bg-[var(--color-surface-hover)] text-left"
          >
            <Share2 className="h-4 w-4 text-[var(--color-primary)]" />
            Share link
          </button>
          <button
            onClick={() => copy(url, "link")}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg hover:bg-[var(--color-surface-hover)] text-left"
          >
            {copied === "link" ? <Check className="h-4 w-4 text-[var(--color-success)]" /> : <Link2 className="h-4 w-4" />}
            Copy URL
          </button>
          <button
            onClick={() => copy(embedCode, "embed")}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-lg hover:bg-[var(--color-surface-hover)] text-left"
          >
            {copied === "embed" ? <Check className="h-4 w-4 text-[var(--color-success)]" /> : <Code className="h-4 w-4" />}
            Copy embed code
          </button>
          <div className="mt-2 px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)] mb-1">Session URL</p>
            <p className="text-xs font-mono break-all text-[var(--color-primary)]">{url}</p>
          </div>
        </div>
      )}
    </div>
  );
}
