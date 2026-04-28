// ============================================================================
// 共通 Zod スキーマ — Supabase 戻り値や URL パラメータの型検証用
// ============================================================================
//
// `validations.ts` は API 入力(POST/PATCH body) のバリデーション専用、
// `schemas.ts` は DB row / URL param など 既存型と一致する parse 用、と役割を分離。

import { z } from "zod";

// ── enum / union ────────────────────────────────────────────────────────────

export const widgetTypeSchema = z.enum([
  "carousel",
  "grid",
  "marquee",
  "list",
  "single",
  "wall",
  "dual-marquee",
  "badge",
]);

export const testimonialStatusSchema = z.enum(["pending", "approved", "rejected"]);

export const templateSizeSchema = z.enum(["instagram-story", "instagram-post", "x-post"]);

export const emailOtpTypeSchema = z.enum([
  "signup",
  "recovery",
  "invite",
  "magiclink",
  "email_change",
  "email",
]);

export const salonPageLinkIconSchema = z.enum([
  "line",
  "instagram",
  "phone",
  "mail",
  "map",
  "web",
  "none",
]);

// ── object schemas ──────────────────────────────────────────────────────────

/** WidgetTheme と一致 — 余分なフィールドは passthrough で温存 */
export const widgetThemeSchema = z
  .object({
    mode: z.enum(["light", "dark", "auto"]),
    brandColor: z.string(),
    showRating: z.boolean(),
    showAvatar: z.boolean(),
    showDate: z.boolean(),
    maxItems: z.number(),
    autoplay: z.boolean(),
  })
  .passthrough();

/** TestimonialRow と一致 — DB 戻り値の検証用 */
export const testimonialRowSchema = z
  .object({
    id: z.string(),
    workspace_id: z.string(),
    form_id: z.string().nullable(),
    rating: z.number().nullable(),
    content: z.string(),
    before_story: z.string().nullable(),
    name: z.string(),
    title: z.string().nullable(),
    company: z.string().nullable(),
    avatar_url: z.string().nullable(),
    status: testimonialStatusSchema,
    is_featured: z.boolean(),
    permission_granted: z.boolean(),
    custom_fields: z.record(z.string(), z.union([z.string(), z.boolean(), z.number()])).optional(),
    source: z.string(),
    submitted_at: z.string(),
    created_at: z.string(),
  })
  .passthrough();

/** SalonPageLinkRow と一致 */
export const salonPageLinkRowSchema = z
  .object({
    id: z.string(),
    salon_page_id: z.string(),
    label: z.string(),
    url: z.string(),
    icon: salonPageLinkIconSchema,
    display_order: z.number(),
    created_at: z.string(),
  })
  .passthrough();

/**
 * フォーム質問の最低限のフィールド (id / label) を持つ配列。
 * dashboard/[id]/page.tsx で `forms.questions` を `unknown` から narrowing する用途。
 */
export const formQuestionsMinimalSchema = z.array(
  z
    .object({
      id: z.string(),
      label: z.string(),
    })
    .passthrough()
);

/**
 * 公開ページで使う testimonial 表示用フィールド (TESTIMONIAL_SELECT_COLUMNS と一致)。
 * salon / preview など、status や workspace_id を含めない部分取得クエリ用。
 */
export const testimonialDisplaySchema = z
  .object({
    id: z.string(),
    name: z.string(),
    title: z.string().nullable(),
    company: z.string().nullable(),
    avatar_url: z.string().nullable(),
    rating: z.number().nullable(),
    content: z.string(),
    before_story: z.string().nullable(),
    is_featured: z.boolean(),
    submitted_at: z.string(),
  })
  .passthrough();
