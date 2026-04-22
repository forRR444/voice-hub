import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { testimonialSubmitSchema } from "@/lib/validations";
import { getClientIp, checkRateLimit, handleApiError } from "@/lib/api-utils";
import { logError } from "@/lib/logger";
import { RATE_LIMITS } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ハニーポット: ボットがこのフィールドを埋めたら拒否
    if (body.website || body.url || body.email_confirm) {
      return NextResponse.json({ success: true }); // ボットには成功に見せる
    }

    const parsed = testimonialSubmitSchema.safeParse(body);

    const ip = getClientIp(request);
    const formId = parsed.success ? parsed.data.form_id : "unknown";
    const { limit, windowMs } = RATE_LIMITS.testimonialSubmit;
    const rateLimited = await checkRateLimit(`testimonial:${ip}:${formId}`, limit, windowMs);
    if (rateLimited) return rateLimited;

    if (!parsed.success) {
      logError("Validation error:", JSON.stringify(parsed.error.flatten()));
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
        rating: data.rating ?? null,
        content: data.content ?? "",
        before_story: data.before_story || null,
        name: data.name ?? "",
        title: data.title || null,
        avatar_url: data.avatar_url || null,
        status: "pending" as const,
        is_featured: false,
        permission_granted: data.permission_granted,
        custom_fields: data.custom_fields || {},
        source: "form",
        submitted_at: new Date().toISOString(),
      });

    if (insertError) {
      logError("Testimonial insert error:", insertError);
      return NextResponse.json(
        { error: "送信に失敗しました。もう一度お試しください。" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

const deleteSchema = z.object({ id: z.string().min(1) });

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
  }

  const { error } = await supabase
    .from("testimonials")
    .delete()
    .eq("id", parsed.data.id)
    .eq("workspace_id", workspace.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
