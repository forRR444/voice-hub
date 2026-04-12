import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toSubscriptionStatus } from "@/lib/plan";
import WidgetsClient from "./widgets-client";

export const dynamic = "force-dynamic";

export default async function WidgetsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!workspace) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-foreground">ワークスペースが見つかりません</h2>
          <p className="text-foreground/60">ワークスペースの作成を完了してください。</p>
        </div>
      </div>
    );
  }

  const { data: widgets } = await supabase
    .from("widgets")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  const subscriptionStatus = toSubscriptionStatus(workspace.subscription_status);

  return (
    <WidgetsClient
      workspace={workspace}
      widgets={widgets ?? []}
      subscriptionStatus={subscriptionStatus}
    />
  );
}
