import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPlanLimits, toSubscriptionStatus } from "@/lib/plan";

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
  const { name, type, theme, filter_min_rating, only_featured } = body;

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
