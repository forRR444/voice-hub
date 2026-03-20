import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WorkspaceRow } from "@/types/database";
import OnboardingClient from "./onboarding-client";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("user_id", user.id)
    .single<WorkspaceRow>();

  if (!workspace) {
    const { data: newWorkspace, error } = await supabase
      .from("workspaces")
      .insert({
        user_id: user.id,
        name: user.user_metadata?.full_name || "マイサービス",
        subscription_status: "free",
        onboarding_completed: false,
      })
      .select("*")
      .single<WorkspaceRow>();

    if (error || !newWorkspace) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">ワークスペースの作成に失敗しました。ページをリロードしてください。</p>
        </div>
      );
    }

    const admin = createAdminClient();
    const { count: totalUsers1 } = await admin.from("workspaces").select("id", { count: "exact", head: true });
    return <OnboardingClient workspace={newWorkspace} betaUserCount={totalUsers1 ?? 0} />;
  }

  if (workspace.onboarding_completed) {
    redirect("/dashboard");
  }

  const admin = createAdminClient();
  const { count: totalUsers2 } = await admin.from("workspaces").select("id", { count: "exact", head: true });
  return <OnboardingClient workspace={workspace} betaUserCount={totalUsers2 ?? 0} />;
}
