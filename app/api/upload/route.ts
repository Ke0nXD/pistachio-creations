import type { NextRequest } from "next/server";
import { requireAdminRequest } from "../../../lib/auth";
import { getUploadFolder, uploadImageToCloudinary } from "../../../lib/cloudinary";
import { COLLECTION_LABELS, type ImageCollectionName } from "../../../lib/types";
import { jsonError } from "../../../lib/validators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function uploadSection(value: FormDataEntryValue | null) {
  const raw = String(value || "gallery_items");
  if (raw === "finished_commissions") return "finished_commissions" satisfies ImageCollectionName;
  return "gallery_items" satisfies ImageCollectionName;
}

export async function POST(request: NextRequest) {
  const unauthorized = requireAdminRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("Envie um arquivo de imagem no campo file.", 400);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return jsonError("Tipo de arquivo nao permitido. Use webp, png, jpg, jpeg ou gif.", 400);
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      return jsonError("Imagem grande demais. O limite e 10MB.", 413);
    }

    const section = uploadSection(formData.get("section"));
    const arrayBuffer = await file.arrayBuffer();
    const result = await uploadImageToCloudinary(Buffer.from(arrayBuffer), {
      folder: getUploadFolder(COLLECTION_LABELS[section].uploadFolder)
    });

    return Response.json(result, {
      status: 201,
      headers: { "Cache-Control": "no-store" }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha no upload da imagem.";
    return jsonError(message, 500);
  }
}
