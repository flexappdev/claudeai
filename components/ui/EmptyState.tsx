import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  cta,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  cta?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-10 text-center">
      <span
        className="inline-flex h-12 w-12 items-center justify-center rounded-full"
        style={{ background: "var(--color-accent-tint)", color: "var(--color-accent)" }}
      >
        <Icon className="h-6 w-6" />
      </span>
      <p className="mt-4 font-display text-lg font-semibold">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-md text-sm text-[var(--color-text-muted)]">{description}</p>
      )}
      {cta && <div className="mt-5">{cta}</div>}
    </div>
  );
}
