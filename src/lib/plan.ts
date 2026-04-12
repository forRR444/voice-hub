import { PLAN_LIMITS, SubscriptionStatus } from "@/types/database";

export const IS_BETA = process.env.NEXT_PUBLIC_BETA_MODE === "true";

export type PlanTier = "free" | "pro";

export function getEffectivePlan(subscriptionStatus: SubscriptionStatus): PlanTier {
  if (IS_BETA) return "pro";
  return subscriptionStatus === "pro" ? "pro" : "free";
}

export function getPlanLimits(subscriptionStatus: SubscriptionStatus) {
  const plan = getEffectivePlan(subscriptionStatus);
  return PLAN_LIMITS[plan];
}

export function canCreateForm(formCount: number, subscriptionStatus: SubscriptionStatus): boolean {
  return formCount < getPlanLimits(subscriptionStatus).forms;
}

export function canCreateWidget(widgetCount: number, subscriptionStatus: SubscriptionStatus): boolean {
  return widgetCount < getPlanLimits(subscriptionStatus).widgets;
}

export function shouldShowBadge(subscriptionStatus: SubscriptionStatus): boolean {
  return getPlanLimits(subscriptionStatus).showBadge;
}

export function getTestimonialDisplayLimit(subscriptionStatus: SubscriptionStatus): number {
  return getPlanLimits(subscriptionStatus).displayTestimonials;
}

export function getDashboardViewLimit(subscriptionStatus: SubscriptionStatus): number {
  return getPlanLimits(subscriptionStatus).dashboardTestimonials;
}

/** DB等から取得した raw 値を SubscriptionStatus に安全に変換する */
export function toSubscriptionStatus(raw: unknown): SubscriptionStatus {
  return raw === "pro" || raw === "canceled" ? raw : "free";
}
