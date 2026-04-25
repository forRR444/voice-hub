import { NextRequest, NextResponse } from "next/server";
import { getPlanLimits, toSubscriptionStatus } from "@/lib/plan";
import { formCreateSchema, formUpdateSchema } from "@/lib/validations";
import {
  requireAuthAndWorkspace,
  requireAuthAndWorkspaceWithSubscription,
  createWorkspaceDeleteHandler,
} from "@/lib/api-auth";
import { validationErrorResponse } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  const auth = await requireAuthAndWorkspaceWithSubscription();
  if (!auth.ok) return auth.response;
  const { supabase, workspace } = auth;

  // Server-side plan limit check
  const status = toSubscriptionStatus(workspace.subscription_status);
  const limits = getPlanLimits(status);

  const { count } = await supabase
    .from("forms")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspace.id);

  if ((count ?? 0) >= limits.forms) {
    return NextResponse.json(
      { error: "フォーム数が上限に達しています" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const parsed = formCreateSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Form validation error");
  }

  const { slug, title, description, questions, brand_color, thank_you_message } = parsed.data;

  const { data, error } = await supabase
    .from("forms")
    .insert({
      workspace_id: workspace.id,
      slug,
      title,
      description,
      questions,
      brand_color,
      thank_you_message,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

  const parsed = formUpdateSchema.safeParse(fields);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Form update validation error");
  }

  const { data, error } = await supabase
    .from("forms")
    .update(parsed.data)
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export const DELETE = createWorkspaceDeleteHandler("forms");
