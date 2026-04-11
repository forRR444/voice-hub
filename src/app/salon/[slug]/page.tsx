import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TESTIMONIAL_SELECT_COLUMNS } from "@/lib/constants";
import { getBaseUrl } from "@/lib/utils";
import type { SalonPageRow, SalonPageLinkRow, TestimonialRow } from "@/types/database";
import type { Metadata } from "next";
import SalonPageClient from "./salon-page-client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: salonPage } = await supabase
    .from("salon_pages")
    .select("salon_name, tagline, logo_url, is_published")
    .eq("slug", slug)
    .single();

  if (!salonPage || !salonPage.is_published) {
    return { title: "ページが見つかりません" };
  }

  const title = `${salonPage.salon_name} | お客様の声`;
  const description = salonPage.tagline || `${salonPage.salon_name}のお客様の声をご覧ください`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: salonPage.logo_url
        ? [{ url: salonPage.logo_url, width: 400, height: 400 }]
        : undefined,
      url: `${getBaseUrl()}/salon/${slug}`,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function SalonPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: salonPage, error } = await supabase
    .from("salon_pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single<SalonPageRow>();

  if (error || !salonPage) {
    notFound();
  }

  const { data: links } = await supabase
    .from("salon_page_links")
    .select("*")
    .eq("salon_page_id", salonPage.id)
    .order("display_order", { ascending: true });

  const { data: testimonials } = await supabase
    .from("testimonials")
    .select(TESTIMONIAL_SELECT_COLUMNS)
    .eq("workspace_id", salonPage.workspace_id)
    .eq("status", "approved")
    .not("source", "in", '("sample","guide")')
    .order("submitted_at", { ascending: false })
    .limit(50);

  const approvedTestimonials = (testimonials ?? []) as Pick<
    TestimonialRow,
    "id" | "name" | "title" | "company" | "avatar_url" | "rating" | "content" | "before_story" | "is_featured" | "submitted_at"
  >[];

  const totalCount = approvedTestimonials.length;
  const avgRating =
    totalCount > 0
      ? approvedTestimonials.reduce((sum, t) => sum + (t.rating ?? 0), 0) / totalCount
      : 0;

  return (
    <SalonPageClient
      salonPage={salonPage}
      links={(links as SalonPageLinkRow[]) ?? []}
      testimonials={approvedTestimonials}
      avgRating={avgRating}
      totalCount={totalCount}
    />
  );
}
