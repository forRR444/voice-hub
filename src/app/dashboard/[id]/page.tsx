import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TestimonialDetailClient from "./detail-client";

export const dynamic = "force-dynamic";

export default async function TestimonialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  if (!workspace) notFound();

  const { data: testimonial } = await supabase
    .from("testimonials")
    .select("*")
    .eq("id", id)
    .eq("workspace_id", workspace.id)
    .single();

  if (!testimonial) notFound();

  const { data: tagRows } = await supabase
    .from("testimonial_tags")
    .select("tag")
    .eq("testimonial_id", id);

  const tags = (tagRows ?? []).map((r: { tag: string }) => r.tag);

  const { data: forms } = await supabase
    .from("forms")
    .select("brand_color")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false })
    .limit(1);

  const brandColor = forms?.[0]?.brand_color || "#635BFF";

  return (
    <TestimonialDetailClient testimonial={{ ...testimonial, tags }} brandColor={brandColor} />
  );
}
