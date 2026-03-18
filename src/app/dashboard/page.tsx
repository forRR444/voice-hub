import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TestimonialRow, TestimonialWithTags } from "@/types/database";
import DashboardClient from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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

  const { data: testimonials } = await supabase
    .from("testimonials")
    .select("*")
    .eq("workspace_id", workspace.id)
    .order("submitted_at", { ascending: false });

  const testimonialList = (testimonials ?? []) as TestimonialRow[];

  const ids = testimonialList.map((t) => t.id);
  const { data: tagRows } = await supabase
    .from("testimonial_tags")
    .select("*")
    .in("testimonial_id", ids.length > 0 ? ids : ["__none__"]);

  const tagMap: Record<string, string[]> = {};
  (tagRows ?? []).forEach((row: { testimonial_id: string; tag: string }) => {
    if (!tagMap[row.testimonial_id]) tagMap[row.testimonial_id] = [];
    tagMap[row.testimonial_id].push(row.tag);
  });

  const testimonialsWithTags: TestimonialWithTags[] = testimonialList.map(
    (t) => ({
      ...t,
      tags: tagMap[t.id] ?? [],
    })
  );

  const { data: forms } = await supabase
    .from("forms")
    .select("id, slug")
    .eq("workspace_id", workspace.id)
    .limit(1);

  const formSlug = forms?.[0]?.slug ?? null;

  return (
    <DashboardClient
      workspace={workspace}
      testimonials={testimonialsWithTags}
      formSlug={formSlug}
    />
  );
}
