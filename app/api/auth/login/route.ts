import { adminCookieOptions, createAdminToken, validateAdminPassword } from "../../../../lib/auth";
import { jsonError } from "../../../../lib/validators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!validateAdminPassword(body.password)) {
      return jsonError("Senha de admin invalida.", 401);
    }

    const token = createAdminToken();
    const response = Response.json({ ok: true });
    const options = adminCookieOptions();
    response.headers.append(
      "Set-Cookie",
      `${options.name}=${token}; Path=${options.path}; Max-Age=${options.maxAge}; HttpOnly; SameSite=Lax${
        options.secure ? "; Secure" : ""
      }`
    );
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao autenticar.";
    return jsonError(message, 500);
  }
}
