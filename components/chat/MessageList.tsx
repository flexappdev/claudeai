"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import type { MessageDTO } from "@/lib/types";

export function MessageList({ messages }: { messages: MessageDTO[] }) {
  const endRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, messages[messages.length - 1]?.content.length]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-center">
        <p className="max-w-md text-sm text-[var(--color-text-muted)]">
          Start the conversation — ask anything, paste a doc, request a chart.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-2 py-6">
      {messages.map((m) => (
        <MessageBubble key={m._id} message={m} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
