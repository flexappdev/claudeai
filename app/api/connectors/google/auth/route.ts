import { NextRequest } from "next/server";
import { authUrlFor, isGoogleConfigured } from "@/lib/connectors/google";
import { apiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SERVICES = new Set(["gmail", "gdrive", "gsheets"]);

export async function GET(req: NextRequest) {
  if (!isGoogleConfigured()) {
    return apiError(
      "GOOGLE_NOT_CONFIGURED",
      "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set on the server.",
      500,
    );
  }
  const url = new URL(req.url);
  const service = url.searchParams.get("service") || "";
  if (!SERVICES.has(service)) {
    return apiError("INVALID_SERVICE", "service must be gmail | gdrive | gsheets", 400);
  }
  return Response.redirect(authUrlFor(service as "gmail" | "gdrive" | "gsheets"), 302);
}
