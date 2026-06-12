"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import { ConnectorCard } from "@/components/connectors/ConnectorCard";

type ListResponse = {
  connectors: {
    _id: string;
    key: "gmail" | "gdrive" | "gsheets" | "slack";
    name: string;
    status: "connected" | "disconnected";
    description: string;
    configured: boolean;
    connectedAt?: string | null;
  }[];
  configured: { google: boolean; slack: boolean; secret: boolean };
};

function ConnectorsInner() {
  const router = useRouter();
  const search = useSearchParams();
  const oauthError = search.get("oauth_error");
  const connected = search.get("connected");
  const { data, mutate } = useSWR<ListResponse>("/api/connectors", fetcher);

  useEffect(() => {
    if (connected || oauthError) {
      void mutate();
      const t = setTimeout(() => router.replace("/customize/connectors"), 2500);
      return () => clearTimeout(t);
    }
  }, [connected, oauthError, mutate, router]);

  const cfg = data?.configured;

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="font-display text-3xl font-semibold">Connectors</h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Hook up Google Workspace and Slack, then Claude gains tools to read and write across them.
      </p>

      {connected && (
        <div
          className="mt-4 rounded-[var(--radius-btn)] border px-3 py-2 text-sm"
          style={{ background: "var(--color-accent-tint)", borderColor: "var(--color-accent)", color: "var(--color-text)" }}
        >
          Connected {connected}.
        </div>
      )}
      {oauthError && (
        <div className="mt-4 rounded-[var(--radius-btn)] border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          OAuth error: {oauthError}
        </div>
      )}

      {cfg && (!cfg.secret || (!cfg.google && !cfg.slack)) && (
        <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 text-sm">
          <div className="font-semibold">Configuration needed</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--color-text-muted)]">
            {!cfg.secret && (
              <li>
                <code className="font-mono">CONNECTOR_SECRET</code> not set — required to encrypt
                OAuth tokens at rest. Generate with{" "}
                <code className="font-mono">openssl rand -hex 32</code>.
              </li>
            )}
            {!cfg.google && (
              <li>
                Google OAuth: set <code className="font-mono">GOOGLE_CLIENT_ID</code> +{" "}
                <code className="font-mono">GOOGLE_CLIENT_SECRET</code> in <code>.env.local</code>.
                Redirect URI:{" "}
                <code className="font-mono">/api/connectors/google/callback</code>.
              </li>
            )}
            {!cfg.slack && (
              <li>
                Slack OAuth: set <code className="font-mono">SLACK_CLIENT_ID</code> +{" "}
                <code className="font-mono">SLACK_CLIENT_SECRET</code>. Redirect URI:{" "}
                <code className="font-mono">/api/connectors/slack/callback</code>. Scopes:
                channels:read, chat:write, search:read.
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {!data &&
          [0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-surface-2)]"
            />
          ))}
        {data?.connectors.map((c) => (
          <ConnectorCard key={c.key} connector={c} onAfterChange={() => mutate()} />
        ))}
      </div>
    </div>
  );
}

export default function ConnectorsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-4xl px-6 py-10">
          <div className="h-10 w-1/3 animate-pulse rounded-md bg-[var(--color-surface-2)]" />
        </div>
      }
    >
      <ConnectorsInner />
    </Suspense>
  );
}
