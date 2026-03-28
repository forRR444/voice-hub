import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientIp, checkRateLimit } from "@/lib/api-utils";
import { RATE_LIMITS } from "@/lib/constants";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = getClientIp(_request);
  const { limit, windowMs } = RATE_LIMITS.formGet;
  const rateLimited = await checkRateLimit(`form-get:${ip}`, limit, windowMs);
  if (rateLimited) return rateLimited;

  const { slug } = await params;
  const supabase = await createClient();

  const { data: form, error } = await supabase
    .from("forms")
    .select("id, slug, title, description, questions, brand_color, logo_url, thank_you_message")
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
