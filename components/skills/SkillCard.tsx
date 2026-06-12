"use client";

import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { SkillDTO } from "@/lib/types";

export function SkillCard({
  skill,
  onToggle,
  onOpen,
  onEdit,
  onDelete,
}: {
  skill: SkillDTO;
  onToggle: (enabled: boolean) => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menu]);

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 transition-colors hover:bg-[var(--color-surface-2)]">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="focus-ring -m-1 flex-1 truncate rounded-md p-1 text-left text-sm font-semibold"
        >
          {skill.name}
        </button>
        <div className="flex items-center gap-1">
          <span
            className={[
              "rounded-md border px-1.5 py-0.5 text-[10px] uppercase tracking-wide",
              skill.source === "builtin"
                ? "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
                : "border-[var(--color-accent)] bg-[var(--color-accent-tint)] text-[var(--color-accent)]",
            ].join(" ")}
          >
            {skill.source}
          </span>
          <div className="relative" ref={ref}>
            <button
              type="button"
              onClick={() => setMenu((v) => !v)}
              className="focus-ring inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
              aria-label="Skill menu"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menu && (
              <div className="absolute right-0 top-9 z-30 w-36 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    onOpen();
                    setMenu(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-xs hover:bg-[var(--color-surface-2)]"
                >
                  View
                </button>
                {skill.source === "user" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onEdit();
                        setMenu(false);
                      }}
                      className="block w-full border-t border-[var(--color-border)] px-3 py-1.5 text-left text-xs hover:bg-[var(--color-surface-2)]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDelete();
                        setMenu(false);
                      }}
                      className="block w-full border-t border-[var(--color-border)] px-3 py-1.5 text-left text-xs text-red-600 hover:bg-[var(--color-surface-2)]"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="line-clamp-2 text-xs text-[var(--color-text-muted)]">{skill.description || "—"}</p>
      <div className="flex items-center justify-between">
        <code className="font-mono text-[11px] text-[var(--color-text-muted)]">/{skill.slug}</code>
        <Switch checked={skill.enabled} onChange={onToggle} />
      </div>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        "focus-ring inline-flex h-5 w-9 items-center rounded-full p-0.5 transition-colors",
        checked ? "" : "bg-[var(--color-border)]",
      ].join(" ")}
      style={checked ? { background: "var(--color-accent)" } : undefined}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
        style={{ transform: checked ? "translateX(16px)" : "translateX(0)" }}
      />
    </button>
  );
}
