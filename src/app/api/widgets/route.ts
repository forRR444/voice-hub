import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlanLimits, toSubscriptionStatus } from "@/lib/plan";
import { widgetCreateSchema, widgetUpdateSchema } from "@/lib/validations";
import { logError } from "@/lib/logger";
import { z } from "zod";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, subscription_status")
    .eq("user_id", user.id)
    .single();

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

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
    logError("Widget validation error:", JSON.stringify(parsed.error.flatten()));
    return NextResponse.json(
      { error: "入力内容に不備があります", details: parsed.error.flatten() },
      { status: 400 }
    );
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const body = await request.json();
  const { id, ...fields } = body;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
  }

  const parsed = widgetUpdateSchema.safeParse(fields);
  if (!parsed.success) {
    logError("Widget update validation error:", JSON.stringify(parsed.error.flatten()));
    return NextResponse.json(
      { error: "入力内容に不備があります", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("widgets")
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

const deleteSchema = z.object({ id: z.string().min(1) });

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
  }

  const { error } = await supabase
    .from("widgets")
    .delete()
    .eq("id", parsed.data.id)
    .eq("workspace_id", workspace.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
