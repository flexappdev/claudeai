import { PROJECT_FILE_LIMITS } from "@/lib/constants";

export type ParsedUpload = {
  filename: string;
  mimeType: string;
  content: string;
  size: number;
};

const ALLOWED_EXT = [".md", ".txt", ".csv", ".json", ".pdf"] as const;

export async function parseUploadedFile(file: File): Promise<ParsedUpload> {
  const name = file.name || "untitled";
  const ext = name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";
  if (!ALLOWED_EXT.includes(ext as (typeof ALLOWED_EXT)[number])) {
    throw new Error(`Unsupported file type: ${ext || "(no extension)"}. Allowed: ${ALLOWED_EXT.join(", ")}`);
  }
  if (file.size > PROJECT_FILE_LIMITS.maxBytesPerFile) {
    throw new Error(`File ${name} exceeds the ${Math.round(PROJECT_FILE_LIMITS.maxBytesPerFile / 1024)}KB cap.`);
  }

  const ab = await file.arrayBuffer();

  if (ext === ".pdf") {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(ab) });
    const { text } = await parser.getText();
    return {
      filename: name,
      mimeType: "application/pdf",
      content: text.trim().slice(0, PROJECT_FILE_LIMITS.maxBytesPerFile),
      size: file.size,
    };
  }

  const text = new TextDecoder().decode(ab);
  const mimeMap: Record<string, string> = {
    ".md": "text/markdown",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".json": "application/json",
  };
  return {
    filename: name,
    mimeType: mimeMap[ext] || file.type || "text/plain",
    content: text.slice(0, PROJECT_FILE_LIMITS.maxBytesPerFile),
    size: file.size,
  };
}
