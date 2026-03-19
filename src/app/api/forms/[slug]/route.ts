import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Rate limit: 60 requests per IP per minute
  const forwarded = _request.headers.get("x-forwarded-for");
  const realIp = _request.headers.get("x-real-ip");
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "unknown";
  const { success: withinLimit } = rateLimit(`form-get:${ip}`, 60, 60 * 1000);
  if (!withinLimit) {
    return NextResponse.json(
      { error: "リクエスト数の制限に達しました。しばらくしてからもう一度お試しください。" },
      { status: 429 }
    );
  }

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
