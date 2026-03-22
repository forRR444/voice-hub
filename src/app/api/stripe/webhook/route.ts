import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeCustomerId, getStripeSubscriptionId } from "@/lib/stripe-utils";
import Stripe from "stripe";
import { logError } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = getStripe().webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      logError("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
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
          logError("Failed to update workspace after checkout:", error);
          return NextResponse.json({ error: "DB update failed" }, { status: 500 });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = getStripeCustomerId(subscription.customer)!;

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
          logError("Failed to update subscription status:", error);
          return NextResponse.json({ error: "DB update failed" }, { status: 500 });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = getStripeCustomerId(subscription.customer)!;

        const { error } = await createAdminClient()
          .from("workspaces")
          .update({
            subscription_status: "canceled",
            stripe_subscription_id: null,
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          logError("Failed to update workspace after deletion:", error);
          return NextResponse.json({ error: "DB update failed" }, { status: 500 });
        }
        break;
      }

      default:
        // Unhandled event type - ignore silently
        break;
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    logError("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
