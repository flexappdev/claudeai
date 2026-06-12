"use client";

import { Markdown } from "./Markdown";
import type { MessageDTO } from "@/lib/types";

export function MessageBubble({ message }: { message: MessageDTO }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div
          className="max-w-[85%] rounded-[var(--radius-card)] px-4 py-3 text-sm shadow-sm"
          style={{ background: "var(--color-accent-tint)" }}
        >
          <Markdown>{message.content}</Markdown>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] px-1 py-2">
        {message.content ? (
          <Markdown>{message.content}</Markdown>
        ) : (
          <span className="text-sm text-[var(--color-text-muted)]">…</span>
        )}
      </div>
    </div>
  );
}
