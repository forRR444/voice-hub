import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { WorkspaceRow } from "@/types/database";
import OnboardingClient from "./onboarding-client";

export const dynamic = "force-dynamic";

function OnboardingLayout({
  workspace,
  betaUserCount,
}: {
  workspace: WorkspaceRow;
  betaUserCount: number;
}) {
  return <OnboardingClient workspace={workspace} betaUserCount={betaUserCount} />;
}

async function getBetaUserCount() {
  const admin = createAdminClient();
  const { count } = await admin.from("workspaces").select("id", { count: "exact", head: true });
  return count ?? 0;
}

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
        name: user.user_metadata?.full_name || user.user_metadata?.name || "マイサービス",
        subscription_status: "free",
        onboarding_completed: false,
      })
      .select("*")
      .single<WorkspaceRow>();

    if (error || !newWorkspace) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500">
            ワークスペースの作成に失敗しました。ページをリロードしてください。
          </p>
        </div>
      );
    }

    const betaUserCount = await getBetaUserCount();
    return <OnboardingLayout workspace={newWorkspace} betaUserCount={betaUserCount} />;
  }

  if (workspace.onboarding_completed) {
    redirect("/dashboard");
  }

  const betaUserCount = await getBetaUserCount();
  return <OnboardingLayout workspace={workspace} betaUserCount={betaUserCount} />;
}
