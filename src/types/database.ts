export type WorkspaceRow = {
  id: string;
  user_id: string;
  name: string;
  onboarding_completed: boolean;
  subscription_status: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
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
  type: "star_rating" | "text" | "textarea" | "image" | "checkbox" | "select";
  required: boolean;
  placeholder?: string;
  options?: string[];
  enabled?: boolean;
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
  custom_fields?: Record<string, string | boolean | number>;
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
  type: "carousel" | "grid" | "marquee" | "list" | "single" | "wall" | "dual-marquee" | "badge";
  theme: WidgetTheme;
  filter_min_rating: number;
  only_featured: boolean;
  created_at: string;
};

export type WidgetTheme = {
  mode: "light" | "dark" | "auto";
  brandColor: string;
  showRating: boolean;
  showAvatar: boolean;
  showDate: boolean;
  maxItems: number;
  autoplay: boolean;
};

export type SalonTheme = "natural" | "modern" | "elegant";
export type SalonReviewLayout = "list" | "grid" | "card" | "wall";

export type SalonMenuItem = {
  name: string;
  price: string;
  description: string;
};

export type SalonBusinessHours = {
  text: string;
};

export type SalonPageRow = {
  id: string;
  workspace_id: string;
  salon_name: string;
  tagline: string | null;
  logo_url: string | null;
  theme: SalonTheme;
  accent_color: string;
  cover_image_url: string | null;
  cover_image_position: number;
  review_layout: SalonReviewLayout;
  is_published: boolean;
  slug: string;
  description: string | null;
  address: string | null;
  google_map_url: string | null;
  business_hours: SalonBusinessHours | null;
  closed_days: string | null;
  menu_items: SalonMenuItem[] | null;
  created_at: string;
  updated_at: string;
};

export type SalonPageLinkIcon =
  | "line"
  | "instagram"
  | "phone"
  | "mail"
  | "map"
  | "web"
  | "none";

export type SalonPageLinkRow = {
  id: string;
  salon_page_id: string;
  label: string;
  url: string;
  icon: SalonPageLinkIcon;
  display_order: number;
  created_at: string;
};

export type SubscriptionStatus = "free" | "pro" | "canceled";

// Plan limits
export const PLAN_LIMITS = {
  free: {
    testimonials: Infinity,
    forms: Infinity,
    widgets: Infinity,
    dashboardTestimonials: 10,
    displayTestimonials: 5,
    showBadge: true,
  },
  pro: {
    testimonials: Infinity,
    forms: Infinity,
    widgets: Infinity,
    dashboardTestimonials: Infinity,
    displayTestimonials: Infinity,
    showBadge: false,
  },
} as const;
