"use client";

import { ChevronRight, Wrench } from "lucide-react";
import { useState } from "react";

export type ToolCall = {
  toolName: string;
  input?: unknown;
  output?: unknown;
};

export function ToolCallChip({ call }: { call: ToolCall }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-2 overflow-hidden rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface-2)] text-xs">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="focus-ring flex w-full items-center gap-2 px-3 py-1.5 text-left text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]"
      >
        <Wrench className="h-3.5 w-3.5" />
        <span className="flex-1 font-mono">Used {call.toolName}</span>
        <ChevronRight className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 font-mono text-[11px] leading-relaxed">
          <div className="mb-1 text-[var(--color-text-muted)]">input</div>
          <pre className="mb-2 max-h-40 overflow-auto whitespace-pre-wrap">{JSON.stringify(call.input, null, 2)}</pre>
          <div className="mb-1 text-[var(--color-text-muted)]">output</div>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap">{JSON.stringify(call.output, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
