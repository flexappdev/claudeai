import { getDb } from "@/lib/db";
import { Connector } from "@/models/Connector";
import { apiError, apiOk } from "@/lib/api";
import { serializeConnector } from "@/lib/serialize";
import { isGoogleConfigured } from "@/lib/connectors/google";
import { isSlackConfigured } from "@/lib/connectors/slack";
import { isConnectorSecretConfigured } from "@/lib/connectors/crypto";
import { CONNECTOR_KEYS, DEFAULT_USER_ID } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NAMES: Record<string, string> = {
  gmail: "Gmail",
  gdrive: "Google Drive",
  gsheets: "Google Sheets",
  slack: "Slack",
};

const DESCRIPTIONS: Record<string, string> = {
  gmail: "Search threads, draft replies. Drafts never auto-send.",
  gdrive: "Search and read your Drive files (docs, sheets, plain text).",
  gsheets: "Read ranges and append rows to your spreadsheets.",
  slack: "Search messages, send to channels (with in-chat confirmation).",
};

export async function GET() {
  try {
    await getDb();
    const existing = await Connector.find({ userId: DEFAULT_USER_ID }).lean();
    const byKey = new Map(existing.map((c) => [String(c.key), c]));
    const configured = {
      google: isGoogleConfigured(),
      slack: isSlackConfigured(),
      secret: isConnectorSecretConfigured(),
    };

    const connectors = CONNECTOR_KEYS.map((k) => {
      const c = byKey.get(k);
      const isGoogle = k !== "slack";
      const providerConfigured = isGoogle ? configured.google : configured.slack;
      return {
        ...(c
          ? serializeConnector(c)
          : {
              _id: `tmp-${k}`,
              userId: DEFAULT_USER_ID,
              key: k,
              name: NAMES[k],
              status: "disconnected" as const,
              config: {},
              connectedAt: null,
            }),
        description: DESCRIPTIONS[k],
        configured: providerConfigured && configured.secret,
        providerConfigured,
      };
    });

    return apiOk({ connectors, configured });
  } catch (err) {
    return apiError("CONNECTOR_LIST_FAILED", (err as Error).message, 500);
  }
}
