import { google } from "googleapis";
import { Connector } from "@/models/Connector";
import { DEFAULT_USER_ID } from "@/lib/constants";
import { decryptJSON, encryptJSON } from "./crypto";

export type GoogleService = "gmail" | "gdrive" | "gsheets";

type Tokens = {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  scope?: string;
  token_type?: string;
};

const SCOPES: Record<GoogleService, string[]> = {
  gmail: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.compose",
  ],
  gdrive: ["https://www.googleapis.com/auth/drive.readonly"],
  gsheets: ["https://www.googleapis.com/auth/spreadsheets"],
};

const NAMES: Record<GoogleService, string> = {
  gmail: "Gmail",
  gdrive: "Google Drive",
  gsheets: "Google Sheets",
};

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:17001";
}

export function redirectUri(): string {
  return `${appBaseUrl()}/api/connectors/google/callback`;
}

export function oauthClient() {
  if (!isGoogleConfigured()) throw new Error("Google OAuth is not configured");
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri(),
  );
}

export function authUrlFor(service: GoogleService): string {
  const client = oauthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: true,
    scope: SCOPES[service],
    state: service,
  });
}

export async function exchangeCode(code: string): Promise<Tokens> {
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  return tokens as Tokens;
}

export async function authedClient(service: GoogleService) {
  const conn = await Connector.findOne({ userId: DEFAULT_USER_ID, key: service });
  if (!conn || conn.status !== "connected" || !conn.config?.tokens) {
    throw new Error(`${NAMES[service]} is not connected`);
  }
  let tokens = decryptJSON<Tokens>(conn.config.tokens as string);
  const client = oauthClient();
  client.setCredentials(tokens);

  // Refresh if needed.
  const fiveMin = 5 * 60 * 1000;
  if (tokens.expiry_date && tokens.expiry_date - Date.now() < fiveMin && tokens.refresh_token) {
    try {
      const { credentials } = await client.refreshAccessToken();
      tokens = { ...tokens, ...credentials } as Tokens;
      conn.config = { ...conn.config, tokens: encryptJSON(tokens) };
      await conn.save();
      client.setCredentials(tokens);
    } catch {
      conn.status = "disconnected";
      await conn.save();
      throw new Error(`${NAMES[service]} token refresh failed — please reconnect`);
    }
  }

  return client;
}

export async function saveTokens(service: GoogleService, tokens: Tokens, scopes: string[]) {
  await Connector.findOneAndUpdate(
    { userId: DEFAULT_USER_ID, key: service },
    {
      $set: {
        name: NAMES[service],
        status: "connected",
        connectedAt: new Date(),
        config: {
          tokens: encryptJSON(tokens),
          scopes: scopes.join(" "),
        },
      },
    },
    { upsert: true, new: true },
  );
}

export function googleServiceName(s: GoogleService): string {
  return NAMES[s];
}
