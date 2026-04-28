import { NextRequest } from "next/server";
import { salonPageUpsertSchema } from "@/lib/validations";
import { requireAuthAndWorkspace } from "@/lib/api-auth";
import { checkRateLimit, handleApiError, validationErrorResponse } from "@/lib/api-utils";
import { apiSuccess } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/constants";
import { generateUniqueSalonSlug } from "@/lib/utils";

export async function PUT(request: NextRequest) {
  const auth = await requireAuthAndWorkspace();
  if (!auth.ok) return auth.response;
  const { supabase, workspace } = auth;

  // ワークスペース単位のレート制限
  const { limit, windowMs } = RATE_LIMITS.salonPageSave;
  const rateLimited = await checkRateLimit(`salon-page-save:${workspace.id}`, limit, windowMs);
  if (rateLimited) return rateLimited;

  const body = await request.json();
  const parsed = salonPageUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error, "Salon page validation error");
  }

  const data = parsed.data;

  // 既存 salon_page を取得（無ければ slug を新規生成）
  const { data: existing, error: existingError } = await supabase
    .from("salon_pages")
    .select("id, slug")
    .eq("workspace_id", workspace.id)
    .maybeSingle();
  if (existingError) {
    return handleApiError(existingError, "サロンページの取得に失敗しました");
  }

  let slug: string;
  if (existing?.slug) {
    slug = existing.slug;
  } else {
    try {
      slug = await generateUniqueSalonSlug(supabase);
    } catch (err) {
      return handleApiError(err, "slug の生成に失敗しました");
    }
  }

  const business_hours = data.business_hours ?? null;
  const menu_items = data.menu_items ?? null;

  const { data: upserted, error: upsertError } = await supabase
    .from("salon_pages")
    .upsert(
      {
        workspace_id: workspace.id,
        salon_name: data.salon_name,
        tagline: data.tagline ?? null,
        logo_url: data.logo_url ?? null,
        theme: data.theme,
        accent_color: data.accent_color,
        cover_image_url: data.cover_image_url ?? null,
        cover_image_position: data.cover_image_position ?? 50,
        review_layout: data.review_layout,
        is_published: data.is_published,
        slug,
        description: data.description ?? null,
        address: data.address ?? null,
        google_map_url: data.google_map_url ? data.google_map_url : null,
        business_hours,
        closed_days: data.closed_days ?? null,
        menu_items,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id" }
    )
    .select("id, slug")
    .single();

  if (upsertError || !upserted) {
    return handleApiError(upsertError, "サロンページの保存に失敗しました");
  }

  // 既存リンクを全削除して再挿入（workspace 所有権の二重防御込み）
  const { error: deleteError } = await supabase
    .from("salon_page_links")
    .delete()
    .eq("salon_page_id", upserted.id);
  if (deleteError) {
    return handleApiError(deleteError, "リンクの削除に失敗しました");
  }

  if (data.links.length > 0) {
    const { error: insertError } = await supabase.from("salon_page_links").insert(
      data.links.map((l, i) => ({
        salon_page_id: upserted.id,
        label: l.label,
        url: l.url,
        icon: l.icon,
        display_order: i,
      }))
    );
    if (insertError) {
      return handleApiError(insertError, "リンクの保存に失敗しました");
    }
  }

  return apiSuccess({ id: upserted.id, slug: upserted.slug });
}
