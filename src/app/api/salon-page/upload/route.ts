import { NextRequest } from "next/server";
import { requireAuthAndWorkspace } from "@/lib/api-auth";
import { checkRateLimit, handleApiError } from "@/lib/api-utils";
import { apiError, apiSuccess } from "@/lib/api-response";
import { IMAGE_MAX_SIZE_BYTES, RATE_LIMITS } from "@/lib/constants";

// multipart/form-data を扱うため Node.js runtime を明示
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireAuthAndWorkspace();
  if (!auth.ok) return auth.response;
  const { supabase, workspace } = auth;

  const { limit, windowMs } = RATE_LIMITS.salonUpload;
  const rateLimited = await checkRateLimit(`salon-upload:${workspace.id}`, limit, windowMs);
  if (rateLimited) return rateLimited;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err) {
    return handleApiError(err, "リクエストの解析に失敗しました");
  }

  const fileEntry = formData.get("file");
  const kindEntry = formData.get("kind");

  if (!(fileEntry instanceof Blob)) {
    return apiError("file が指定されていません", 400, "VALIDATION_ERROR");
  }
  if (typeof kindEntry !== "string" || (kindEntry !== "logo" && kindEntry !== "cover")) {
    return apiError("kind は logo または cover を指定してください", 400, "VALIDATION_ERROR");
  }

  if (!fileEntry.type.startsWith("image/")) {
    return apiError("画像ファイルのみアップロード可能です", 400, "VALIDATION_ERROR");
  }
  if (fileEntry.size > IMAGE_MAX_SIZE_BYTES) {
    return apiError("ファイルサイズが大きすぎます", 400, "VALIDATION_ERROR");
  }

  const prefix = kindEntry === "cover" ? "cover_" : "";
  const path = `salon/${workspace.id}/${prefix}${crypto.randomUUID()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, fileEntry, { contentType: "image/jpeg" });
  if (uploadError) {
    return handleApiError(uploadError, "画像のアップロードに失敗しました");
  }

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
  return apiSuccess({ url: urlData.publicUrl });
}
