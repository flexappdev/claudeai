import Link from "next/link";

export default function ChatIndexPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="font-display text-4xl font-semibold tracking-tight text-[var(--color-text)]">
        Good to see you.
      </h1>
      <p className="mt-3 max-w-xl text-base text-[var(--color-text-muted)]">
        Start a new chat from the sidebar, browse your recent conversations,
        or jump into a project.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/recents"
          className="focus-ring inline-flex items-center rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm hover:bg-[var(--color-surface-2)]"
        >
          Recents
        </Link>
        <Link
          href="/projects"
          className="focus-ring inline-flex items-center rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm hover:bg-[var(--color-surface-2)]"
        >
          Projects
        </Link>
        <Link
          href="/customize/skills"
          className="focus-ring inline-flex items-center rounded-[var(--radius-btn)] px-4 py-2 text-sm"
          style={{ background: "var(--color-accent)", color: "var(--color-on-accent)" }}
        >
          Skills
        </Link>
      </div>
    </div>
  );
}
