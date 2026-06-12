"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { highlight } from "sugar-high";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        });
      }}
      className="focus-ring inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 text-[11px] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
      aria-label={copied ? "Copied" : "Copy code"}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      <span>{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

const components: Components = {
  code({ className, children, ...props }) {
    const text = String(children ?? "").replace(/\n$/, "");
    const isInline = !className?.startsWith("language-");
    if (isInline) {
      return (
        <code
          {...props}
          className="rounded bg-[var(--color-surface-2)] px-1 py-0.5 font-mono text-[0.9em]"
        >
          {text}
        </code>
      );
    }
    const lang = className?.replace("language-", "") || "";
    const html = highlight(text);
    return (
      <div className="my-3 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-2)]">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-1.5 text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
          <span>{lang || "code"}</span>
          <CopyButton text={text} />
        </div>
        <pre className="overflow-x-auto p-3 text-sm leading-relaxed">
          <code className="font-mono" dangerouslySetInnerHTML={{ __html: html }} />
        </pre>
      </div>
    );
  },
  a({ href, children, ...props }) {
    return (
      <a
        {...props}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-[var(--color-accent)] underline-offset-2 hover:underline"
      >
        {children}
      </a>
    );
  },
  table({ children }) {
    return (
      <div className="my-3 overflow-x-auto">
        <table className="w-full border-collapse border border-[var(--color-border)] text-sm">{children}</table>
      </div>
    );
  },
  th({ children }) {
    return (
      <th className="border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-left font-semibold">
        {children}
      </th>
    );
  },
  td({ children }) {
    return <td className="border border-[var(--color-border)] px-3 py-1.5">{children}</td>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="my-3 border-l-2 border-[var(--color-accent)] bg-[var(--color-surface-2)] px-3 py-1.5 italic text-[var(--color-text-muted)]">
        {children}
      </blockquote>
    );
  },
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-claude max-w-none leading-relaxed text-[var(--color-text)]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
