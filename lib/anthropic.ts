import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import type { ModelId } from "./constants";

// claudeai uses OpenRouter as the primary provider when OPENROUTER_API_KEY is
// set (lets us route to any model + survive Anthropic rate limits), and falls
// back to the direct Anthropic API otherwise.
//
// Model id mapping: our constants use Anthropic-style ids like
// `claude-sonnet-4-6`. OpenRouter expects the full path `anthropic/<id>`, so
// we map at the boundary.

let _anthropic: ReturnType<typeof createAnthropic> | null = null;
let _openrouter: ReturnType<typeof createOpenRouter> | null = null;

function anthropic() {
  if (_anthropic) return _anthropic;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  _anthropic = createAnthropic({ apiKey });
  return _anthropic;
}

function openrouter() {
  if (_openrouter) return _openrouter;
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set");
  _openrouter = createOpenRouter({ apiKey });
  return _openrouter;
}

function openrouterModelId(id: ModelId): string {
  // Strip date suffixes (haiku-4-5-20251001 → haiku-4-5) since OpenRouter
  // doesn't always carry the dated snapshot — the base id resolves to latest.
  const base = id.replace(/-2[0-9]{7}$/, "");
  return `anthropic/${base}`;
}

export function modelFor(id: ModelId): LanguageModel {
  if (process.env.OPENROUTER_API_KEY) {
    return openrouter()(openrouterModelId(id));
  }
  return anthropic()(id);
}

export function isAnthropicConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY);
}

export function activeProvider(): "openrouter" | "anthropic" | "none" {
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "none";
}
