"use client";

import { Markdown } from "./Markdown";
import { ArtifactCard } from "@/components/artifacts/ArtifactCard";
import type { ArtifactDTO, MessageDTO } from "@/lib/types";

export function MessageBubble({
  message,
  artifactMap,
  onOpenArtifact,
}: {
  message: MessageDTO;
  artifactMap?: Map<string, ArtifactDTO>;
  onOpenArtifact?: (identifier: string) => void;
}) {
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
        {renderAssistant(message.content, artifactMap, onOpenArtifact)}
      </div>
    </div>
  );
}

function renderAssistant(
  content: string,
  artifactMap?: Map<string, ArtifactDTO>,
  onOpenArtifact?: (identifier: string) => void,
) {
  if (!content) return <span className="text-sm text-[var(--color-text-muted)]">…</span>;

  // Split on [artifact:id] tokens; render markdown around them, ArtifactCard inline.
  const parts: React.ReactNode[] = [];
  const re = /\[artifact:([a-z0-9_-]+)\]/gi;
  let last = 0;
  let m: RegExpExecArray | null;
  let keyCounter = 0;
  while ((m = re.exec(content))) {
    const before = content.slice(last, m.index);
    if (before.trim()) {
      parts.push(<Markdown key={`md-${keyCounter++}`}>{before}</Markdown>);
    }
    const id = m[1];
    const artifact = artifactMap?.get(id);
    if (artifact) {
      parts.push(
        <ArtifactCard
          key={`art-${keyCounter++}`}
          artifact={artifact}
          onOpen={() => onOpenArtifact?.(id)}
        />,
      );
    } else {
      parts.push(
        <button
          key={`art-${keyCounter++}`}
          type="button"
          className="my-2 inline-flex items-center gap-2 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-xs text-[var(--color-text-muted)]"
          onClick={() => onOpenArtifact?.(id)}
        >
          Artifact: {id}
        </button>,
      );
    }
    last = m.index + m[0].length;
  }
  const tail = content.slice(last);
  if (tail) parts.push(<Markdown key={`md-${keyCounter++}`}>{tail}</Markdown>);
  return parts;
}
