"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquarePlus,
  MessagesSquare,
  Plug,
  Search,
  Sparkles,
  Sun,
  FolderKanban,
} from "lucide-react";
import { useTheme } from "@/components/shell/ThemeProvider";

type Item = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
};

type ChatLite = { _id: string; title: string };
type ProjectLite = { _id: string; name: string };
type SkillLite = { _id: string; slug: string; name: string };

export function CommandPalette() {
  const router = useRouter();
  const { toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [chats, setChats] = useState<ChatLite[]>([]);
  const [projects, setProjects] = useState<ProjectLite[]>([]);
  const [skills, setSkills] = useState<SkillLite[]>([]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (mod && e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        void newChat();
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    Promise.all([
      fetch("/api/chats?limit=20").then((r) => (r.ok ? r.json() : { chats: [] })),
      fetch("/api/projects").then((r) => (r.ok ? r.json() : { projects: [] })),
      fetch("/api/skills").then((r) => (r.ok ? r.json() : { skills: [] })),
    ])
      .then(([c, p, s]) => {
        setChats(c.chats ?? []);
        setProjects(p.projects ?? []);
        setSkills(s.skills ?? []);
      })
      .catch(() => undefined);
  }, [open]);

  async function newChat() {
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const { chat } = await res.json();
        router.push(`/chat/${chat._id}`);
      }
    } finally {
      setOpen(false);
    }
  }

  const items: Item[] = useMemo(() => {
    const list: Item[] = [
      {
        id: "new-chat",
        label: "New chat",
        hint: "⌘⇧O",
        icon: MessageSquarePlus,
        run: () => void newChat(),
      },
      {
        id: "toggle-theme",
        label: "Toggle theme",
        icon: Sun,
        run: () => {
          toggle();
          setOpen(false);
        },
      },
      {
        id: "projects",
        label: "Projects",
        icon: FolderKanban,
        run: () => {
          router.push("/projects");
          setOpen(false);
        },
      },
      {
        id: "artifacts",
        label: "Artifacts",
        icon: Sparkles,
        run: () => {
          router.push("/artifacts");
          setOpen(false);
        },
      },
      {
        id: "skills",
        label: "Skills",
        icon: Sparkles,
        run: () => {
          router.push("/customize/skills");
          setOpen(false);
        },
      },
      {
        id: "connectors",
        label: "Connectors",
        icon: Plug,
        run: () => {
          router.push("/customize/connectors");
          setOpen(false);
        },
      },
    ];
    chats.forEach((c) =>
      list.push({
        id: `chat-${c._id}`,
        label: c.title,
        hint: "Chat",
        icon: MessagesSquare,
        run: () => {
          router.push(`/chat/${c._id}`);
          setOpen(false);
        },
      }),
    );
    projects.forEach((p) =>
      list.push({
        id: `project-${p._id}`,
        label: p.name,
        hint: "Project",
        icon: FolderKanban,
        run: () => {
          router.push(`/projects/${p._id}`);
          setOpen(false);
        },
      }),
    );
    skills.forEach((s) =>
      list.push({
        id: `skill-${s._id}`,
        label: s.name,
        hint: `/${s.slug}`,
        icon: Sparkles,
        run: () => {
          router.push(`/customize/skills`);
          setOpen(false);
        },
      }),
    );
    return list;
  }, [chats, projects, skills, router, toggle]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 30);
    return items
      .filter((it) => it.label.toLowerCase().includes(q) || it.hint?.toLowerCase().includes(q))
      .slice(0, 30);
  }, [items, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 pt-[10vh]">
      <div className="w-full max-w-xl overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-3 py-2">
          <Search className="h-4 w-4 text-[var(--color-text-muted)]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats, projects, skills, actions…"
            className="flex-1 bg-transparent text-sm placeholder:text-[var(--color-text-muted)] focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && filtered[0]) filtered[0].run();
            }}
          />
          <kbd className="rounded border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] text-[var(--color-text-muted)]">
            Esc
          </kbd>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto py-1">
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-[var(--color-text-muted)]">
              No matches
            </li>
          )}
          {filtered.map((it) => (
            <li key={it.id}>
              <button
                type="button"
                onClick={it.run}
                className="focus-ring flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-[var(--color-surface-2)]"
              >
                <it.icon className="h-4 w-4 text-[var(--color-text-muted)]" />
                <span className="flex-1 truncate">{it.label}</span>
                {it.hint && (
                  <span className="text-[11px] text-[var(--color-text-muted)]">{it.hint}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
