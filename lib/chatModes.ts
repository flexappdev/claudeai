export type ChatMode = "normal" | "write" | "code";

export function isChatMode(v: unknown): v is ChatMode {
  return v === "normal" || v === "write" || v === "code";
}
