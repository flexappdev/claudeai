import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { exchangeCode, isSlackConfigured, saveTokens } from "@/lib/connectors/slack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const errParam = url.searchParams.get("error");
  if (errParam) return redirectWith(`oauth_error=${encodeURIComponent(errParam)}`);
  if (!code) return redirectWith("oauth_error=missing_code");
  if (!isSlackConfigured()) return redirectWith("oauth_error=not_configured");
  try {
    await getDb();
    const payload = await exchangeCode(code);
    await saveTokens(payload);
    return redirectWith("connected=slack");
  } catch (err) {
    return redirectWith(`oauth_error=${encodeURIComponent((err as Error).message)}`);
  }
}

function redirectWith(qs: string): Response {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:17001";
  return Response.redirect(`${base}/customize/connectors?${qs}`, 302);
}
