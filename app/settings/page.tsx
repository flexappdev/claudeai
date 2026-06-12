"use client";

import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { MODELS, DEFAULT_MODEL, type ModelId } from "@/lib/constants";

const MODEL_KEY = "claudeai:model";

export default function SettingsPage() {
  const [model, setModel] = useState<ModelId>(DEFAULT_MODEL);

  useEffect(() => {
    const stored = window.localStorage.getItem(MODEL_KEY) as ModelId | null;
    if (stored && MODELS.some((m) => m.id === stored)) setModel(stored);
  }, []);

  const updateModel = (id: ModelId) => {
    setModel(id);
    window.localStorage.setItem(MODEL_KEY, id);
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="font-display text-3xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-1 text-[var(--color-text-muted)]">
        Local-only preferences. No account, single-user v1.
      </p>

      <section className="mt-10">
        <h2 className="text-base font-semibold">Appearance</h2>
        <div className="mt-3 flex items-center justify-between rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <div>
            <div className="text-sm font-medium">Theme</div>
            <div className="text-xs text-[var(--color-text-muted)]">
              Light or dark — saved to this browser.
            </div>
          </div>
          <ThemeToggle />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold">Default model</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => updateModel(m.id)}
              className={[
                "focus-ring rounded-[var(--radius-card)] border px-4 py-3 text-left transition-colors",
                model === m.id
                  ? "border-transparent bg-[var(--color-accent-tint)] text-[var(--color-text)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)]",
              ].join(" ")}
            >
              <div className="text-sm font-medium">{m.label}</div>
              <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">{m.description}</div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-semibold">Build</h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          See <code className="font-mono text-xs">docs/GOAL.md</code> and{" "}
          <code className="font-mono text-xs">docs/BUILD-PLAN.md</code> in the repo for the 8-session
          delivery plan.
        </p>
      </section>
    </div>
  );
}
