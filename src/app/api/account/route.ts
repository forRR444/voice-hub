import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp, handleApiError } from "@/lib/api-utils";
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
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    const { supabase, user } = auth;

    await supabase.auth.signOut();

    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) {
      logError("ユーザー認証情報の削除に失敗", error);
      return NextResponse.json(
        { error: "アカウント削除に失敗しました" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, "アカウント削除に失敗しました");
  }
}
