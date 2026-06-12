"use client";

import { Activity, Check, FileText, FolderOpen, Hash, Mail, Plug } from "lucide-react";
import { useState } from "react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  gmail: Mail,
  gdrive: FolderOpen,
  gsheets: FileText,
  slack: Hash,
};

type Conn = {
  _id: string;
  key: "gmail" | "gdrive" | "gsheets" | "slack";
  name: string;
  status: "connected" | "disconnected";
  description?: string;
  configured?: boolean;
  connectedAt?: string | null;
};

export function ConnectorCard({
  connector,
  onAfterChange,
}: {
  connector: Conn;
  onAfterChange: () => void;
}) {
  const Icon = ICONS[connector.key] ?? Plug;
  const isGoogle = connector.key !== "slack";
  const authHref = isGoogle
    ? `/api/connectors/google/auth?service=${connector.key}`
    : "/api/connectors/slack/auth";

  const [pinging, setPinging] = useState(false);
  const [pingResult, setPingResult] = useState<string | null>(null);

  async function disconnect() {
    if (!confirm(`Disconnect ${connector.name}? Tools will be removed from chats.`)) return;
    const res = await fetch(`/api/connectors/${connector.key}`, { method: "DELETE" });
    if (res.ok) onAfterChange();
  }

  async function ping() {
    setPinging(true);
    setPingResult(null);
    const res = await fetch(`/api/connectors/${connector.key}/ping`, { method: "POST" });
    const j = await res.json();
    setPinging(false);
    setPingResult(
      res.ok
        ? `OK — ${Object.values(j.identity ?? {}).filter(Boolean).join(" · ")}`
        : `Failed: ${j.error || res.statusText}`,
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="flex items-start gap-3">
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md"
          style={{ background: "var(--color-accent-tint)", color: "var(--color-accent)" }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{connector.name}</h3>
            <StatusPill status={connector.status} configured={connector.configured ?? false} />
          </div>
          {connector.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-text-muted)]">
              {connector.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--color-text-muted)]">
          {connector.connectedAt
            ? `Connected ${new Date(connector.connectedAt).toLocaleDateString()}`
            : connector.configured
            ? "Ready to connect"
            : "OAuth credentials not configured on the server"}
        </span>
        {connector.status === "connected" ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={ping}
              disabled={pinging}
              className="focus-ring inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1 hover:bg-[var(--color-surface)]"
            >
              <Activity className="h-3 w-3" /> {pinging ? "Testing…" : "Test"}
            </button>
            <button
              type="button"
              onClick={disconnect}
              className="focus-ring rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1 text-red-600 hover:bg-[var(--color-surface)]"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <a
            href={connector.configured ? authHref : undefined}
            onClick={(e) => {
              if (!connector.configured) e.preventDefault();
            }}
            aria-disabled={!connector.configured}
            className={[
              "focus-ring inline-flex items-center gap-1 rounded-[var(--radius-btn)] px-3 py-1 font-medium",
              connector.configured
                ? "text-[var(--color-on-accent)] hover:opacity-90"
                : "cursor-not-allowed bg-[var(--color-surface-2)] text-[var(--color-text-muted)]",
            ].join(" ")}
            style={connector.configured ? { background: "var(--color-accent)" } : undefined}
          >
            Connect
          </a>
        )}
      </div>

      {pingResult && (
        <div className="flex items-start gap-2 rounded-md bg-[var(--color-surface-2)] px-2 py-1.5 text-[11px] text-[var(--color-text-muted)]">
          <Check className="h-3 w-3 shrink-0 translate-y-0.5" />
          <span>{pingResult}</span>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status, configured }: { status: string; configured: boolean }) {
  if (!configured) {
    return (
      <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
        Not configured
      </span>
    );
  }
  if (status === "connected") {
    return (
      <span
        className="rounded-md px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-on-accent)]"
        style={{ background: "var(--color-accent)" }}
      >
        Connected
      </span>
    );
  }
  return (
    <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
      Disconnected
    </span>
  );
}
