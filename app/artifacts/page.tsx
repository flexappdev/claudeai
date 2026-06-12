"use client";

import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/swr";
import { ArtifactCard } from "@/components/artifacts/ArtifactCard";
import type { ArtifactDTO } from "@/lib/types";

type Response = { artifacts: ArtifactDTO[] };

export default function ArtifactsGalleryPage() {
  const { data, isLoading } = useSWR<Response>("/api/artifacts", fetcher);

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <h1 className="font-display text-3xl font-semibold">Artifacts</h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Every standalone piece — HTML demos, React components, charts, scripts.
        Latest version per identifier.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {isLoading &&
          [0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-[var(--radius-card)] bg-[var(--color-surface-2)]"
            />
          ))}
        {!isLoading && (data?.artifacts?.length ?? 0) === 0 && (
          <div className="col-span-full rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] p-10 text-center">
            <p className="font-display text-lg">No artifacts yet</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Ask Claude to build something — an HTML page, a React component, a chart.
            </p>
          </div>
        )}
        {data?.artifacts?.map((a) => (
          <Link
            key={a._id}
            href={`/artifacts/${a._id}`}
            className="focus-ring rounded-[var(--radius-card)] no-underline"
          >
            <ArtifactCard artifact={a} />
          </Link>
        ))}
      </div>
    </div>
  );
}
