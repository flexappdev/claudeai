import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { exchangeCode, isGoogleConfigured, saveTokens } from "@/lib/connectors/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVICES = new Set(["gmail", "gdrive", "gsheets"]);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") || "";
  const errParam = url.searchParams.get("error");

  if (errParam) return redirectWith(`oauth_error=${encodeURIComponent(errParam)}`);
  if (!code) return redirectWith("oauth_error=missing_code");
  if (!SERVICES.has(state)) return redirectWith("oauth_error=invalid_state");
  if (!isGoogleConfigured()) return redirectWith("oauth_error=not_configured");

  try {
    await getDb();
    const tokens = await exchangeCode(code);
    const scopes = (tokens.scope ?? "").split(" ").filter(Boolean);
    await saveTokens(state as "gmail" | "gdrive" | "gsheets", tokens, scopes);
    return redirectWith(`connected=${state}`);
  } catch (err) {
    return redirectWith(`oauth_error=${encodeURIComponent((err as Error).message)}`);
  }
}

function redirectWith(qs: string): Response {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:17001";
  return Response.redirect(`${base}/customize/connectors?${qs}`, 302);
}
