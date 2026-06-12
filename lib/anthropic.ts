import { createAnthropic } from "@ai-sdk/anthropic";
import type { ModelId } from "./constants";

let _client: ReturnType<typeof createAnthropic> | null = null;

function client() {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local (copy from ~/context-2026/agents/.env).",
    );
  }
  _client = createAnthropic({ apiKey });
  return _client;
}

export function modelFor(id: ModelId) {
  return client()(id);
}

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}
