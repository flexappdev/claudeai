import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { Connector } from "@/models/Connector";
import { apiError, apiOk } from "@/lib/api";
import { CONNECTOR_KEYS, DEFAULT_USER_ID, type ConnectorKey } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ key: string }> };

function isKey(s: string): s is ConnectorKey {
  return (CONNECTOR_KEYS as readonly string[]).includes(s);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const { key } = await ctx.params;
  if (!isKey(key)) return apiError("INVALID_KEY", "Unknown connector key", 400);
  try {
    await getDb();
    await Connector.findOneAndUpdate(
      { userId: DEFAULT_USER_ID, key },
      { $set: { status: "disconnected", config: {}, connectedAt: null } },
    );
    return apiOk({ ok: true });
  } catch (err) {
    return apiError("CONNECTOR_DISCONNECT_FAILED", (err as Error).message, 500);
  }
}
