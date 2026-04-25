import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/api-utils";
import { requireUser } from "@/lib/api-auth";
import { logError } from "@/lib/logger";

export async function DELETE(request: NextRequest) {
  try {
    const rateLimited = await checkRateLimit(`account_delete:${getClientIp(request)}`, 3, 60000);
    if (rateLimited) return rateLimited;

    const auth = await requireUser();
    if (!auth.ok) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }
    const { supabase, user } = auth;

    const admin = createAdminClient();

    // ワークスペースを取得
    const { data: workspace } = await admin
      .from("workspaces")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (workspace) {
      const wsId = workspace.id;

      // テスティモニアルIDを取得してタグを削除
      const { data: testimonials } = await admin
        .from("testimonials")
        .select("id")
        .eq("workspace_id", wsId);

      if (testimonials && testimonials.length > 0) {
        const ids = testimonials.map((t) => t.id);
        await admin.from("testimonial_tags").delete().in("testimonial_id", ids);
      }

      // ワークスペース配下のデータを削除
      await Promise.all([
        admin.from("testimonials").delete().eq("workspace_id", wsId),
        admin.from("forms").delete().eq("workspace_id", wsId),
        admin.from("widgets").delete().eq("workspace_id", wsId),
      ]);

      // ワークスペースを削除
      await admin.from("workspaces").delete().eq("id", wsId);
    }

    // セッションを無効化
    await supabase.auth.signOut();

    // Supabase Authからユーザーを削除
    const { error: authError } = await admin.auth.admin.deleteUser(user.id);
    if (authError) {
      logError("ユーザー認証情報の削除に失敗", authError);
      return NextResponse.json(
        { error: "アカウント削除に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logError("アカウント削除エラー", error);
    return NextResponse.json(
      { error: "アカウント削除に失敗しました" },
      { status: 500 }
    );
  }
}
