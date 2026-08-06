"use client";

import { ArrowUp, Loader2, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMode } from "@/lib/chatModes";

export type { ChatMode };

const MODE_KEY = (chatId: string) => `claudeai:mode:${chatId}`;

export type ComposerProps = {
  chatId: string;
  initialText?: string;
  disabled?: boolean;
  streaming?: boolean;
  onSend: (text: string, mode: ChatMode) => void | Promise<void>;
  onStop?: () => void;
};

const MAX_LINES = 10;

export function Composer({ chatId, initialText = "", disabled, streaming, onSend, onStop }: ComposerProps) {
  const [text, setText] = useState(initialText);
  const [mode, setMode] = useState<ChatMode>("normal");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(MODE_KEY(chatId));
    if (stored === "write" || stored === "code" || stored === "normal") setMode(stored);
  }, [chatId]);

  const updateMode = useCallback(
    (next: ChatMode) => {
      setMode(next);
      window.localStorage.setItem(MODE_KEY(chatId), next);
    },
    [chatId],
  );

  const autogrow = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    const lineHeight = 22;
    const maxH = lineHeight * MAX_LINES + 16;
    el.style.height = `${Math.min(el.scrollHeight, maxH)}px`;
  }, []);

  useEffect(() => {
    autogrow();
  }, [text, autogrow]);

  const send = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled || streaming) return;
    void onSend(trimmed, mode);
    setText("");
  }, [text, disabled, streaming, mode, onSend]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    },
    [send],
  );

  return (
    <div className="sticky bottom-0 z-10 mx-auto w-full max-w-3xl px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-2">
      <div
        className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[0_2px_24px_-12px_rgba(0,0,0,0.18)]"
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Message claudeai…"
          rows={1}
          disabled={disabled}
          className="focus-ring block w-full resize-none bg-transparent px-3 py-2 text-[15px] leading-[22px] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none"
        />
        <div className="flex items-center justify-between px-1 pt-1">
          <ModeSegment value={mode} onChange={updateMode} />
          {streaming ? (
            <button
              type="button"
              onClick={onStop}
              className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
              aria-label="Stop generating"
            >
              <Square className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={send}
              disabled={disabled || !text.trim()}
              className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-on-accent)] transition-opacity disabled:opacity-30"
              style={{ background: "var(--color-accent)" }}
              aria-label="Send message"
            >
              {disabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
      <p className="mt-1 px-1 text-center text-[11px] text-[var(--color-text-muted)]">
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  );
}

function ModeSegment({ value, onChange }: { value: ChatMode; onChange: (v: ChatMode) => void }) {
  const items: { id: ChatMode; label: string }[] = [
    { id: "normal", label: "Normal" },
    { id: "write", label: "Write" },
    { id: "code", label: "Code" },
  ];
  return (
    <div className="inline-flex rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-0.5 text-xs">
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onChange(it.id)}
          className={[
            "focus-ring rounded-[6px] px-2.5 py-1 transition-colors",
            value === it.id
              ? "bg-[var(--color-surface)] font-medium text-[var(--color-text)] shadow-sm"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
          ].join(" ")}
          aria-pressed={value === it.id}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
