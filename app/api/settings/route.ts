import type { NextRequest } from "next/server";
import { requireAdminRequest } from "../../../lib/auth";
import { getSettings, updateSettings } from "../../../lib/mongodb";
import { jsonError, validateSettingsInput } from "../../../lib/validators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json(await getSettings(), {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel carregar configuracoes.";
    return jsonError(message, 500);
  }
}

export async function PUT(request: NextRequest) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const payload = await request.json();
    const validated = validateSettingsInput(payload);
    if (!validated.ok) return jsonError(validated.error, 400);
    return Response.json(await updateSettings(validated.data), {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel salvar configuracoes.";
    return jsonError(message, 500);
  }
}
