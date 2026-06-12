import { NextResponse } from "next/server";

export function apiError(code: string, message: string, status = 400) {
  return NextResponse.json({ error: message, code }, { status });
}

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export async function readJson<T = unknown>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    return {} as T;
  }
}

export function isValidObjectId(id: string): boolean {
  return /^[a-f0-9]{24}$/i.test(id);
}
