import { ARTIFACT_TYPES, type ArtifactType } from "@/lib/constants";

export type ParsedArtifact = {
  identifier: string;
  type: ArtifactType;
  title: string;
  language: string | null;
  content: string;
};

export type ArtifactReference = {
  identifier: string;
  type: ArtifactType;
  title: string;
};

const OPEN_RE = /<artifact\b([^>]*)>/i;
const CLOSE_TAG = "</artifact>";
const ATTR_RE = /(\w+)\s*=\s*"([^"]*)"/g;

function parseAttrs(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  let m: RegExpExecArray | null;
  while ((m = ATTR_RE.exec(raw))) out[m[1]] = m[2];
  return out;
}

function normalizeType(v: string | undefined): ArtifactType | null {
  if (!v) return null;
  return (ARTIFACT_TYPES as readonly string[]).includes(v) ? (v as ArtifactType) : null;
}

/**
 * Streaming-safe artifact extractor.
 *
 * Returns the parsed artifacts (fully closed only) and the original text with
 * each closed artifact replaced by [artifact:<identifier>]. If a tag is open
 * but not yet closed (still streaming), it stays in the text untouched —
 * the UI can detect the opening via `detectOpenArtifact` and pre-open the
 * panel before the body finishes arriving.
 */
export function extractArtifacts(text: string): {
  artifacts: ParsedArtifact[];
  text: string;
} {
  const artifacts: ParsedArtifact[] = [];
  let out = "";
  let cursor = 0;

  while (cursor < text.length) {
    const open = OPEN_RE.exec(text.slice(cursor));
    if (!open) {
      out += text.slice(cursor);
      break;
    }
    const openIdx = cursor + open.index;
    out += text.slice(cursor, openIdx);

    const attrs = parseAttrs(open[1]);
    const closeIdx = text.indexOf(CLOSE_TAG, openIdx + open[0].length);

    if (closeIdx === -1) {
      // Unclosed — keep the rest of the text as-is, caller can decide what to do.
      out += text.slice(openIdx);
      break;
    }

    const body = text.slice(openIdx + open[0].length, closeIdx);
    const type = normalizeType(attrs.type);
    const identifier = (attrs.identifier || "").trim();
    const title = (attrs.title || identifier || "Untitled").slice(0, 200);
    if (type && identifier) {
      artifacts.push({
        identifier,
        type,
        title,
        language: attrs.language?.trim() || null,
        content: body.trim(),
      });
      out += `[artifact:${identifier}]`;
    } else {
      // Malformed — leave the original text alone.
      out += text.slice(openIdx, closeIdx + CLOSE_TAG.length);
    }

    cursor = closeIdx + CLOSE_TAG.length;
  }

  return { artifacts, text: out };
}

/**
 * Detect a still-streaming open artifact tag so the UI can open the panel
 * early. Returns null if there is no unclosed tag, or the parsed attrs of
 * the most recent unclosed opening tag.
 */
export function detectOpenArtifact(text: string): ArtifactReference | null {
  let lastOpen: { start: number; raw: string } | null = null;
  let cursor = 0;
  while (cursor < text.length) {
    const m = OPEN_RE.exec(text.slice(cursor));
    if (!m) break;
    const openIdx = cursor + m.index;
    const closeIdx = text.indexOf(CLOSE_TAG, openIdx + m[0].length);
    if (closeIdx === -1) {
      lastOpen = { start: openIdx, raw: m[1] };
      break;
    }
    cursor = closeIdx + CLOSE_TAG.length;
  }
  if (!lastOpen) return null;
  const attrs = parseAttrs(lastOpen.raw);
  const type = normalizeType(attrs.type);
  if (!type || !attrs.identifier) return null;
  return {
    identifier: attrs.identifier,
    type,
    title: attrs.title || attrs.identifier,
  };
}

export function findArtifactReferences(text: string): string[] {
  const ids: string[] = [];
  const re = /\[artifact:([a-z0-9_-]+)\]/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) ids.push(m[1]);
  return ids;
}
