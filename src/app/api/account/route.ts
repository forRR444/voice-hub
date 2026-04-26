import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp, handleApiError } from "@/lib/api-utils";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireUser } from "@/lib/api-auth";
import { logError } from "@/lib/logger";

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 60_000;

export async function DELETE(request: NextRequest) {
  try {
    const rateLimited = await checkRateLimit(
      `account_delete:${getClientIp(request)}`,
      RATE_LIMIT_MAX,
      RATE_LIMIT_WINDOW_MS,
    );
    if (rateLimited) return rateLimited;

    const auth = await requireUser();
    if (!auth.ok) {
      return apiError("認証が必要です", 401, "UNAUTHORIZED");
    }
    const { supabase, user } = auth;

    await supabase.auth.signOut();

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      logError("ユーザー認証情報の削除に失敗", error);
      return apiError("アカウント削除に失敗しました", 500, "INTERNAL_ERROR");
    }

    return apiSuccess(null);
  } catch (error) {
    return handleApiError(error, "アカウント削除に失敗しました");
  }
}
