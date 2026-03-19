import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsClient from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
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
    redirect("/onboarding");
  }

  const subscriptionStatus = (workspace as Record<string, unknown>).subscription_status as string ?? "free";

  const { count: testimonialCount } = await supabase
    .from("testimonials")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspace.id);

  const { count: formCount } = await supabase
    .from("forms")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspace.id);

  const { count: widgetCount } = await supabase
    .from("widgets")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspace.id);

  return (
    <SettingsClient
      workspace={workspace}
      subscriptionStatus={subscriptionStatus}
      usage={{
        testimonials: testimonialCount ?? 0,
        forms: formCount ?? 0,
        widgets: widgetCount ?? 0,
      }}
    />
  );
}
