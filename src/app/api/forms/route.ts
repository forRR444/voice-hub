import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlanLimits, toSubscriptionStatus } from "@/lib/plan";
import { formCreateSchema } from "@/lib/validations";
import { logError } from "@/lib/logger";

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
    logError("Form validation error:", JSON.stringify(parsed.error.flatten()));
    return NextResponse.json(
      { error: "入力内容に不備があります", details: parsed.error.flatten() },
      { status: 400 }
    );
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
