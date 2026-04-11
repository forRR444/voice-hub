import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SalonPageRow, SalonPageLinkRow } from "@/types/database";
import SalonPageSettingsClient from "./salon-page-client";

export const dynamic = "force-dynamic";

export default async function SalonPageSettings() {
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

  const { data: salonPage } = await supabase
    .from("salon_pages")
    .select("*")
    .eq("workspace_id", workspace.id)
    .single<SalonPageRow>();

  let links: SalonPageLinkRow[] = [];
  if (salonPage) {
    const { data } = await supabase
      .from("salon_page_links")
      .select("*")
      .eq("salon_page_id", salonPage.id)
      .order("display_order", { ascending: true });
    links = (data as SalonPageLinkRow[]) ?? [];
  }

  return (
    <SalonPageSettingsClient
      workspace={workspace}
      initialSalonPage={salonPage}
      initialLinks={links}
    />
  );
}
