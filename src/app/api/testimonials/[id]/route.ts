import { NextRequest } from "next/server";
import { z } from "zod";
import { testimonialUpdateSchema } from "@/lib/validations";
import { requireAuthAndWorkspace } from "@/lib/api-auth";
import { checkRateLimit, handleApiError, validationErrorResponse } from "@/lib/api-utils";
import { apiError, apiSuccess } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/constants";

const idParamSchema = z.object({ id: z.string().uuid() });

const patchBodySchema = testimonialUpdateSchema.pick({ status: true, is_featured: true });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthAndWorkspace();
    if (!auth.ok) return auth.response;
    const { supabase, workspace } = auth;

    const { limit, windowMs } = RATE_LIMITS.testimonialUpdate;
    const rateLimited = await checkRateLimit(`testimonial-update:${workspace.id}`, limit, windowMs);
    if (rateLimited) return rateLimited;

    const resolvedParams = await params;
    const parsedParams = idParamSchema.safeParse(resolvedParams);
    if (!parsedParams.success) {
      return apiError("IDが必要です", 400, "VALIDATION_ERROR");
    }

    const body = await request.json();
    const parsedBody = patchBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return validationErrorResponse(parsedBody.error, "Testimonial update validation error");
    }

    const id = parsedParams.data.id;

    // ownership 検証
    const { data: existing, error: existingError } = await supabase
      .from("testimonials")
      .select("id, workspace_id")
      .eq("id", id)
      .maybeSingle();
    if (existingError) {
      return handleApiError(existingError, "更新に失敗しました");
    }
    if (!existing || existing.workspace_id !== workspace.id) {
      return apiError("テスティモニアルが見つかりません", 404, "NOT_FOUND");
    }

    const { error: updateError } = await supabase
      .from("testimonials")
      .update(parsedBody.data)
      .eq("id", id)
      .eq("workspace_id", workspace.id);

    if (updateError) {
      return handleApiError(updateError, "更新に失敗しました");
    }

    return apiSuccess(null);
  } catch (error) {
    return handleApiError(error, "更新に失敗しました");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthAndWorkspace();
    if (!auth.ok) return auth.response;
    const { supabase, workspace } = auth;

    const { limit, windowMs } = RATE_LIMITS.testimonialDelete;
    const rateLimited = await checkRateLimit(`testimonial-delete:${workspace.id}`, limit, windowMs);
    if (rateLimited) return rateLimited;

    const resolvedParams = await params;
    const parsedParams = idParamSchema.safeParse(resolvedParams);
    if (!parsedParams.success) {
      return apiError("IDが必要です", 400, "VALIDATION_ERROR");
    }

    const id = parsedParams.data.id;

    // ownership 検証
    const { data: existing, error: existingError } = await supabase
      .from("testimonials")
      .select("id, workspace_id")
      .eq("id", id)
      .maybeSingle();
    if (existingError) {
      return handleApiError(existingError, "削除に失敗しました");
    }
    if (!existing || existing.workspace_id !== workspace.id) {
      return apiError("テスティモニアルが見つかりません", 404, "NOT_FOUND");
    }

    const { error: deleteError } = await supabase
      .from("testimonials")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspace.id);

    if (deleteError) {
      return handleApiError(deleteError, "削除に失敗しました");
    }

    return apiSuccess(null);
  } catch (error) {
    return handleApiError(error, "削除に失敗しました");
  }
}
