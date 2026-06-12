"use client";

import { useEffect, useState } from "react";
import type { ProjectDTO } from "@/lib/types";

export function InstructionsEditor({
  project,
  onSaved,
}: {
  project: ProjectDTO;
  onSaved: (p: ProjectDTO) => void;
}) {
  const [draft, setDraft] = useState(project.instructions);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => setDraft(project.instructions), [project.instructions]);

  const dirty = draft !== project.instructions;

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions: draft }),
      });
      if (res.ok) {
        const { project: p } = await res.json();
        onSaved(p);
        setSavedAt(Date.now());
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Instructions</h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            Injected into every chat in this project. Plain text or markdown.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {savedAt && !dirty && (
            <span className="text-[11px] text-[var(--color-text-muted)]">
              Saved {new Date(savedAt).toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={save}
            disabled={!dirty || saving}
            className="focus-ring rounded-[var(--radius-btn)] px-3 py-1.5 text-xs font-medium text-[var(--color-on-accent)] disabled:opacity-40"
            style={{ background: "var(--color-accent)" }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={10}
        maxLength={8000}
        className="focus-ring block w-full resize-y rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 font-mono text-xs leading-relaxed"
        placeholder={`e.g. "Always respond in British English. Cite sources inline. Default to bullet points unless asked for prose."`}
      />
      <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
        {draft.length.toLocaleString()} / 8,000 chars
      </p>
    </div>
  );
}
