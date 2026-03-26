import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FormsClient from "./forms-client";

export const dynamic = "force-dynamic";

export default async function FormsPage() {
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

  const { data: forms } = await supabase
    .from("forms")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  const formList = forms ?? [];
  const formIds = formList.map((f: { id: string }) => f.id);

  const submissionCounts: Record<string, number> = {};
  if (formIds.length > 0) {
    const { data: testimonials } = await supabase
      .from("testimonials")
      .select("form_id")
      .in("form_id", formIds);

    (testimonials ?? []).forEach((t: { form_id: string | null }) => {
      if (t.form_id) {
        submissionCounts[t.form_id] = (submissionCounts[t.form_id] ?? 0) + 1;
      }
    });
  }

  const subscriptionStatus = (workspace as Record<string, unknown>).subscription_status as string ?? "free";

  return (
    <FormsClient
      workspace={workspace}
      forms={formList}
      submissionCounts={submissionCounts}
      subscriptionStatus={subscriptionStatus}
    />
  );
}
