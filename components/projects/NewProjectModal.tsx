"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { PROJECT_COLORS } from "@/lib/constants";

export function NewProjectModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState<string>(PROJECT_COLORS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, color }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to create project");
      }
      const { project } = await res.json();
      router.push(`/projects/${project._id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">New project</h2>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="focus-ring block w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
              placeholder="What is this project about?"
              maxLength={120}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="focus-ring block w-full resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
              placeholder="One sentence (optional)"
              maxLength={600}
            />
          </label>
          <div>
            <span className="mb-1 block text-sm font-medium">Colour</span>
            <div className="flex flex-wrap gap-2">
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                  className={[
                    "focus-ring h-7 w-7 rounded-full transition-transform",
                    c === color ? "ring-2 ring-offset-2 ring-offset-[var(--color-surface)]" : "",
                  ].join(" ")}
                  style={{ background: c, ...(c === color ? { boxShadow: `0 0 0 2px ${c}` } : {}) }}
                />
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="focus-ring rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm hover:bg-[var(--color-surface-2)]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="focus-ring rounded-[var(--radius-btn)] px-4 py-2 text-sm font-medium text-[var(--color-on-accent)] disabled:opacity-50"
              style={{ background: "var(--color-accent)" }}
            >
              {busy ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
