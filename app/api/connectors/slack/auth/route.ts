import { authUrl, isSlackConfigured } from "@/lib/connectors/slack";
import { apiError } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSlackConfigured()) {
    return apiError(
      "SLACK_NOT_CONFIGURED",
      "SLACK_CLIENT_ID / SLACK_CLIENT_SECRET are not set on the server.",
      500,
    );
  }
  return Response.redirect(authUrl(), 302);
}
