import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { testimonialSubmitSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = testimonialSubmitSchema.safeParse(body);

    if (!parsed.success) {
      console.error("Validation error:", JSON.stringify(parsed.error.flatten()));
      return NextResponse.json(
        { error: "入力内容に不備があります", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const supabase = await createClient();

    // Look up the form to get workspace_id
    const { data: form, error: formError } = await supabase
      .from("forms")
      .select("id, workspace_id")
      .eq("id", data.form_id)
      .single();

    if (formError || !form) {
      return NextResponse.json(
        { error: "フォームが見つかりません" },
        { status: 404 }
      );
    }

    const { error: insertError } = await supabase
      .from("testimonials")
      .insert({
        workspace_id: form.workspace_id,
        form_id: form.id,
        rating: data.rating,
        content: data.content,
        before_story: data.before_story || null,
        name: data.name,
        title: data.title || null,
        avatar_url: data.avatar_url || null,
        status: "pending" as const,
        is_featured: false,
        permission_granted: data.permission_granted,
        source: "form",
        submitted_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error("Testimonial insert error:", insertError);
      return NextResponse.json(
        { error: "送信に失敗しました。もう一度お試しください。" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
