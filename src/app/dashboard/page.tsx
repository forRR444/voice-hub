import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TestimonialRow, TestimonialWithTags } from "@/types/database";
import { DEFAULT_BRAND_COLOR } from "@/lib/constants";
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

  // Run queries in parallel
  const [
    { data: testimonials },
    { data: forms },
  ] = await Promise.all([
    supabase
      .from("testimonials")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("submitted_at", { ascending: false }),
    supabase
      .from("forms")
      .select("id, slug, title, brand_color, questions")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false }),
  ]);

  const testimonialList = (testimonials ?? []) as TestimonialRow[];

  const ids = testimonialList.map((t) => t.id);
  const { data: tagRows } = ids.length > 0
    ? await supabase
        .from("testimonial_tags")
        .select("*")
        .in("testimonial_id", ids)
    : { data: [] };

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

  const brandColor = (forms ?? [])[0]?.brand_color || DEFAULT_BRAND_COLOR;

  return (
    <DashboardClient
      workspace={workspace}
      testimonials={testimonialsWithTags}
      forms={(forms ?? []) as { id: string; slug: string; title: string; brand_color: string; questions: import("@/types/database").FormQuestion[] }[]}
      brandColor={brandColor}
    />
  );
}
