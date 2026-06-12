"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus } from "lucide-react";
import { fetcher } from "@/lib/swr";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { NewProjectModal } from "@/components/projects/NewProjectModal";
import type { ProjectDTO } from "@/lib/types";

type ProjectWithCount = ProjectDTO & { chatCount?: number };
type ListResponse = { projects: ProjectWithCount[] };

export default function ProjectsPage() {
  const { data, isLoading } = useSWR<ListResponse>("/api/projects", fetcher);
  const [modal, setModal] = useState(false);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Projects</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Group chats by topic, attach knowledge files, set custom instructions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal(true)}
          className="focus-ring inline-flex items-center gap-1.5 rounded-[var(--radius-btn)] px-3 py-2 text-sm font-medium text-[var(--color-on-accent)]"
          style={{ background: "var(--color-accent)" }}
        >
          <Plus className="h-4 w-4" />
          New project
        </button>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading &&
          [0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-surface-2)]"
            />
          ))}
        {!isLoading && (data?.projects?.length ?? 0) === 0 && (
          <div className="col-span-full rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] p-10 text-center">
            <p className="font-display text-lg">No projects yet</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Group your chats and give them shared context.
            </p>
            <button
              type="button"
              onClick={() => setModal(true)}
              className="focus-ring mt-4 inline-flex items-center gap-1.5 rounded-[var(--radius-btn)] px-3 py-2 text-sm font-medium text-[var(--color-on-accent)]"
              style={{ background: "var(--color-accent)" }}
            >
              <Plus className="h-4 w-4" />
              New project
            </button>
          </div>
        )}
        {data?.projects?.map((p) => (
          <ProjectCard key={p._id} project={p} />
        ))}
      </div>

      {modal && <NewProjectModal onClose={() => setModal(false)} />}
    </div>
  );
}
