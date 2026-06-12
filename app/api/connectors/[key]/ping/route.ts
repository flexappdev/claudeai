import { NextRequest } from "next/server";
import { google } from "googleapis";
import { getDb } from "@/lib/db";
import { authedClient } from "@/lib/connectors/google";
import { slackClient } from "@/lib/connectors/slack";
import { apiError, apiOk } from "@/lib/api";
import { CONNECTOR_KEYS, type ConnectorKey } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ key: string }> };

function isKey(s: string): s is ConnectorKey {
  return (CONNECTOR_KEYS as readonly string[]).includes(s);
}

export async function POST(_req: NextRequest, ctx: Ctx) {
  const { key } = await ctx.params;
  if (!isKey(key)) return apiError("INVALID_KEY", "Unknown connector key", 400);
  try {
    await getDb();
    if (key === "slack") {
      const c = await slackClient();
      const res = await c.auth.test();
      return apiOk({ ok: true, identity: { user: res.user, team: res.team } });
    }
    const client = await authedClient(key);
    if (key === "gmail") {
      const gmail = google.gmail({ version: "v1", auth: client });
      const r = await gmail.users.getProfile({ userId: "me" });
      return apiOk({ ok: true, identity: { email: r.data.emailAddress } });
    }
    if (key === "gdrive") {
      const drive = google.drive({ version: "v3", auth: client });
      const r = await drive.about.get({ fields: "user(emailAddress,displayName)" });
      return apiOk({ ok: true, identity: r.data.user });
    }
    if (key === "gsheets") {
      const oauth = google.oauth2({ version: "v2", auth: client });
      const r = await oauth.userinfo.get();
      return apiOk({ ok: true, identity: { email: r.data.email } });
    }
    return apiError("UNKNOWN_KEY", "Unknown connector key", 400);
  } catch (err) {
    return apiError("PING_FAILED", (err as Error).message, 400);
  }
}
