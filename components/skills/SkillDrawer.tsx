"use client";

import { X } from "lucide-react";
import { Markdown } from "@/components/chat/Markdown";
import type { SkillDTO } from "@/lib/types";

export function SkillDrawer({
  skill,
  onToggle,
  onClose,
}: {
  skill: SkillDTO;
  onToggle: (enabled: boolean) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 p-0 sm:p-4">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-none border border-[var(--color-border)] bg-[var(--color-surface)] sm:rounded-[var(--radius-card)]">
        <header className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-lg font-semibold">{skill.name}</h2>
            <p className="truncate text-xs text-[var(--color-text-muted)]">
              /{skill.slug} · {skill.source}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onToggle(!skill.enabled)}
            className="focus-ring rounded-[var(--radius-btn)] px-3 py-1.5 text-xs font-medium"
            style={
              skill.enabled
                ? { background: "var(--color-accent)", color: "var(--color-on-accent)" }
                : { background: "var(--color-surface-2)", color: "var(--color-text)" }
            }
          >
            {skill.enabled ? "Enabled" : "Enable"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-auto px-5 py-4">
          {skill.description && (
            <p className="mb-4 text-sm text-[var(--color-text-muted)]">{skill.description}</p>
          )}
          <Markdown>{skill.content}</Markdown>
        </div>
      </div>
    </div>
  );
}
