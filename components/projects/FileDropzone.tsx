"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, Trash2, FileText, FileJson, FileSpreadsheet, File as FileIcon } from "lucide-react";
import type { ProjectFileDTO } from "@/lib/types";

export function FileDropzone({
  projectId,
  files,
  onUploaded,
  onDeleted,
  capacity,
}: {
  projectId: string;
  files: ProjectFileDTO[];
  onUploaded: (file: ProjectFileDTO) => void;
  onDeleted: (fileId: string) => void;
  capacity: { maxFiles: number };
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback(
    async (list: FileList | null) => {
      if (!list || list.length === 0) return;
      setBusy(true);
      setError(null);
      for (const file of Array.from(list)) {
        const fd = new FormData();
        fd.append("file", file);
        try {
          const res = await fetch(`/api/projects/${projectId}/files`, {
            method: "POST",
            body: fd,
          });
          const j = await res.json();
          if (!res.ok) throw new Error(j?.error || "Upload failed");
          onUploaded(j.file);
        } catch (err) {
          setError((err as Error).message);
        }
      }
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    },
    [projectId, onUploaded],
  );

  const remove = useCallback(
    async (fileId: string) => {
      const res = await fetch(`/api/projects/${projectId}/files/${fileId}`, {
        method: "DELETE",
      });
      if (res.ok) onDeleted(fileId);
    },
    [projectId, onDeleted],
  );

  const totalChars = files.reduce((n, f) => n + f.contentChars, 0);
  const atCapacity = files.length >= capacity.maxFiles;

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!atCapacity) void upload(e.dataTransfer.files);
        }}
        className={[
          "flex flex-col items-center justify-center rounded-[var(--radius-card)] border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver ? "border-[var(--color-accent)] bg-[var(--color-accent-tint)]" : "border-[var(--color-border)] bg-[var(--color-surface-2)]",
          atCapacity ? "opacity-60" : "",
        ].join(" ")}
      >
        <Upload className="h-6 w-6 text-[var(--color-text-muted)]" />
        <p className="mt-2 text-sm font-medium">
          {atCapacity ? "File cap reached" : "Drop files or click to upload"}
        </p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          .md, .txt, .csv, .json, .pdf · up to 200KB each · {files.length}/{capacity.maxFiles} files
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".md,.txt,.csv,.json,.pdf"
          className="hidden"
          onChange={(e) => upload(e.target.files)}
          disabled={atCapacity}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={atCapacity || busy}
          className="focus-ring mt-3 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Choose files"}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <ul className="mt-4 flex flex-col gap-2">
        {files.map((f) => (
          <li
            key={f._id}
            className="flex items-center gap-3 rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
          >
            <FileTypeIcon mime={f.mimeType} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm">{f.filename}</div>
              <div className="text-[11px] text-[var(--color-text-muted)]">
                {Math.round(f.size / 1024)}KB · {f.contentChars.toLocaleString()} chars
              </div>
            </div>
            <button
              type="button"
              onClick={() => remove(f._id)}
              className="focus-ring rounded-md p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-red-600"
              aria-label="Delete file"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      {files.length > 0 && (
        <p className="mt-3 text-[11px] text-[var(--color-text-muted)]">
          Total knowledge: {totalChars.toLocaleString()} chars across {files.length} file{files.length === 1 ? "" : "s"}.
        </p>
      )}
    </div>
  );
}

function FileTypeIcon({ mime }: { mime: string }) {
  if (mime.includes("json")) return <FileJson className="h-4 w-4 text-[var(--color-text-muted)]" />;
  if (mime.includes("csv")) return <FileSpreadsheet className="h-4 w-4 text-[var(--color-text-muted)]" />;
  if (mime.includes("pdf")) return <FileIcon className="h-4 w-4 text-[var(--color-text-muted)]" />;
  return <FileText className="h-4 w-4 text-[var(--color-text-muted)]" />;
}
