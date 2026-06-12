import { tool } from "ai";
import { z } from "zod";
import { google } from "googleapis";
import { Connector } from "@/models/Connector";
import { authedClient, isGoogleConfigured } from "./google";
import { isSlackConfigured, slackClient } from "./slack";
import { DEFAULT_USER_ID } from "@/lib/constants";

const DRIVE_TEXT_CAP = 20_000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolMap = Record<string, any>;

export async function buildConnectorTools(): Promise<ToolMap> {
  const connectors = await Connector.find({ userId: DEFAULT_USER_ID, status: "connected" }).lean();
  const keys = new Set(connectors.map((c) => c.key));
  const tools: ToolMap = {};

  if (isGoogleConfigured() && keys.has("gmail")) {
    tools.gmail_search_threads = tool({
      description:
        "Search the user's Gmail threads. Returns up to `max` results — for each, from, subject, date, snippet.",
      inputSchema: z.object({
        query: z.string().describe("Gmail search query (uses Gmail's normal search syntax)"),
        max: z.number().int().min(1).max(25).default(10),
      }),
      execute: async ({ query, max }) => {
        const client = await authedClient("gmail");
        const gmail = google.gmail({ version: "v1", auth: client });
        const list = await gmail.users.threads.list({ userId: "me", q: query, maxResults: max });
        const threads = list.data.threads ?? [];
        const out = await Promise.all(
          threads.map(async (t) => {
            const t2 = await gmail.users.threads.get({ userId: "me", id: t.id!, format: "metadata", metadataHeaders: ["From", "Subject", "Date"] });
            const headers = t2.data.messages?.[0]?.payload?.headers ?? [];
            const find = (n: string) => headers.find((h) => h.name?.toLowerCase() === n.toLowerCase())?.value ?? "";
            return {
              threadId: t.id,
              from: find("From"),
              subject: find("Subject"),
              date: find("Date"),
              snippet: t2.data.messages?.[0]?.snippet ?? "",
            };
          }),
        );
        return { count: out.length, threads: out };
      },
    });

    tools.gmail_create_draft = tool({
      description:
        "Create a Gmail DRAFT (never auto-sent). Returns the draft id. Always show the draft to the user before they send it.",
      inputSchema: z.object({
        to: z.string().email(),
        subject: z.string(),
        body: z.string(),
      }),
      execute: async ({ to, subject, body }) => {
        const client = await authedClient("gmail");
        const gmail = google.gmail({ version: "v1", auth: client });
        const raw = Buffer.from(
          `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`,
        )
          .toString("base64")
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");
        const draft = await gmail.users.drafts.create({ userId: "me", requestBody: { message: { raw } } });
        return { draftId: draft.data.id ?? "" };
      },
    });
  }

  if (isGoogleConfigured() && keys.has("gdrive")) {
    tools.gdrive_search = tool({
      description: "Search Google Drive. Returns file metadata.",
      inputSchema: z.object({
        query: z.string().describe("Drive search query (e.g. \"name contains 'budget'\")"),
        max: z.number().int().min(1).max(25).default(10),
      }),
      execute: async ({ query, max }) => {
        const client = await authedClient("gdrive");
        const drive = google.drive({ version: "v3", auth: client });
        const res = await drive.files.list({
          q: query,
          pageSize: max,
          fields: "files(id,name,mimeType,modifiedTime,webViewLink)",
        });
        return { files: res.data.files ?? [] };
      },
    });

    tools.gdrive_read_file = tool({
      description: `Read a Google Drive file as plain text. Google Docs are exported to text. Capped at ${DRIVE_TEXT_CAP} chars.`,
      inputSchema: z.object({
        fileId: z.string(),
      }),
      execute: async ({ fileId }) => {
        const client = await authedClient("gdrive");
        const drive = google.drive({ version: "v3", auth: client });
        const meta = await drive.files.get({ fileId, fields: "id,name,mimeType" });
        const mt = meta.data.mimeType || "";
        let text = "";
        if (mt === "application/vnd.google-apps.document") {
          const res = await drive.files.export({ fileId, mimeType: "text/plain" }, { responseType: "text" });
          text = String(res.data);
        } else if (mt.startsWith("text/") || mt === "application/json") {
          const res = await drive.files.get({ fileId, alt: "media" }, { responseType: "text" });
          text = String(res.data);
        } else {
          return { name: meta.data.name, mimeType: mt, text: "", error: "Unsupported mime type for text export" };
        }
        return { name: meta.data.name, mimeType: mt, text: text.slice(0, DRIVE_TEXT_CAP) };
      },
    });
  }

  if (isGoogleConfigured() && keys.has("gsheets")) {
    tools.gsheets_read_range = tool({
      description: "Read a range from a Google Spreadsheet. Returns 2D values.",
      inputSchema: z.object({
        spreadsheetId: z.string(),
        range: z.string().describe("A1 notation, e.g. 'Sheet1!A1:E50'"),
      }),
      execute: async ({ spreadsheetId, range }) => {
        const client = await authedClient("gsheets");
        const sheets = google.sheets({ version: "v4", auth: client });
        const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        return { values: res.data.values ?? [] };
      },
    });

    tools.gsheets_append_row = tool({
      description: "Append a row of values to a Google Spreadsheet.",
      inputSchema: z.object({
        spreadsheetId: z.string(),
        range: z.string().describe("A1 notation of the table, e.g. 'Sheet1!A:E'"),
        values: z.array(z.string()),
      }),
      execute: async ({ spreadsheetId, range, values }) => {
        const client = await authedClient("gsheets");
        const sheets = google.sheets({ version: "v4", auth: client });
        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [values] },
        });
        return { ok: true };
      },
    });
  }

  if (isSlackConfigured() && keys.has("slack")) {
    tools.slack_search = tool({
      description: "Search Slack messages. Returns matches with channel, user, text, ts.",
      inputSchema: z.object({
        query: z.string(),
        max: z.number().int().min(1).max(20).default(10),
      }),
      execute: async ({ query, max }) => {
        const client = await slackClient();
        const res = await client.search.messages({ query, count: max });
        return { matches: res.messages?.matches ?? [] };
      },
    });

    tools.slack_send_message = tool({
      description:
        "Send a message to a Slack channel. IMPORTANT: confirm channel + text with the user in chat before invoking this tool.",
      inputSchema: z.object({
        channelId: z.string(),
        text: z.string(),
      }),
      execute: async ({ channelId, text }) => {
        const client = await slackClient();
        const res = await client.chat.postMessage({ channel: channelId, text });
        return { ok: Boolean(res.ok), ts: res.ts ?? "" };
      },
    });
  }

  return tools;
}
