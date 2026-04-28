import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { testimonialSubmitSchema } from "@/lib/validations";
import {
  getClientIp,
  checkRateLimit,
  handleApiError,
  validationErrorResponse,
} from "@/lib/api-utils";
import { apiError, apiSuccess } from "@/lib/api-response";
import { createWorkspaceDeleteHandler } from "@/lib/api-auth";
import { logError } from "@/lib/logger";
import { RATE_LIMITS } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ハニーポット: ボットがこのフィールドを埋めたら拒否
    if (body.website || body.url || body.email_confirm) {
      // 意図的に旧形状を維持: ApiResponse 統一対象から除外。bot に通常応答との差を与えないため。
      return NextResponse.json({ success: true });
    }

    const parsed = testimonialSubmitSchema.safeParse(body);

    const ip = getClientIp(request);
    const formId = parsed.success ? parsed.data.form_id : "unknown";
    const { limit, windowMs } = RATE_LIMITS.testimonialSubmit;
    const rateLimited = await checkRateLimit(`testimonial:${ip}:${formId}`, limit, windowMs);
    if (rateLimited) return rateLimited;

    if (!parsed.success) {
      return validationErrorResponse(parsed.error, "Validation error");
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
      return apiError("フォームが見つかりません", 404, "NOT_FOUND");
    }

    const { error: insertError } = await supabase.from("testimonials").insert({
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
      return apiError("送信に失敗しました。もう一度お試しください。", 500, "INTERNAL_ERROR");
    }

    return apiSuccess(null);
  } catch (error) {
    return handleApiError(error);
  }
}

export const DELETE = createWorkspaceDeleteHandler("testimonials");
