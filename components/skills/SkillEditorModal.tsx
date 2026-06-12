"use client";

import { Upload, X } from "lucide-react";
import matter from "gray-matter";
import { useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/chat/Markdown";
import type { SkillDTO } from "@/lib/types";

type Mode = "create" | "edit";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function SkillEditorModal({
  mode,
  initial,
  onClose,
  onSaved,
}: {
  mode: Mode;
  initial?: SkillDTO;
  onClose: () => void;
  onSaved: (skill: SkillDTO) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initial));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!slugEdited && name) setSlug(slugify(name));
  }, [name, slugEdited]);

  async function importMd(file: File) {
    try {
      const text = await file.text();
      const parsed = matter(text);
      const fmName = typeof parsed.data?.name === "string" ? parsed.data.name : "";
      const fmDesc = typeof parsed.data?.description === "string" ? parsed.data.description : "";
      const fmSlug = typeof parsed.data?.slug === "string" ? parsed.data.slug : "";
      if (fmName) setName(fmName);
      if (fmDesc) setDescription(fmDesc);
      if (fmSlug) {
        setSlug(fmSlug);
        setSlugEdited(true);
      }
      setContent(parsed.content.trim());
    } catch (err) {
      setError(`Failed to parse SKILL.md: ${(err as Error).message}`);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function save() {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const url = mode === "edit" && initial ? `/api/skills/${initial._id}` : "/api/skills";
      const method = mode === "edit" ? "PATCH" : "POST";
      const body =
        mode === "edit"
          ? { name, description, content }
          : { name, slug, description, content };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed to save");
      onSaved(j.skill);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <header className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-3">
          <h2 className="font-display text-lg font-semibold">
            {mode === "edit" ? "Edit skill" : "New skill"}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="focus-ring inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1 text-xs hover:bg-[var(--color-surface)]"
            >
              <Upload className="h-3.5 w-3.5" /> SKILL.md
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".md"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && importMd(e.target.files[0])}
            />
            <button
              type="button"
              onClick={onClose}
              className="focus-ring rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-3 overflow-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="focus-ring w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                maxLength={120}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium">Slug</span>
              <input
                value={slug}
                onChange={(e) => {
                  setSlug(slugify(e.target.value));
                  setSlugEdited(true);
                }}
                disabled={mode === "edit"}
                className="focus-ring w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 font-mono text-xs disabled:opacity-60"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={600}
              className="focus-ring w-full resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
              placeholder="One sentence — what the skill teaches Claude."
            />
          </label>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm font-medium">Content (markdown)</span>
              <button
                type="button"
                onClick={() => setPreview((v) => !v)}
                className="focus-ring rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 text-xs"
              >
                {preview ? "Edit" : "Preview"}
              </button>
            </div>
            {preview ? (
              <div className="min-h-[300px] rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm">
                <Markdown>{content || "*(empty)*"}</Markdown>
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={14}
                maxLength={16000}
                className="focus-ring block w-full resize-y rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 font-mono text-xs leading-relaxed"
                placeholder={"# Skill playbook\n\nWhen the user invokes /<slug>, do X.\n\n## Rules\n- ..."}
              />
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <footer className="flex justify-end gap-2 border-t border-[var(--color-border)] px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm hover:bg-[var(--color-surface-2)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="focus-ring rounded-[var(--radius-btn)] px-4 py-2 text-sm font-medium text-[var(--color-on-accent)] disabled:opacity-50"
            style={{ background: "var(--color-accent)" }}
          >
            {busy ? "Saving…" : mode === "edit" ? "Save" : "Create"}
          </button>
        </footer>
      </div>
    </div>
  );
}
