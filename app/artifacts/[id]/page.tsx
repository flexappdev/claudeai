"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import { ArrowLeft } from "lucide-react";
import { ArtifactPanel } from "@/components/artifacts/ArtifactPanel";
import type { ArtifactDTO } from "@/lib/types";

type One = { artifact: ArtifactDTO };
type Versions = { versions: ArtifactDTO[] };

export default function ArtifactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: one } = useSWR<One>(`/api/artifacts/${id}`, fetcher);
  const { data: vers } = useSWR<Versions>(one ? `/api/artifacts/${id}/versions` : null, fetcher);
  const [activeVersion, setActiveVersion] = useState<number | null>(null);

  useEffect(() => {
    if (one?.artifact) setActiveVersion(one.artifact.version);
  }, [one?.artifact]);

  if (!one) {
    return (
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="h-10 animate-pulse rounded-md bg-[var(--color-surface-2)]" />
      </div>
    );
  }

  const versions = vers?.versions ?? [one.artifact];
  const current = versions.find((v) => v.version === activeVersion) ?? one.artifact;

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-[var(--color-border)] bg-[var(--color-paper)]/85 px-4 py-2 backdrop-blur">
        <Link
          href="/artifacts"
          className="focus-ring inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          All artifacts
        </Link>
      </div>
      <div className="min-h-0 flex-1">
        <ArtifactPanel
          artifact={current}
          versions={versions}
          onChangeVersion={setActiveVersion}
          fullWidth
        />
      </div>
    </div>
  );
}
