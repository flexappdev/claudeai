"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  MessageSquarePlus,
  MessagesSquare,
  Settings,
  Sparkles,
  Wrench,
  PanelLeftOpen,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

const COLLAPSED_KEY = "claudeai:sidebar:collapsed";

type RecentChat = { _id: string; title: string; updatedAt: string };
type RecentProject = { _id: string; name: string; color: string };

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

const NAV_ITEMS: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "Chats", href: "/recents", icon: MessagesSquare },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Artifacts", href: "/artifacts", icon: Sparkles },
];

const CUSTOMIZE_ITEMS: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "Skills OS", href: "/customize/skills", icon: Sparkles },
  { label: "Connectors", href: "/customize/connectors", icon: Wrench },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [recents, setRecents] = useState<RecentChat[]>([]);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);

  useEffect(() => {
    const v = window.localStorage.getItem(COLLAPSED_KEY);
    if (v === "1") setCollapsed(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/chats?limit=8")
      .then((r) => (r.ok ? r.json() : { chats: [] }))
      .then((d: { chats?: RecentChat[] }) => {
        if (!cancelled) setRecents(d.chats ?? []);
      })
      .catch(() => {
        if (!cancelled) setRecents([]);
      });
    fetch("/api/projects")
      .then((r) => (r.ok ? r.json() : { projects: [] }))
      .then((d: { projects?: RecentProject[] }) => {
        if (!cancelled) setRecentProjects((d.projects ?? []).slice(0, 5));
      })
      .catch(() => {
        if (!cancelled) setRecentProjects([]);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((v) => {
      const next = !v;
      window.localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  const newChat = useCallback(async () => {
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) return;
      const { chat } = (await res.json()) as { chat: { _id: string } };
      window.location.href = `/chat/${chat._id}`;
    } catch {
      window.location.href = "/chat";
    }
  }, []);

  const width = collapsed ? "w-16" : "w-[280px]";

  return (
    <>
      {/* Mobile burger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
        className="focus-ring fixed left-3 top-3 z-40 inline-flex items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-2 md:hidden"
      >
        <PanelLeftOpen className="h-5 w-5" />
      </button>

      {/* Backdrop on mobile */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={[
          "z-50 flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-all",
          width,
          "fixed inset-y-0 left-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:translate-x-0 md:sticky md:top-0 md:h-screen",
        ].join(" ")}
        aria-label="Primary"
      >
        <div className="flex items-center justify-between px-3 py-3">
          <Link href="/" className="flex items-center gap-2 px-1">
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-semibold text-[var(--color-on-accent)]"
              style={{ background: "var(--color-accent)" }}
            >
              c
            </span>
            {!collapsed && (
              <span className="font-display text-base font-semibold tracking-tight">claudeai</span>
            )}
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="focus-ring hidden h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] md:inline-flex"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <div className="px-3">
          <button
            type="button"
            onClick={newChat}
            className="focus-ring inline-flex w-full items-center gap-2 rounded-[var(--radius-btn)] px-3 py-2 text-sm font-medium"
            style={{ background: "var(--color-accent)", color: "var(--color-on-accent)" }}
          >
            <MessageSquarePlus className="h-4 w-4" />
            {!collapsed && <span>New chat</span>}
          </button>
        </div>

        <nav className="mt-4 flex-1 overflow-y-auto px-2">
          <SidebarSection label="Library" collapsed={collapsed}>
            {NAV_ITEMS.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                label={item.label}
                Icon={item.icon}
                active={pathname.startsWith(item.href)}
                collapsed={collapsed}
              />
            ))}
          </SidebarSection>

          <SidebarSection label="Customize" collapsed={collapsed}>
            {CUSTOMIZE_ITEMS.map((item) => (
              <SidebarLink
                key={item.href}
                href={item.href}
                label={item.label}
                Icon={item.icon}
                active={pathname.startsWith(item.href)}
                collapsed={collapsed}
              />
            ))}
          </SidebarSection>

          {!collapsed && recentProjects.length > 0 && (
            <SidebarSection label="Recent projects" collapsed={collapsed}>
              {recentProjects.map((p) => (
                <Link
                  key={p._id}
                  href={`/projects/${p._id}`}
                  className={[
                    "focus-ring group flex items-center gap-2 truncate rounded-md px-2 py-1.5 text-sm",
                    pathname === `/projects/${p._id}`
                      ? "bg-[var(--color-accent-tint)] text-[var(--color-text)]"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
                  ].join(" ")}
                >
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{ background: p.color }}
                  />
                  <span className="truncate">{p.name}</span>
                </Link>
              ))}
            </SidebarSection>
          )}

          {!collapsed && (
            <SidebarSection label="Recents" collapsed={collapsed}>
              {recents.length === 0 && (
                <p className="px-2 text-xs text-[var(--color-text-muted)]">No chats yet</p>
              )}
              {recents.map((c) => (
                <Link
                  key={c._id}
                  href={`/chat/${c._id}`}
                  className={[
                    "focus-ring group block truncate rounded-md px-2 py-1.5 text-sm",
                    pathname === `/chat/${c._id}`
                      ? "bg-[var(--color-accent-tint)] text-[var(--color-text)]"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
                  ].join(" ")}
                >
                  <span className="truncate">{c.title}</span>
                  <span className="ml-2 text-[10px] uppercase tracking-wider opacity-60">
                    {timeAgo(c.updatedAt)}
                  </span>
                </Link>
              ))}
            </SidebarSection>
          )}
        </nav>

        <div className="flex items-center justify-between gap-2 border-t border-[var(--color-border)] px-3 py-3">
          <Link
            href="/settings"
            className="focus-ring inline-flex items-center gap-2 rounded-[var(--radius-btn)] px-2 py-1.5 text-sm text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
            {!collapsed && <span>Settings</span>}
          </Link>
          <ThemeToggle collapsed={collapsed} />
        </div>
      </aside>
    </>
  );
}

function SidebarSection({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-3">
      {!collapsed && (
        <h3 className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
          {label}
        </h3>
      )}
      <div className="flex flex-col gap-0.5">{children}</div>
    </section>
  );
}

function SidebarLink({
  href,
  label,
  Icon,
  active,
  collapsed,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "focus-ring inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
        active
          ? "bg-[var(--color-accent-tint)] text-[var(--color-text)]"
          : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
      ].join(" ")}
      title={collapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}
