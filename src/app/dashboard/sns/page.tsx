import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TestimonialRow, TestimonialWithTags } from "@/types/database";
import { DEFAULT_BRAND_COLOR } from "@/lib/constants";
import SnsClient from "./sns-client";

export const dynamic = "force-dynamic";

export default async function SnsPage() {
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

  if (!workspace) redirect("/dashboard");

  const [{ data: testimonials }, { data: forms }] = await Promise.all([
    supabase
      .from("testimonials")
      .select("*")
      .eq("workspace_id", workspace.id)
      .eq("status", "approved")
      .not("source", "in", '("sample","guide")')
      .order("submitted_at", { ascending: false }),
    supabase.from("forms").select("brand_color").eq("workspace_id", workspace.id).limit(1),
  ]);

  const testimonialList = (testimonials ?? []) as TestimonialRow[];

  const ids = testimonialList.map((t) => t.id);
  const { data: tagRows } =
    ids.length > 0
      ? await supabase.from("testimonial_tags").select("*").in("testimonial_id", ids)
      : { data: [] };

  const tagMap: Record<string, string[]> = {};
  (tagRows ?? []).forEach((row: { testimonial_id: string; tag: string }) => {
    if (!tagMap[row.testimonial_id]) tagMap[row.testimonial_id] = [];
    tagMap[row.testimonial_id].push(row.tag);
  });

  const testimonialsWithTags: TestimonialWithTags[] = testimonialList.map((t) => ({
    ...t,
    tags: tagMap[t.id] ?? [],
  }));

  const brandColor = (forms ?? [])[0]?.brand_color || DEFAULT_BRAND_COLOR;

  return <SnsClient testimonials={testimonialsWithTags} brandColor={brandColor} />;
}
