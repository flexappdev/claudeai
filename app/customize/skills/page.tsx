"use client";

import {
  Bot,
  Check,
  ChevronRight,
  CircleDot,
  Command,
  Copy,
  Database,
  Layers3,
  Plus,
  Search,
  Sparkles,
  TerminalSquare,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { SkillEditorModal } from "@/components/skills/SkillEditorModal";
import { fetcher } from "@/lib/swr";
import type { SkillIndexEntry, SkillPlatform } from "@/lib/types";

type PlatformFilter = "all" | SkillPlatform;
type IndexResponse = {
  skills: SkillIndexEntry[];
  definitions: number;
  databaseConnected: boolean;
  scannedAt: string;
};

const PLATFORM_KEY = "claudeai:skills-os:platform";

const PLATFORM_META: Record<SkillPlatform, { label: string; short: string; command: string }> = {
  claudeAi: { label: "Claude.ai", short: "AI", command: "/" },
  claudeCode: { label: "Claude Code", short: "CC", command: "/" },
  codex: { label: "Codex", short: "CX", command: "$" },
};

export default function SkillsPage() {
  const router = useRouter();
  const { data, error, mutate, isLoading } = useSWR<IndexResponse>("/api/skill-index", fetcher, {
    revalidateOnFocus: false,
  });
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [copied, setCopied] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(PLATFORM_KEY);
    if (stored === "claudeAi" || stored === "claudeCode" || stored === "codex") {
      // Hydrate the last command-deck selection from this browser.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlatform(stored);
    }
  }, []);

  function choosePlatform(next: PlatformFilter) {
    setPlatform(next);
    if (next === "all") window.localStorage.removeItem(PLATFORM_KEY);
    else window.localStorage.setItem(PLATFORM_KEY, next);
  }

  const categories = useMemo(
    () => ["All", ...new Set((data?.skills || []).map((skill) => skill.category))],
    [data],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (data?.skills || []).filter((skill) => {
      if (platform !== "all" && !skill.platforms[platform]) return false;
      if (category !== "All" && skill.category !== category) return false;
      if (!needle) return true;
      return [skill.name, skill.slug, skill.description, skill.category, ...skill.sources]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [category, data, platform, query]);

  const stats = useMemo(() => {
    const skills = data?.skills || [];
    return {
      canonical: skills.length,
      shared: skills.filter(
        (skill) => Object.values(skill.platforms).filter(Boolean).length > 1,
      ).length,
      enabled: skills.filter((skill) => skill.appEnabled).length,
    };
  }, [data]);

  async function copyInvocation(skill: SkillIndexEntry, target: SkillPlatform) {
    const invocation = `${PLATFORM_META[target].command}${skill.slug}`;
    await navigator.clipboard.writeText(invocation);
    setCopied(`${skill.slug}:${target}`);
    setNotice(`${invocation} copied for ${PLATFORM_META[target].label}`);
    window.setTimeout(() => setCopied(null), 1600);
  }

  async function handleUseSkill(skill: SkillIndexEntry) {
    const target = preferredPlatform(skill, platform);
    if (target !== "claudeAi") {
      await copyInvocation(skill, target);
      return;
    }

    setBusy(skill.slug);
    setNotice(null);
    try {
      const activation = await fetch("/api/skill-index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: skill.slug }),
      });
      if (!activation.ok) {
        const result = (await activation.json().catch(() => ({}))) as { error?: string };
        throw new Error(result.error || "Could not activate this skill");
      }
      const chatResponse = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `${skill.name} session` }),
      });
      if (!chatResponse.ok) throw new Error("Skill enabled, but a chat could not be opened");
      const { chat } = (await chatResponse.json()) as { chat: { _id: string } };
      await mutate();
      router.push(`/chat/${chat._id}?draft=${encodeURIComponent(`/${skill.slug} `)}`);
    } catch (err) {
      setNotice((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="skills-os min-h-full w-full overflow-hidden">
      <section className="relative border-b border-[var(--color-border)] px-5 pb-7 pt-9 sm:px-8 lg:px-10">
        <div className="skills-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-accent)]">
                <CircleDot className="h-3.5 w-3.5" />
                Master capability index · live filesystem scan
              </div>
              <h1 className="font-display text-4xl font-semibold leading-[0.98] sm:text-5xl">
                Skills <span className="text-[var(--color-accent)]">OS</span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)] sm:text-base">
                One command deck for Claude.ai, Claude Code, and Codex. Pick a platform,
                find the playbook, then switch it on or copy its native invocation.
              </p>
            </div>
            <div className="grid grid-cols-3 overflow-hidden rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
              <Metric label="Canonical" value={stats.canonical} />
              <Metric label="Definitions" value={data?.definitions || 0} />
              <Metric label="Cross-platform" value={stats.shared} />
            </div>
          </div>

          <div className="mt-8 grid gap-2 md:grid-cols-4">
            <PlatformButton
              active={platform === "all"}
              icon={<Layers3 className="h-4 w-4" />}
              label="Everything"
              detail={`${stats.canonical} deduplicated skills`}
              onClick={() => choosePlatform("all")}
            />
            <PlatformButton
              active={platform === "claudeAi"}
              icon={<Sparkles className="h-4 w-4" />}
              label="Claude.ai"
              detail={`${countPlatform(data, "claudeAi")} local/catalogue · ${stats.enabled} on`}
              onClick={() => choosePlatform("claudeAi")}
            />
            <PlatformButton
              active={platform === "claudeCode"}
              icon={<TerminalSquare className="h-4 w-4" />}
              label="Claude Code"
              detail={`${countPlatform(data, "claudeCode")} discovered`}
              onClick={() => choosePlatform("claudeCode")}
            />
            <PlatformButton
              active={platform === "codex"}
              icon={<Bot className="h-4 w-4" />}
              label="Codex"
              detail={`${countPlatform(data, "codex")} discovered`}
              onClick={() => choosePlatform("codex")}
            />
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-6 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex min-w-0 flex-1 items-center">
            <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-[var(--color-text-muted)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search skills, commands, sources…"
              className="focus-ring h-11 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-4 text-sm outline-none placeholder:text-[var(--color-text-muted)]"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:max-w-[54%] lg:pb-0">
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setCategory(item)}
                className={[
                  "focus-ring shrink-0 rounded-full border px-3 py-2 text-xs transition-colors",
                  category === item
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-tint)] text-[var(--color-accent)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
                ].join(" ")}
              >
                {item}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setEditorOpen(true)}
            className="focus-ring inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-btn)] bg-[var(--color-text)] px-4 text-sm font-medium text-[var(--color-surface)]"
          >
            <Plus className="h-4 w-4" />
            New skill
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
          <span>{visible.length} results · duplicates merged by skill slug</span>
          <span className="inline-flex items-center gap-1.5">
            <Database className="h-3 w-3" />
            {data?.databaseConnected ? "Library connected" : "Filesystem-only mode"}
          </span>
        </div>

        {notice && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-[var(--radius-btn)] border border-[var(--color-accent)] bg-[var(--color-accent-tint)] px-3 py-2 text-xs text-[var(--color-accent)]">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notice">×</button>
          </div>
        )}

        {isLoading && <SkillSkeleton />}
        {error && (
          <div className="mt-8 rounded-[var(--radius-card)] border border-red-300 bg-red-50 p-5 text-sm text-red-700">
            The master index could not be scanned. {error.message}
          </div>
        )}
        {data && visible.length === 0 && (
          <div className="mt-8 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] p-12 text-center">
            <Command className="mx-auto h-6 w-6 text-[var(--color-text-muted)]" />
            <h2 className="mt-3 font-display text-xl">No matching command</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Clear a filter or try a broader search.</p>
          </div>
        )}

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((skill, index) => {
            const target = preferredPlatform(skill, platform);
            const copyKey = `${skill.slug}:${target}`;
            return (
              <article
                key={skill.slug}
                className="skill-index-card group flex min-h-56 flex-col rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                style={{ animationDelay: `${Math.min(index, 12) * 24}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--color-accent)]">{skill.category}</span>
                    <h2 className="mt-1 truncate font-display text-lg font-semibold">{skill.name}</h2>
                  </div>
                  <PlatformMarks platforms={skill.platforms} enabled={skill.appEnabled} />
                </div>
                <p className="mt-3 line-clamp-3 text-xs leading-5 text-[var(--color-text-muted)]">
                  {skill.description || "Reusable agent playbook discovered in your local skills ecosystem."}
                </p>
                <div className="mt-auto pt-4">
                  <div className="mb-3 flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-3">
                    <code className="truncate text-[11px] text-[var(--color-text-muted)]">
                      {PLATFORM_META[target].command}{skill.slug}
                    </code>
                    <span className="shrink-0 text-[10px] text-[var(--color-text-muted)]">
                      {skill.definitions > 1 ? `${skill.definitions} sources` : skill.sources[0]}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy === skill.slug}
                      onClick={() => handleUseSkill(skill)}
                      className="focus-ring inline-flex flex-1 items-center justify-between rounded-[var(--radius-btn)] bg-[var(--color-accent)] px-3 py-2 text-xs font-medium text-[var(--color-on-accent)] disabled:opacity-50"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5" />
                        {actionLabel(skill, target, busy === skill.slug)}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => copyInvocation(skill, target)}
                      className="focus-ring inline-flex w-9 items-center justify-center rounded-[var(--radius-btn)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
                      aria-label={`Copy ${skill.slug} invocation`}
                    >
                      {copied === copyKey ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </main>

      {editorOpen && (
        <SkillEditorModal
          mode="create"
          onClose={() => setEditorOpen(false)}
          onSaved={() => {
            setEditorOpen(false);
            void mutate();
          }}
        />
      )}
    </div>
  );
}

function preferredPlatform(skill: SkillIndexEntry, selected: PlatformFilter): SkillPlatform {
  if (selected !== "all" && skill.platforms[selected]) return selected;
  if (skill.platforms.claudeAi) return "claudeAi";
  if (skill.platforms.claudeCode) return "claudeCode";
  return "codex";
}

function countPlatform(data: IndexResponse | undefined, platform: SkillPlatform) {
  return (data?.skills || []).filter((skill) => skill.platforms[platform]).length;
}

function actionLabel(skill: SkillIndexEntry, platform: SkillPlatform, busy: boolean) {
  if (busy) return "Switching on…";
  if (platform === "claudeAi") return skill.appEnabled ? "Open with skill" : "Switch on here";
  return `Use in ${PLATFORM_META[platform].short}`;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-24 border-r border-[var(--color-border)] px-4 py-3 last:border-r-0">
      <strong className="block font-mono text-xl font-medium tabular-nums">{value}</strong>
      <span className="mt-0.5 block text-[9px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">{label}</span>
    </div>
  );
}

function PlatformButton({ active, icon, label, detail, onClick }: { active: boolean; icon: React.ReactNode; label: string; detail: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "focus-ring group flex items-center gap-3 rounded-[var(--radius-card)] border p-3 text-left transition-all",
        active
          ? "border-[var(--color-accent)] bg-[var(--color-surface)] shadow-sm"
          : "border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_72%,transparent)] hover:bg-[var(--color-surface)]",
      ].join(" ")}
    >
      <span className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-[10px]",
        active ? "bg-[var(--color-accent)] text-white" : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)]",
      ].join(" ")}>{icon}</span>
      <span className="min-w-0">
        <strong className="block truncate text-sm font-medium">{label}</strong>
        <span className="block truncate text-[10px] text-[var(--color-text-muted)]">{detail}</span>
      </span>
    </button>
  );
}

function PlatformMarks({ platforms, enabled }: { platforms: SkillIndexEntry["platforms"]; enabled: boolean }) {
  return (
    <div className="flex shrink-0 gap-1" aria-label="Available platforms">
      {(Object.keys(PLATFORM_META) as SkillPlatform[]).map((platform) => (
        <span
          key={platform}
          title={PLATFORM_META[platform].label}
          className={[
            "inline-flex h-6 min-w-6 items-center justify-center rounded-md border px-1 font-mono text-[8px] font-semibold",
            platforms[platform]
              ? platform === "claudeAi" && enabled
                ? "border-emerald-500 bg-emerald-500 text-white"
                : "border-[var(--color-accent)] bg-[var(--color-accent-tint)] text-[var(--color-accent)]"
              : "border-[var(--color-border)] text-[var(--color-text-muted)] opacity-35",
          ].join(" ")}
        >
          {PLATFORM_META[platform].short}
        </span>
      ))}
    </div>
  );
}

function SkillSkeleton() {
  return (
    <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="h-56 animate-pulse rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="h-4 w-28 rounded bg-[var(--color-surface-2)]" />
          <div className="mt-4 h-3 w-full rounded bg-[var(--color-surface-2)]" />
          <div className="mt-2 h-3 w-3/4 rounded bg-[var(--color-surface-2)]" />
        </div>
      ))}
    </div>
  );
}
