import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeCustomerId, getStripeSubscriptionId } from "@/lib/stripe-utils";
import Stripe from "stripe";
import { handleApiError } from "@/lib/api-utils";
import { logError } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
    }

    let event: Stripe.Event;

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logError("STRIPE_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    try {
      event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      logError("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        // Stripe.Event は判別共用体型: switch (event.type) のスコープ内では
        // event.data.object が Stripe.Checkout.Session に narrowing される
        const session = event.data.object;
        const customerId = getStripeCustomerId(session.customer);
        const subscriptionId = getStripeSubscriptionId(session.subscription);

        if (!customerId) {
          logError("No customer ID in checkout session");
          break;
        }

        const { error } = await createAdminClient()
          .from("workspaces")
          .update({
            subscription_status: "pro",
            stripe_subscription_id: subscriptionId ?? null,
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          return handleApiError(error, "DB update failed");
        }
        break;
      }

      case "customer.subscription.updated": {
        // Stripe.Event は判別共用体型: switch (event.type) のスコープ内では
        // event.data.object が Stripe.Subscription に narrowing される
        const subscription = event.data.object;
        const customerId = getStripeCustomerId(subscription.customer);

        if (!customerId) {
          logError("No customer ID in subscription.updated event");
          break;
        }

        let subscriptionStatus: string;
        switch (subscription.status) {
          case "active":
          case "trialing":
            subscriptionStatus = "pro";
            break;
          case "canceled":
          case "unpaid":
          case "past_due":
            subscriptionStatus = "canceled";
            break;
          default:
            subscriptionStatus = "free";
        }

        const { error } = await createAdminClient()
          .from("workspaces")
          .update({
            subscription_status: subscriptionStatus,
            stripe_subscription_id: subscription.id,
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          return handleApiError(error, "DB update failed");
        }
        break;
      }

      case "customer.subscription.deleted": {
        // Stripe.Event は判別共用体型: switch (event.type) のスコープ内では
        // event.data.object が Stripe.Subscription に narrowing される
        const subscription = event.data.object;
        const customerId = getStripeCustomerId(subscription.customer);

        if (!customerId) {
          logError("No customer ID in subscription.deleted event");
          break;
        }

        const { error } = await createAdminClient()
          .from("workspaces")
          .update({
            subscription_status: "canceled",
            stripe_subscription_id: null,
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          return handleApiError(error, "DB update failed");
        }
        break;
      }

      default:
        // Unhandled event type - ignore silently
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    return handleApiError(error, "Internal server error");
  }
}
