import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    return <WidgetsClient workspace={null as any} widgets={[]} subscriptionStatus="free" />;
  }

  const { data: widgets } = await supabase
    .from("widgets")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  const subscriptionStatus = (workspace as Record<string, unknown>).subscription_status as string ?? "free";

  return (
    <WidgetsClient
      workspace={workspace}
      widgets={widgets ?? []}
      subscriptionStatus={subscriptionStatus}
    />
  );
}
