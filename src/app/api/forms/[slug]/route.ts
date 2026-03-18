import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: form, error } = await supabase
    .from("forms")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !form) {
    return NextResponse.json(
      { error: "フォームが見つかりません" },
      { status: 404 }
    );
  }

  return NextResponse.json(form);
}
