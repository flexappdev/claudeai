"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ArrowLeft, MessageSquarePlus, Trash2 } from "lucide-react";
import { fetcher } from "@/lib/swr";
import { FileDropzone } from "@/components/projects/FileDropzone";
import { InstructionsEditor } from "@/components/projects/InstructionsEditor";
import { MemoryCard } from "@/components/projects/MemoryCard";
import { PROJECT_FILE_LIMITS } from "@/lib/constants";
import type { ProjectDTO, ProjectFileDTO } from "@/lib/types";

type ProjectResponse = {
  project: ProjectDTO;
  files: ProjectFileDTO[];
  chats: { _id: string; title: string; starred: boolean; updatedAt: string }[];
};

type Tab = "chats" | "knowledge" | "instructions";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data, error, mutate } = useSWR<ProjectResponse>(`/api/projects/${id}`, fetcher);
  const [tab, setTab] = useState<Tab>("chats");
  const [files, setFiles] = useState<ProjectFileDTO[] | null>(null);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-10 text-center">
        <h2 className="font-display text-2xl">Project not found</h2>
        <Link
          href="/projects"
          className="focus-ring mt-6 inline-flex items-center rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm"
        >
          Back to projects
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="h-8 w-1/2 animate-pulse rounded-md bg-[var(--color-surface-2)]" />
        <div className="mt-6 h-32 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-surface-2)]" />
      </div>
    );
  }

  const project = data.project;
  const fileList = files ?? data.files;

  async function newChatInProject() {
    const res = await fetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: id }),
    });
    if (res.ok) {
      const { chat } = await res.json();
      router.push(`/chat/${chat._id}`);
    }
  }

  async function deleteProject() {
    if (!confirm("Delete this project? Chats will be orphaned (kept) but the project + files are removed.")) return;
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/projects");
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      <Link
        href="/projects"
        className="focus-ring inline-flex items-center gap-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All projects
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: project.color }}
          />
          <div>
            <h1 className="font-display text-2xl font-semibold">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-[var(--color-text-muted)]">{project.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={newChatInProject}
            className="focus-ring inline-flex items-center gap-1.5 rounded-[var(--radius-btn)] px-3 py-2 text-sm font-medium text-[var(--color-on-accent)]"
            style={{ background: "var(--color-accent)" }}
          >
            <MessageSquarePlus className="h-4 w-4" />
            New chat
          </button>
          <button
            type="button"
            onClick={deleteProject}
            className="focus-ring inline-flex items-center gap-1.5 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-red-600 hover:bg-[var(--color-surface-2)]"
            aria-label="Delete project"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 inline-flex rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-0.5 text-sm">
        {(["chats", "knowledge", "instructions"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={[
              "rounded-[6px] px-3 py-1.5 capitalize",
              tab === t
                ? "bg-[var(--color-surface)] font-medium shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
            ].join(" ")}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === "chats" && (
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
            {data.chats.length === 0 ? (
              <div className="p-10 text-center text-sm text-[var(--color-text-muted)]">
                No chats yet in this project. Use “New chat” above to start one.
              </div>
            ) : (
              <ul className="divide-y divide-[var(--color-border)]">
                {data.chats.map((c) => (
                  <li key={c._id}>
                    <Link
                      href={`/chat/${c._id}`}
                      className="focus-ring flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-[var(--color-surface-2)]"
                    >
                      <span className="truncate">{c.title}</span>
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        {new Date(c.updatedAt).toLocaleString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {tab === "knowledge" && (
          <FileDropzone
            projectId={id}
            files={fileList}
            capacity={{ maxFiles: PROJECT_FILE_LIMITS.maxFiles }}
            onUploaded={(f) => setFiles([f, ...fileList])}
            onDeleted={(fid) => setFiles(fileList.filter((x) => x._id !== fid))}
          />
        )}

        {tab === "instructions" && (
          <div className="flex flex-col gap-4">
            <InstructionsEditor
              project={project}
              onSaved={(p) => mutate({ ...data, project: p }, { revalidate: false })}
            />
            <MemoryCard
              project={project}
              onRefreshed={(memory) =>
                mutate({ ...data, project: { ...project, memory } }, { revalidate: false })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
