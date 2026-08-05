"use client";

import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import type { ChatMessage } from "@/hooks/useSessionLive";

interface SessionChatProps {
  sessionSlug: string;
  isLive: boolean;
  initialMessages?: ChatMessage[];
  liveMessages?: ChatMessage[];
}

export function SessionChat({
  sessionSlug,
  isLive,
  initialMessages = [],
  liveMessages = [],
}: SessionChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (liveMessages.length > 0) {
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        const newMsgs = liveMessages.filter((m) => !ids.has(m.id));
        return [...prev, ...newMsgs];
      });
    }
  }, [liveMessages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/sessions/${sessionSlug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        setInput("");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card flex flex-col h-[500px] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-8">
            No messages yet. Be the first to chat!
          </p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-2">
            <span
              className={`text-xs font-semibold shrink-0 ${
                msg.isCreator ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"
              }`}
            >
              {msg.username}
            </span>
            <div>
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
      </div>
      {isLive && (
        <div className="border-t border-[var(--color-border)] p-3 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Say something…"
            className="input flex-1 !py-2"
          />
          <button
            onClick={send}
            disabled={sending}
            className="btn-primary !p-2.5 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
