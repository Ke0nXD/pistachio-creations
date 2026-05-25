import { adminCookieOptions } from "../../../../lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const options = adminCookieOptions();
  const response = Response.json({ ok: true });
  response.headers.append(
    "Set-Cookie",
    `${options.name}=; Path=${options.path}; Max-Age=0; HttpOnly; SameSite=Lax${
      options.secure ? "; Secure" : ""
    }`
  );
  return response;
}
