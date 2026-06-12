export const APP_NAME = "claudeai";
export const APP_PORT = 17001;
export const DEFAULT_USER_ID = "mat";

export const MODELS = [
  {
    id: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    description: "Balanced quality + speed (default).",
  },
  {
    id: "claude-haiku-4-5-20251001",
    label: "Claude Haiku 4.5",
    description: "Fast + cheap, good for titles + summaries.",
  },
] as const;

export type ModelId = (typeof MODELS)[number]["id"];
export const DEFAULT_MODEL: ModelId = "claude-sonnet-4-6";
export const TITLE_MODEL: ModelId = "claude-haiku-4-5-20251001";

export const PROJECT_COLORS = [
  "#006699",
  "#3399CC",
  "#10b981",
  "#a855f7",
  "#ec4899",
  "#f59e0b",
  "#dc2626",
  "#6b7280",
] as const;

export const ARTIFACT_TYPES = ["code", "markdown", "html", "react", "svg", "mermaid"] as const;
export type ArtifactType = (typeof ARTIFACT_TYPES)[number];

export const CONNECTOR_KEYS = ["gmail", "slack", "gdrive", "gsheets"] as const;
export type ConnectorKey = (typeof CONNECTOR_KEYS)[number];

export const PROJECT_FILE_LIMITS = {
  maxFiles: 10,
  maxBytesPerFile: 200 * 1024,
  truncateCharsForPrompt: 8000,
} as const;
