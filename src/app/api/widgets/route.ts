import { NextRequest, NextResponse } from "next/server";
import { getPlanLimits, toSubscriptionStatus } from "@/lib/plan";
import { widgetCreateSchema, widgetUpdateSchema } from "@/lib/validations";
import {
  requireAuthAndWorkspace,
  requireAuthAndWorkspaceWithSubscription,
  createWorkspaceDeleteHandler,
} from "@/lib/api-auth";
import { handleApiError, validationErrorResponse } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  const auth = await requireAuthAndWorkspaceWithSubscription();
  if (!auth.ok) return auth.response;
  const { supabase, workspace } = auth;

  // Server-side plan limit check
  const status = toSubscriptionStatus(workspace.subscription_status);
  const limits = getPlanLimits(status);

  const { count } = await supabase
    .from("widgets")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspace.id);

  if ((count ?? 0) >= limits.widgets) {
    return NextResponse.json(
      { error: "ウィジェット数が上限に達しています" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = widgetCreateSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Widget validation error");
  }

  const { name, type, theme, filter_min_rating, only_featured } = parsed.data;

  const { data, error } = await supabase
    .from("widgets")
    .insert({
      workspace_id: workspace.id,
      name,
      type,
      theme,
      filter_min_rating,
      only_featured,
    })
    .select()
    .single();

  if (error) {
    return handleApiError(error, "ウィジェットの作成に失敗しました");
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuthAndWorkspace();
  if (!auth.ok) return auth.response;
  const { supabase, workspace } = auth;

  const body = await request.json();
  const { id, ...fields } = body;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
  }

  const parsed = widgetUpdateSchema.safeParse(fields);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Widget update validation error");
  }

  const { data, error } = await supabase
    .from("widgets")
    .update(parsed.data)
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .select()
    .single();

  if (error) {
    return handleApiError(error, "ウィジェットの更新に失敗しました");
  }

  return NextResponse.json(data);
}

export const DELETE = createWorkspaceDeleteHandler("widgets");
