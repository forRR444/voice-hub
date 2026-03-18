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
    return <FormsClient workspace={null as any} forms={[]} submissionCounts={{}} subscriptionStatus="free" />;
  }

  const { data: forms } = await supabase
    .from("forms")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  const formList = forms ?? [];
  const formIds = formList.map((f: { id: string }) => f.id);

  let submissionCounts: Record<string, number> = {};
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
