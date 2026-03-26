import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TestimonialDetailClient from "./detail-client";
import { DEFAULT_BRAND_COLOR } from "@/lib/constants";

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

  // Run queries in parallel
  const [
    { data: testimonial },
    { data: tagRows },
    { data: forms },
  ] = await Promise.all([
    supabase
      .from("testimonials")
      .select("*")
      .eq("id", id)
      .eq("workspace_id", workspace.id)
      .single(),
    supabase
      .from("testimonial_tags")
      .select("tag")
      .eq("testimonial_id", id),
    supabase
      .from("forms")
      .select("brand_color, questions")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  if (!testimonial) notFound();

  const tags = (tagRows ?? []).map((r: { tag: string }) => r.tag);
  const brandColor = forms?.[0]?.brand_color || DEFAULT_BRAND_COLOR;

  // Get question labels from the form linked to this testimonial
  const questionLabels: Record<string, string> = {};
  if (testimonial.form_id) {
    // Check if the form is already in our fetched forms
    const linkedForm = forms?.find((f: { brand_color: string; questions: { id: string; label: string }[] }) =>
      testimonial.form_id && f.questions
    );
    if (linkedForm?.questions) {
      for (const q of linkedForm.questions as { id: string; label: string }[]) {
        questionLabels[q.id] = q.label;
      }
    } else {
      const { data: form } = await supabase
        .from("forms")
        .select("questions")
        .eq("id", testimonial.form_id)
        .single();
      if (form?.questions) {
        for (const q of form.questions as { id: string; label: string }[]) {
          questionLabels[q.id] = q.label;
        }
      }
    }
  }

  return (
    <TestimonialDetailClient
      testimonial={{ ...testimonial, tags }}
      brandColor={brandColor}
      questionLabels={questionLabels}
    />
  );
}
