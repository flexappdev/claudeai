import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

function key(): Buffer {
  const secret = process.env.CONNECTOR_SECRET;
  if (!secret) {
    throw new Error("CONNECTOR_SECRET is not set. Generate with `openssl rand -hex 32`.");
  }
  return createHash("sha256").update(secret).digest();
}

export function encryptJSON(value: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), tag.toString("hex"), data.toString("hex")].join(".");
}

export function decryptJSON<T = unknown>(payload: string): T {
  const [ivHex, tagHex, dataHex] = payload.split(".");
  if (!ivHex || !tagHex || !dataHex) throw new Error("Invalid encrypted payload");
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const data = Buffer.from(dataHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  return JSON.parse(plain) as T;
}

export function isConnectorSecretConfigured(): boolean {
  return Boolean(process.env.CONNECTOR_SECRET);
}
