import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { FormRow } from "@/types/database";
import type { Metadata } from "next";
import { FormClient } from "./form-client";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: form } = await supabase
    .from("forms")
    .select("title, description")
    .eq("slug", slug)
    .single();

  if (!form) {
    return { title: "フォームが見つかりません" };
  }

  return {
    title: form.title,
    description: form.description || undefined,
  };
}

export default async function FormPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: form, error } = await supabase
    .from("forms")
    .select("*")
    .eq("slug", slug)
    .single<FormRow>();

  if (error || !form) {
    notFound();
  }

  return <FormClient form={form} />;
}
