import { z } from "zod";

const safeUrlSchema = z
  .string()
  .url()
  .regex(/^https?:\/\//, {
    message: "HTTPまたはHTTPS URLのみ許可されています",
  });

export const testimonialSubmitSchema = z.object({
  form_id: z.string().min(1),
  rating: z.number().min(1).max(5),
  content: z.string().min(1).max(5000),
  before_story: z.string().max(5000).optional(),
  name: z.string().min(1).max(100),
  title: z.string().max(100).optional(),
  avatar_url: safeUrlSchema.optional().nullable(),
  permission_granted: z.boolean(),
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
  type: z.enum(["carousel", "grid", "marquee"]),
  theme: z
    .object({
      mode: z.enum(["light", "dark"]).default("light"),
      brandColor: z.string().default("#6366f1"),
      showRating: z.boolean().default(true),
      showAvatar: z.boolean().default(true),
      showDate: z.boolean().default(false),
      maxItems: z.number().min(1).max(50).default(10),
      autoplay: z.boolean().default(true),
    })
    .optional(),
  filter_min_rating: z.number().min(1).max(5).default(1),
  only_featured: z.boolean().default(false),
});

export const widgetUpdateSchema = widgetCreateSchema.partial();

export const formUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  brand_color: z.string().optional(),
  logo_url: z.string().url().optional().nullable(),
  thank_you_message: z.string().max(500).optional(),
});
