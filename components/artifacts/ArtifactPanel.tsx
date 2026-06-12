"use client";

import { Check, Copy, Download, Eye, FileCode, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { highlight } from "sugar-high";
import { Markdown } from "@/components/chat/Markdown";
import { VersionPicker } from "./VersionPicker";
import { buildHtmlSrcdoc, buildReactSrcdoc } from "@/lib/artifacts/reactHarness";
import { useTheme } from "@/components/shell/ThemeProvider";
import type { ArtifactDTO } from "@/lib/types";

type View = "preview" | "code";

const EXT_BY_TYPE: Record<ArtifactDTO["type"], string> = {
  code: "txt",
  markdown: "md",
  html: "html",
  react: "tsx",
  svg: "svg",
  mermaid: "mmd",
};

export function ArtifactPanel({
  artifact,
  versions,
  onChangeVersion,
  onClose,
  fullWidth = false,
}: {
  artifact: ArtifactDTO;
  versions?: ArtifactDTO[];
  onChangeVersion?: (v: number) => void;
  onClose?: () => void;
  fullWidth?: boolean;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [view, setView] = useState<View>(defaultView(artifact.type));
  const [copied, setCopied] = useState(false);
  const [mermaidSvg, setMermaidSvg] = useState<string | null>(null);

  useEffect(() => setView(defaultView(artifact.type)), [artifact.type]);

  const srcdoc = useMemo(() => {
    if (artifact.type === "react") return buildReactSrcdoc(artifact.content, isDark);
    if (artifact.type === "html") return buildHtmlSrcdoc(artifact.content, isDark);
    return null;
  }, [artifact.type, artifact.content, isDark]);

  useEffect(() => {
    let cancelled = false;
    if (artifact.type !== "mermaid" || view !== "preview") {
      setMermaidSvg(null);
      return;
    }
    (async () => {
      try {
        const mod = await import("mermaid");
        const mermaid = mod.default;
        mermaid.initialize({ startOnLoad: false, theme: isDark ? "dark" : "default", securityLevel: "strict" });
        const id = `m-${Date.now()}`;
        const { svg } = await mermaid.render(id, artifact.content.trim());
        if (!cancelled) setMermaidSvg(svg);
      } catch (e) {
        if (!cancelled) setMermaidSvg(`<pre class="__err">${(e as Error).message}</pre>`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [artifact.type, artifact.content, view, isDark]);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(artifact.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  }, [artifact.content]);

  const download = useCallback(() => {
    const ext = EXT_BY_TYPE[artifact.type];
    const blob = new Blob([artifact.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${artifact.identifier}-v${artifact.version}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [artifact]);

  const versionNumbers = versions?.map((v) => v.version) ?? [artifact.version];

  return (
    <div
      className={[
        "flex h-full flex-col bg-[var(--color-surface)]",
        fullWidth ? "" : "border-l border-[var(--color-border)]",
      ].join(" ")}
    >
      <header className="flex items-center gap-2 border-b border-[var(--color-border)] px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{artifact.title}</div>
          <div className="truncate text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
            {artifact.type}
            {artifact.language ? ` · ${artifact.language}` : ""}
          </div>
        </div>
        {versionNumbers.length > 1 && onChangeVersion && (
          <VersionPicker
            versions={versionNumbers}
            current={artifact.version}
            onChange={onChangeVersion}
          />
        )}
        <div className="inline-flex rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-0.5 text-xs">
          {canPreview(artifact.type) && (
            <button
              type="button"
              onClick={() => setView("preview")}
              className={[
                "rounded-[5px] px-2 py-1",
                view === "preview"
                  ? "bg-[var(--color-surface)] font-medium shadow-sm"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
              ].join(" ")}
              aria-pressed={view === "preview"}
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="sr-only">Preview</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setView("code")}
            className={[
              "rounded-[5px] px-2 py-1",
              view === "code"
                ? "bg-[var(--color-surface)] font-medium shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]",
            ].join(" ")}
            aria-pressed={view === "code"}
          >
            <FileCode className="h-3.5 w-3.5" />
            <span className="sr-only">Code</span>
          </button>
        </div>
        <button
          type="button"
          onClick={copy}
          className="focus-ring inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
          aria-label={copied ? "Copied" : "Copy"}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={download}
          className="focus-ring inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
          aria-label="Download"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="focus-ring inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
            aria-label="Close panel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        {view === "code" || !canPreview(artifact.type) ? (
          <CodeView content={artifact.content} language={artifact.language ?? defaultLang(artifact.type)} />
        ) : artifact.type === "markdown" ? (
          <div className="px-5 py-4">
            <Markdown>{artifact.content}</Markdown>
          </div>
        ) : artifact.type === "svg" ? (
          <div
            className="flex h-full items-center justify-center p-6"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: artifact.content }}
          />
        ) : artifact.type === "mermaid" ? (
          <div
            className="flex h-full items-center justify-center p-6"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: mermaidSvg ?? "<div class='text-sm opacity-60'>Rendering…</div>" }}
          />
        ) : srcdoc ? (
          <iframe
            key={`${artifact.identifier}-${artifact.version}`}
            title={artifact.title}
            sandbox="allow-scripts"
            srcDoc={srcdoc}
            className="h-full min-h-[420px] w-full border-0 bg-white"
          />
        ) : (
          <CodeView content={artifact.content} language={artifact.language ?? defaultLang(artifact.type)} />
        )}
      </div>
    </div>
  );
}

function canPreview(t: ArtifactDTO["type"]): boolean {
  return t !== "code"; // 'code' artifacts only render as code, everything else has a preview view.
}

function defaultView(t: ArtifactDTO["type"]): View {
  return t === "code" ? "code" : "preview";
}

function defaultLang(t: ArtifactDTO["type"]): string {
  switch (t) {
    case "html":
      return "html";
    case "react":
      return "tsx";
    case "svg":
      return "xml";
    case "mermaid":
      return "text";
    case "markdown":
      return "md";
    default:
      return "text";
  }
}

function CodeView({ content, language }: { content: string; language: string }) {
  const html = highlight(content);
  return (
    <div className="overflow-auto bg-[var(--color-surface-2)] p-4">
      <pre className="min-w-0 text-sm leading-relaxed">
        <code className="font-mono" data-lang={language} dangerouslySetInnerHTML={{ __html: html }} />
      </pre>
    </div>
  );
}
