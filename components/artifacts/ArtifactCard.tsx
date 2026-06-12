"use client";

import { Code, FileText, Globe, Hexagon, ImageIcon, Sparkles } from "lucide-react";
import type { ArtifactDTO } from "@/lib/types";

const ICONS: Record<ArtifactDTO["type"], React.ComponentType<{ className?: string }>> = {
  code: Code,
  markdown: FileText,
  html: Globe,
  react: Sparkles,
  svg: ImageIcon,
  mermaid: Hexagon,
};

export function ArtifactCard({
  artifact,
  onOpen,
}: {
  artifact: ArtifactDTO;
  onOpen?: () => void;
}) {
  const Icon = ICONS[artifact.type] ?? Code;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="focus-ring my-2 inline-flex w-full items-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-2)]"
    >
      <span
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
        style={{ background: "var(--color-accent-tint)", color: "var(--color-accent)" }}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">{artifact.title}</span>
        <span className="truncate text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
          {artifact.type}
          {artifact.language ? ` · ${artifact.language}` : ""} · v{artifact.version}
        </span>
      </span>
    </button>
  );
}
