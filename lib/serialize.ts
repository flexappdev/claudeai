// Minimal serializers — accept any Mongoose doc / lean object / POJO and
// produce the API-shaped DTO. Loosely typed on purpose.

/* eslint-disable @typescript-eslint/no-explicit-any */

function strId(v: any): string {
  return v == null ? "" : String(v);
}

function isoDate(v: any): string {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") return v;
  return new Date().toISOString();
}

export function serializeChat(c: any) {
  return {
    _id: strId(c._id),
    userId: String(c.userId ?? "mat"),
    title: String(c.title ?? "New chat"),
    projectId: c.projectId ? strId(c.projectId) : null,
    model: String(c.model ?? "claude-sonnet-4-6"),
    starred: Boolean(c.starred),
    createdAt: isoDate(c.createdAt),
    updatedAt: isoDate(c.updatedAt),
  };
}

export function serializeMessage(m: any) {
  return {
    _id: strId(m._id),
    chatId: strId(m.chatId),
    role: m.role as "user" | "assistant",
    content: String(m.content ?? ""),
    artifactIds: Array.isArray(m.artifactIds) ? m.artifactIds.map(strId) : [],
    createdAt: isoDate(m.createdAt),
  };
}

export function serializeProject(p: any) {
  return {
    _id: strId(p._id),
    userId: String(p.userId ?? "mat"),
    name: String(p.name ?? ""),
    description: String(p.description ?? ""),
    instructions: String(p.instructions ?? ""),
    memory: String(p.memory ?? ""),
    color: String(p.color ?? "#006699"),
    createdAt: isoDate(p.createdAt),
    updatedAt: isoDate(p.updatedAt),
  };
}

export function serializeProjectFile(f: any) {
  return {
    _id: strId(f._id),
    projectId: strId(f.projectId),
    filename: String(f.filename ?? ""),
    mimeType: String(f.mimeType ?? "text/plain"),
    size: Number(f.size ?? 0),
    contentChars: typeof f.content === "string" ? f.content.length : 0,
    createdAt: isoDate(f.createdAt),
  };
}

export function serializeArtifact(a: any) {
  return {
    _id: strId(a._id),
    chatId: strId(a.chatId),
    messageId: a.messageId ? strId(a.messageId) : null,
    identifier: String(a.identifier ?? ""),
    title: String(a.title ?? ""),
    type: String(a.type ?? "code") as
      | "code"
      | "markdown"
      | "html"
      | "react"
      | "svg"
      | "mermaid",
    language: a.language == null ? null : String(a.language),
    content: String(a.content ?? ""),
    version: Number(a.version ?? 1),
    createdAt: isoDate(a.createdAt),
  };
}

export function serializeSkill(s: any) {
  return {
    _id: strId(s._id),
    userId: String(s.userId ?? "mat"),
    slug: String(s.slug ?? ""),
    name: String(s.name ?? ""),
    description: String(s.description ?? ""),
    content: String(s.content ?? ""),
    enabled: Boolean(s.enabled),
    source: (s.source === "builtin" ? "builtin" : "user") as "builtin" | "user",
    createdAt: isoDate(s.createdAt),
  };
}

export function serializeConnector(c: any) {
  return {
    _id: strId(c._id),
    userId: String(c.userId ?? "mat"),
    key: String(c.key ?? "") as "gmail" | "slack" | "gdrive" | "gsheets",
    name: String(c.name ?? ""),
    status: (c.status === "connected" ? "connected" : "disconnected") as
      | "connected"
      | "disconnected",
    config: (c.config as Record<string, string>) || {},
    connectedAt: c.connectedAt ? isoDate(c.connectedAt) : null,
  };
}
