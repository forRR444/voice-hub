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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <svg className="w-10 h-10 mx-auto mb-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-xl font-bold text-gray-900">登録が完了しました</h1>
          </div>
          <OnboardingClient workspace={newWorkspace} betaUserCount={totalUsers1 ?? 0} />
        </div>
      </div>
    );
  }

  if (workspace.onboarding_completed) {
    redirect("/dashboard");
  }

  const admin = createAdminClient();
  const { count: totalUsers2 } = await admin.from("workspaces").select("id", { count: "exact", head: true });
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
            <svg className="w-10 h-10 mx-auto mb-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-xl font-bold text-gray-900">登録が完了しました</h1>
          </div>
        <OnboardingClient workspace={workspace} betaUserCount={totalUsers2 ?? 0} />
      </div>
    </div>
  );
}
