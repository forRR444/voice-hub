import Stripe from "stripe";

/**
 * Stripe オブジェクトから customer ID を取得する
 */
export function getStripeCustomerId(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
): string | undefined {
  if (!customer) return undefined;
  return typeof customer === "string" ? customer : customer.id;
}

/**
 * Stripe オブジェクトから subscription ID を取得する
 */
export function getStripeSubscriptionId(
  subscription: string | Stripe.Subscription | null,
): string | undefined {
  if (!subscription) return undefined;
  return typeof subscription === "string" ? subscription : subscription.id;
}
