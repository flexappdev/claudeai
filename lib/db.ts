import mongoose, { type Mongoose } from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var _claudeaiMongoose:
    | { conn: Mongoose | null; promise: Promise<Mongoose> | null }
    | undefined;
}

const cached = global._claudeaiMongoose ?? { conn: null, promise: null };
global._claudeaiMongoose = cached;

export async function getDb(): Promise<Mongoose> {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local (`/abc-mongo sync claudeai` writes it from ~/context-2026/agents/.env).",
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri.trim(), {
        dbName: process.env.MONGODB_DB || "claudeai",
        bufferCommands: false,
      })
      .then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export function isDbConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI);
}
