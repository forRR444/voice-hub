import { z } from "zod";
import { DEFAULT_BRAND_COLOR } from "@/lib/constants";

const safeUrlSchema = z
  .string()
  .url()
  .regex(/^https?:\/\//, {
    message: "HTTPまたはHTTPS URLのみ許可されています",
  });

export const testimonialSubmitSchema = z.object({
  form_id: z.string().min(1),
  rating: z.number().min(1).max(5).optional(),
  content: z.string().min(1).max(5000).optional(),
  before_story: z.string().max(5000).optional(),
  name: z.string().max(100).optional(),
  title: z.string().max(100).optional(),
  avatar_url: safeUrlSchema.optional().nullable(),
  permission_granted: z.boolean(),
  custom_fields: z.record(z.string(), z.union([z.string(), z.boolean(), z.number()])).optional(),
});

export const testimonialUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  is_featured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export const testimonialManualCreateSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  content: z.string().min(1).max(5000),
  name: z.string().min(1).max(100),
  title: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  avatar_url: safeUrlSchema.optional().nullable(),
  status: z.enum(["pending", "approved", "rejected"]).default("approved"),
  source: z.string().default("manual"),
});

export const widgetCreateSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(["carousel", "grid", "marquee", "list", "single", "wall", "dual-marquee", "badge"]),
  theme: z
    .object({
      mode: z.enum(["light", "dark", "auto"]).default("light"),
      brandColor: z.string().default(DEFAULT_BRAND_COLOR),
      showRating: z.boolean().default(true),
      showAvatar: z.boolean().default(false),
      showDate: z.boolean().default(false),
      maxItems: z.number().min(1).max(50).default(10),
      autoplay: z.boolean().default(true),
    })
    .optional(),
  filter_min_rating: z.number().min(1).max(5).default(1),
  only_featured: z.boolean().default(false),
});

export const widgetUpdateSchema = widgetCreateSchema.partial();

const formQuestionSchema = z.object({
  id: z.string().min(1).max(50),
  label: z.string().min(1).max(200),
  type: z.enum(["star_rating", "text", "textarea", "image", "checkbox", "select"]),
  required: z.boolean(),
  placeholder: z.string().max(200).optional(),
  options: z.array(z.string().max(100)).max(20).optional(),
  enabled: z.boolean().optional(),
});

export const formCreateSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "slugは英小文字・数字・ハイフンのみ"),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  brand_color: z.string().min(1).max(20),
  thank_you_message: z.string().max(500).optional(),
  questions: z.array(formQuestionSchema).min(1).max(20),
});

export const formUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  brand_color: z.string().optional(),
  logo_url: z.string().url().optional().nullable(),
  thank_you_message: z.string().max(500).optional(),
  questions: z.array(formQuestionSchema).min(1).max(20).optional(),
});

// サロンページ
export const salonLinkSchema = z.object({
  label: z.string().min(1, "ラベルを入力してください").max(30),
  url: z.string().url("有効なURLを入力してください"),
});

const salonMenuItemSchema = z.object({
  name: z.string().min(1, "メニュー名を入力してください").max(50),
  price: z.string().max(30),
  description: z.string().max(100),
});

const salonBusinessHoursSchema = z.object({
  text: z.string().max(300),
});

export const salonPageSchema = z.object({
  salon_name: z.string().min(1, "サロン名を入力してください").max(50),
  tagline: z.string().max(100, "100文字以内で入力してください").optional(),
  theme: z.enum(["natural", "modern", "elegant"]),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "有効なカラーコードを入力してください"),
  links: z.array(salonLinkSchema).max(3),
  description: z.string().max(2000).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  google_map_url: z.string().url().regex(/^https:\/\//).optional().nullable().or(z.literal("")),
  business_hours: salonBusinessHoursSchema.optional().nullable(),
  closed_days: z.string().max(100).optional().nullable(),
  menu_items: z.array(salonMenuItemSchema).max(20).optional().nullable(),
});
