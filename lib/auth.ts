import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "pistachio_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type AdminTokenPayload = {
  sub: "admin";
  iat: number;
  exp: number;
};

function requireSecret(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} nao configurado.`);
  return value;
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function decodeBase64Url(input: string) {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(input.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function sign(value: string) {
  return base64Url(createHmac("sha256", requireSecret("JWT_SECRET")).update(value).digest());
}

export function createAdminToken() {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminTokenPayload = {
    sub: "admin",
    iat: now,
    exp: now + SESSION_TTL_SECONDS
  };
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64Url(JSON.stringify(payload));
  const unsigned = `${header}.${body}`;
  return `${unsigned}.${sign(unsigned)}`;
}

export function verifyAdminToken(token: string | undefined) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const unsigned = `${parts[0]}.${parts[1]}`;
  const expected = sign(unsigned);
  const actual = parts[2];
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(actual);
  if (expectedBuffer.length !== actualBuffer.length) return false;
  if (!timingSafeEqual(expectedBuffer, actualBuffer)) return false;

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as AdminTokenPayload;
    return payload.sub === "admin" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export async function isAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminToken(cookieStore.get(COOKIE_NAME)?.value);
}

export function isAdminRequest(request: NextRequest) {
  return verifyAdminToken(request.cookies.get(COOKIE_NAME)?.value);
}

export function requireAdminRequest(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return Response.json({ error: "Admin nao autenticado." }, { status: 401 });
  }
  return null;
}

export function adminCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  };
}

export function validateAdminPassword(password: unknown) {
  const configured = requireSecret("ADMIN_PASSWORD");
  const received = String(password ?? "");
  const configuredBuffer = Buffer.from(configured);
  const receivedBuffer = Buffer.from(received);
  if (configuredBuffer.length !== receivedBuffer.length) return false;
  return timingSafeEqual(configuredBuffer, receivedBuffer);
}
