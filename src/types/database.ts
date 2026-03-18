export type WorkspaceRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type FormRow = {
  id: string;
  workspace_id: string;
  slug: string;
  title: string;
  description: string | null;
  questions: FormQuestion[];
  brand_color: string;
  logo_url: string | null;
  thank_you_message: string;
  created_at: string;
};

export type FormQuestion = {
  id: string;
  label: string;
  type: "star_rating" | "text" | "textarea" | "image" | "checkbox";
  required: boolean;
  placeholder?: string;
};

export type TestimonialRow = {
  id: string;
  workspace_id: string;
  form_id: string | null;
  rating: number | null;
  content: string;
  before_story: string | null;
  name: string;
  title: string | null;
  company: string | null;
  avatar_url: string | null;
  status: "pending" | "approved" | "rejected";
  is_featured: boolean;
  permission_granted: boolean;
  source: string;
  submitted_at: string;
  created_at: string;
};

export type TestimonialWithTags = TestimonialRow & {
  tags: string[];
};

export type WidgetRow = {
  id: string;
  workspace_id: string;
  name: string;
  type: "carousel" | "grid" | "marquee" | "list" | "single";
  theme: WidgetTheme;
  filter_min_rating: number;
  only_featured: boolean;
  created_at: string;
};

export type WidgetTheme = {
  mode: "light" | "dark";
  brandColor: string;
  showRating: boolean;
  showAvatar: boolean;
  showDate: boolean;
  maxItems: number;
  autoplay: boolean;
};

export type TestimonialTagRow = {
  testimonial_id: string;
  tag: string;
};

export type SubscriptionStatus = "free" | "pro" | "canceled";

export type UserProfile = {
  workspace: WorkspaceRow;
  subscription: SubscriptionStatus;
  testimonial_count: number;
  form_count: number;
  widget_count: number;
};

// Plan limits
export const PLAN_LIMITS = {
  free: {
    testimonials: Infinity,
    forms: Infinity,
    widgets: Infinity,
    showBadge: true,
  },
  pro: {
    testimonials: Infinity,
    forms: Infinity,
    widgets: Infinity,
    showBadge: false,
  },
} as const;
