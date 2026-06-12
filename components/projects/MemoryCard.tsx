"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import type { ProjectDTO } from "@/lib/types";

export function MemoryCard({
  project,
  onRefreshed,
}: {
  project: ProjectDTO;
  onRefreshed: (memory: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project._id}/memory/refresh`, { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Refresh failed");
      onRefreshed(j.memory);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Memory</h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Rolling summary of past chats in this project. Read-only — refresh to regenerate.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={busy}
          className="focus-ring inline-flex items-center gap-1 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs hover:bg-[var(--color-surface-2)] disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
          {busy ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {project.memory ? (
        <div className="whitespace-pre-wrap rounded-[var(--radius-btn)] bg-[var(--color-surface-2)] p-3 text-sm leading-relaxed text-[var(--color-text)]">
          {project.memory}
        </div>
      ) : (
        <div className="rounded-[var(--radius-btn)] border border-dashed border-[var(--color-border)] p-4 text-center text-xs text-[var(--color-text-muted)]">
          No memory yet. Click Refresh after you have a few chats in this project.
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
