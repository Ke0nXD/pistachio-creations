import type { NextRequest } from "next/server";
import { requireAdminRequest } from "../../../../lib/auth";
import { destroyCloudinaryAsset } from "../../../../lib/cloudinary";
import { deleteImageItem, updateImageItem } from "../../../../lib/mongodb";
import { jsonError, validateImageItemInput } from "../../../../lib/validators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const COLLECTION = "gallery_items";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const payload = await request.json();
    const validated = validateImageItemInput(payload, { partial: true });
    if (!validated.ok) return jsonError(validated.error, 400);

    const item = await updateImageItem(COLLECTION, id, validated.data);
    if (!item) return jsonError("Item da galeria nao encontrado.", 404);
    return Response.json(item, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel atualizar item da galeria.";
    return jsonError(message, 500);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const { id } = await context.params;
    const item = await deleteImageItem(COLLECTION, id);
    if (!item) return jsonError("Item da galeria nao encontrado.", 404);

    let warning = "";
    if (item.publicId) {
      try {
        await destroyCloudinaryAsset(item.publicId);
      } catch (error) {
        warning = error instanceof Error ? error.message : "Falha ao remover imagem do Cloudinary.";
      }
    }

    return Response.json({ ok: true, item, warning }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel remover item da galeria.";
    return jsonError(message, 500);
  }
}
