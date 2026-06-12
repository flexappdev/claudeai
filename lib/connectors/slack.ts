import { WebClient } from "@slack/web-api";
import { Connector } from "@/models/Connector";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { decryptJSON, encryptJSON } from "./crypto";

const SLACK_SCOPES = ["channels:read", "chat:write", "search:read"];

type SlackTokenPayload = {
  access_token: string;
  scope?: string;
  team?: { id?: string; name?: string };
};

export function isSlackConfigured(): boolean {
  return Boolean(process.env.SLACK_CLIENT_ID && process.env.SLACK_CLIENT_SECRET);
}

function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:17001";
}

export function redirectUri(): string {
  return `${appBaseUrl()}/api/connectors/slack/callback`;
}

export function authUrl(): string {
  if (!isSlackConfigured()) throw new Error("Slack OAuth is not configured");
  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID as string,
    scope: SLACK_SCOPES.join(","),
    redirect_uri: redirectUri(),
    state: "slack",
  });
  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export async function exchangeCode(code: string): Promise<SlackTokenPayload> {
  const params = new URLSearchParams({
    code,
    client_id: process.env.SLACK_CLIENT_ID as string,
    client_secret: process.env.SLACK_CLIENT_SECRET as string,
    redirect_uri: redirectUri(),
  });
  const res = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const json = (await res.json()) as { ok: boolean; error?: string } & SlackTokenPayload;
  if (!json.ok) throw new Error(`Slack OAuth failed: ${json.error || "unknown"}`);
  return json;
}

export async function saveTokens(payload: SlackTokenPayload) {
  await Connector.findOneAndUpdate(
    { userId: DEFAULT_USER_ID, key: "slack" },
    {
      $set: {
        name: payload.team?.name ? `Slack — ${payload.team.name}` : "Slack",
        status: "connected",
        connectedAt: new Date(),
        config: {
          tokens: encryptJSON({ access_token: payload.access_token }),
          team_id: payload.team?.id ?? "",
          scopes: payload.scope ?? SLACK_SCOPES.join(","),
        },
      },
    },
    { upsert: true, new: true },
  );
}

export async function slackClient(): Promise<WebClient> {
  const conn = await Connector.findOne({ userId: DEFAULT_USER_ID, key: "slack" });
  if (!conn || conn.status !== "connected" || !conn.config?.tokens) {
    throw new Error("Slack is not connected");
  }
  const { access_token } = decryptJSON<{ access_token: string }>(conn.config.tokens as string);
  return new WebClient(access_token);
}
