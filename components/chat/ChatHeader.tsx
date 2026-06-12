"use client";

import { Check, MoreHorizontal, Star, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ChatDTO } from "@/lib/types";

export function ChatHeader({
  chat,
  onUpdate,
}: {
  chat: ChatDTO;
  onUpdate: (c: ChatDTO) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(chat.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => setTitle(chat.title), [chat.title]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  async function patch(update: Partial<ChatDTO>) {
    const res = await fetch(`/api/chats/${chat._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    if (res.ok) {
      const { chat: updated } = (await res.json()) as { chat: ChatDTO };
      onUpdate(updated);
    }
  }

  async function commitTitle() {
    setEditing(false);
    const next = title.trim() || "New chat";
    if (next !== chat.title) await patch({ title: next });
  }

  async function deleteChat() {
    if (!confirm("Delete this chat? This cannot be undone.")) return;
    const res = await fetch(`/api/chats/${chat._id}`, { method: "DELETE" });
    if (res.ok) router.push("/chat");
  }

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-paper)]/85 px-4 py-3 backdrop-blur">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {editing ? (
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTitle();
              if (e.key === "Escape") {
                setTitle(chat.title);
                setEditing(false);
              }
            }}
            autoFocus
            className="focus-ring w-full max-w-xl rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-base font-semibold"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="focus-ring max-w-xl truncate rounded-md px-1 py-0.5 text-left text-base font-semibold hover:bg-[var(--color-surface-2)]"
            title="Rename"
          >
            {chat.title}
          </button>
        )}
        <span className="hidden rounded-md border border-[var(--color-border)] px-1.5 py-0.5 text-[11px] uppercase tracking-wide text-[var(--color-text-muted)] sm:inline">
          {chat.model.replace("claude-", "").replace("-20251001", "")}
        </span>
      </div>

      <button
        type="button"
        onClick={() => patch({ starred: !chat.starred })}
        aria-pressed={chat.starred}
        aria-label={chat.starred ? "Unstar" : "Star"}
        className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
      >
        <Star
          className="h-4 w-4"
          fill={chat.starred ? "currentColor" : "none"}
          color={chat.starred ? "var(--color-accent)" : "currentColor"}
        />
      </button>

      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Chat menu"
          className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-9 z-30 w-48 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
            <button
              type="button"
              onClick={() => {
                setEditing(true);
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--color-surface-2)]"
            >
              <Check className="h-4 w-4 opacity-0" />
              Rename
            </button>
            <button
              type="button"
              onClick={deleteChat}
              className="flex w-full items-center gap-2 border-t border-[var(--color-border)] px-3 py-2 text-sm text-red-600 hover:bg-[var(--color-surface-2)]"
            >
              <Trash2 className="h-4 w-4" />
              Delete chat
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
