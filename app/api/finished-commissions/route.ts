import type { NextRequest } from "next/server";
import { requireAdminRequest } from "../../../lib/auth";
import { createImageItem, listImageItems } from "../../../lib/mongodb";
import { jsonError, validateImageItemInput } from "../../../lib/validators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const COLLECTION = "finished_commissions";

export async function GET(request: NextRequest) {
  try {
    const adminView = request.nextUrl.searchParams.get("admin") === "1";
    if (adminView) {
      const unauthorized = requireAdminRequest(request);
      if (unauthorized) return unauthorized;
    }
    return Response.json(await listImageItems(COLLECTION, { includeInactive: adminView }), {
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel carregar comissoes feitas.";
    return jsonError(message, 500);
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const payload = await request.json();
    const validated = validateImageItemInput(payload);
    if (!validated.ok) return jsonError(validated.error, 400);
    return Response.json(await createImageItem(COLLECTION, validated.data), {
      status: 201,
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel criar comissao feita.";
    return jsonError(message, 500);
  }
}
