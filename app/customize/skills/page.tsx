"use client";

import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import { SkillCard } from "@/components/skills/SkillCard";
import { SkillDrawer } from "@/components/skills/SkillDrawer";
import { SkillEditorModal } from "@/components/skills/SkillEditorModal";
import type { SkillDTO } from "@/lib/types";

type ListResponse = { skills: SkillDTO[] };
type Tab = "all" | "enabled" | "mine";

export default function SkillsPage() {
  const { data, mutate } = useSWR<ListResponse>("/api/skills", fetcher);
  const [tab, setTab] = useState<Tab>("all");
  const [drawer, setDrawer] = useState<SkillDTO | null>(null);
  const [editor, setEditor] = useState<{ mode: "create" | "edit"; initial?: SkillDTO } | null>(null);

  // Auto-seed builtins on first visit if none exist.
  useEffect(() => {
    if (!data) return;
    const hasBuiltins = data.skills.some((s) => s.source === "builtin");
    if (!hasBuiltins) {
      void fetch("/api/skills/seed", { method: "POST" }).then(() => mutate());
    }
  }, [data, mutate]);

  const visible = useMemo(() => {
    const list = data?.skills ?? [];
    if (tab === "enabled") return list.filter((s) => s.enabled);
    if (tab === "mine") return list.filter((s) => s.source === "user");
    return list;
  }, [data, tab]);

  async function toggle(skill: SkillDTO, enabled: boolean) {
    const optimistic = data
      ? { skills: data.skills.map((s) => (s._id === skill._id ? { ...s, enabled } : s)) }
      : data;
    void mutate(optimistic, { revalidate: false });
    const res = await fetch(`/api/skills/${skill._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    if (!res.ok) void mutate();
  }

  async function remove(skill: SkillDTO) {
    if (!confirm(`Delete skill "${skill.name}"? Cannot be undone.`)) return;
    const res = await fetch(`/api/skills/${skill._id}`, { method: "DELETE" });
    if (res.ok) void mutate();
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Skills</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Skills teach Claude your way of working. Enabled skills inject their description
            into every chat; mentioned skills inject their full playbook.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditor({ mode: "create" })}
          className="focus-ring inline-flex items-center gap-1.5 rounded-[var(--radius-btn)] px-3 py-2 text-sm font-medium text-[var(--color-on-accent)]"
          style={{ background: "var(--color-accent)" }}
        >
          <Plus className="h-4 w-4" />
          Create skill
        </button>
      </div>

      <div className="mt-6 inline-flex rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-0.5 text-sm">
        {(
          [
            { id: "all" as const, label: "All" },
            { id: "enabled" as const, label: "Enabled" },
            { id: "mine" as const, label: "My skills" },
          ] as const
        ).map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => setTab(it.id)}
            className={[
              "rounded-[6px] px-3 py-1.5",
              tab === it.id
                ? "bg-[var(--color-surface)] font-medium shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
            ].join(" ")}
            aria-pressed={tab === it.id}
          >
            {it.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {!data &&
          [0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-surface-2)]"
            />
          ))}
        {data && visible.length === 0 && (
          <div className="col-span-full rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] p-10 text-center">
            <p className="font-display text-lg">
              {tab === "enabled"
                ? "No enabled skills"
                : tab === "mine"
                ? "No user skills yet"
                : "No skills"}
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {tab === "enabled"
                ? "Toggle a skill on to inject it into every chat."
                : "Create one — or upload a SKILL.md with frontmatter."}
            </p>
          </div>
        )}
        {visible.map((s) => (
          <SkillCard
            key={s._id}
            skill={s}
            onToggle={(enabled) => toggle(s, enabled)}
            onOpen={() => setDrawer(s)}
            onEdit={() => setEditor({ mode: "edit", initial: s })}
            onDelete={() => remove(s)}
          />
        ))}
      </div>

      {drawer && (
        <SkillDrawer
          skill={drawer}
          onClose={() => setDrawer(null)}
          onToggle={(enabled) => {
            void toggle(drawer, enabled);
            setDrawer({ ...drawer, enabled });
          }}
        />
      )}

      {editor && (
        <SkillEditorModal
          mode={editor.mode}
          initial={editor.initial}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            void mutate();
          }}
        />
      )}
    </div>
  );
}
