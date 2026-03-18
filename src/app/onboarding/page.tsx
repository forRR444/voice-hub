import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">ワークスペースを準備中...</p>
      </div>
    );
  }

  if (workspace.onboarding_completed) {
    redirect("/dashboard");
  }

  return <OnboardingClient workspace={workspace} />;
}
