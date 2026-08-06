import type { ArtifactType, ConnectorKey, ModelId } from "./constants";

export type Role = "user" | "assistant";

export type ChatDTO = {
  _id: string;
  userId: string;
  title: string;
  projectId?: string | null;
  model: ModelId;
  starred: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MessageDTO = {
  _id: string;
  chatId: string;
  role: Role;
  content: string;
  artifactIds: string[];
  createdAt: string;
};

export type ProjectDTO = {
  _id: string;
  userId: string;
  name: string;
  description: string;
  instructions: string;
  memory: string;
  color: string;
  createdAt: string;
  updatedAt: string;
};

export type ProjectFileDTO = {
  _id: string;
  projectId: string;
  filename: string;
  mimeType: string;
  size: number;
  contentChars: number;
  createdAt: string;
};

export type ArtifactDTO = {
  _id: string;
  chatId: string;
  messageId?: string | null;
  identifier: string;
  title: string;
  type: ArtifactType;
  language?: string | null;
  content: string;
  version: number;
  createdAt: string;
};

export type SkillDTO = {
  _id: string;
  userId: string;
  slug: string;
  name: string;
  description: string;
  content: string;
  enabled: boolean;
  source: "user" | "builtin";
  createdAt: string;
};

export type SkillPlatform = "claudeAi" | "claudeCode" | "codex";

export type SkillIndexEntry = {
  slug: string;
  name: string;
  description: string;
  category: string;
  platforms: Record<SkillPlatform, boolean>;
  sources: string[];
  definitions: number;
  appSkillId: string | null;
  appEnabled: boolean;
};

export type ConnectorDTO = {
  _id: string;
  userId: string;
  key: ConnectorKey;
  name: string;
  status: "connected" | "disconnected";
  config: Record<string, string>;
  connectedAt?: string | null;
};

export type ApiError = { error: string; code: string };
