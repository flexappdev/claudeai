"use client";

import Link from "next/link";
import { MessagesSquare } from "lucide-react";

export function ProjectCard({
  project,
}: {
  project: {
    _id: string;
    name: string;
    description: string;
    color: string;
    updatedAt: string;
    chatCount?: number;
  };
}) {
  return (
    <Link
      href={`/projects/${project._id}`}
      className="focus-ring group flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:bg-[var(--color-surface-2)]"
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: project.color }}
        />
        <h3 className="truncate text-sm font-semibold text-[var(--color-text)]">{project.name}</h3>
      </div>
      {project.description && (
        <p className="line-clamp-2 text-xs text-[var(--color-text-muted)]">{project.description}</p>
      )}
      <div className="mt-auto flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
        <span className="inline-flex items-center gap-1">
          <MessagesSquare className="h-3 w-3" />
          {project.chatCount ?? 0} chats
        </span>
        <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
      </div>
    </Link>
  );
}
