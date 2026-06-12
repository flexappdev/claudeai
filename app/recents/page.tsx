"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import { Search, Star } from "lucide-react";
import type { ChatDTO } from "@/lib/types";

type ListResponse = { chats: ChatDTO[]; nextCursor: string | null };
type Filter = "all" | "starred";

function dayBucket(iso: string): "today" | "yesterday" | "week" | "older" {
  const now = new Date();
  const d = new Date(iso);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startYday = startToday - 86400000;
  const startWeek = startToday - 7 * 86400000;
  const t = d.getTime();
  if (t >= startToday) return "today";
  if (t >= startYday) return "yesterday";
  if (t >= startWeek) return "week";
  return "older";
}

const BUCKET_LABEL: Record<string, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "Previous 7 days",
  older: "Older",
};

export default function RecentsPage() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const qs = new URLSearchParams();
  qs.set("limit", "50");
  if (debounced) qs.set("q", debounced);
  if (filter === "starred") qs.set("starred", "true");

  const { data, isLoading } = useSWR<ListResponse>(`/api/chats?${qs.toString()}`, fetcher);

  const grouped = useMemo(() => {
    const out: Record<string, ChatDTO[]> = { today: [], yesterday: [], week: [], older: [] };
    (data?.chats ?? []).forEach((c) => {
      out[dayBucket(c.updatedAt)].push(c);
    });
    return out;
  }, [data]);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="font-display text-3xl font-semibold">Chats</h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Everything you’ve discussed with claudeai, searchable.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title"
            className="focus-ring w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] py-2 pl-9 pr-3 text-sm placeholder:text-[var(--color-text-muted)]"
          />
        </label>
        <div className="inline-flex rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-0.5 text-xs">
          {[
            { id: "all" as const, label: "All" },
            { id: "starred" as const, label: "Starred" },
          ].map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => setFilter(it.id)}
              className={[
                "rounded-[6px] px-2.5 py-1 transition-colors",
                filter === it.id
                  ? "bg-[var(--color-surface)] font-medium text-[var(--color-text)] shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
              ].join(" ")}
              aria-pressed={filter === it.id}
            >
              {it.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-8">
        {isLoading && (
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-surface-2)]" />
            ))}
          </>
        )}
        {!isLoading && (data?.chats?.length ?? 0) === 0 && (
          <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] p-10 text-center">
            <p className="font-display text-lg">No chats yet</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Hit “New chat” in the sidebar to start one.
            </p>
          </div>
        )}
        {(["today", "yesterday", "week", "older"] as const).map((b) =>
          grouped[b].length === 0 ? null : (
            <section key={b}>
              <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                {BUCKET_LABEL[b]}
              </h2>
              <ul className="flex flex-col gap-1">
                {grouped[b].map((c) => (
                  <li key={c._id}>
                    <Link
                      href={`/chat/${c._id}`}
                      className="focus-ring group flex items-center gap-3 rounded-[var(--radius-btn)] border border-transparent px-3 py-2 hover:border-[var(--color-border)] hover:bg-[var(--color-surface)]"
                    >
                      {c.starred ? (
                        <Star className="h-4 w-4 shrink-0" color="var(--color-accent)" fill="currentColor" />
                      ) : (
                        <span className="h-4 w-4 shrink-0" />
                      )}
                      <span className="flex-1 truncate text-sm">{c.title}</span>
                      <span className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
                        {new Date(c.updatedAt).toLocaleString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ),
        )}
      </div>
    </div>
  );
}
