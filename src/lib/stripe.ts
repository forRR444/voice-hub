import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia" as any,
      typescript: true,
    });
  }
  return _stripe;
}

export const STRIPE_PRICES = {
  pro_monthly: process.env.STRIPE_PRO_PRICE_ID || "",
};
