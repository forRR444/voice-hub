import { NextRequest } from "next/server";
import { getStripe, STRIPE_PRICES } from "@/lib/stripe";
import { getBaseUrl } from "@/lib/utils";
import { checkRateLimit, getClientIp, handleApiError } from "@/lib/api-utils";
import { apiSuccess } from "@/lib/api-response";
import { requireAuthAndWorkspaceFull } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await checkRateLimit(`stripe_checkout:${getClientIp(request)}`, 10, 60000);
    if (rateLimited) return rateLimited;
    const auth = await requireAuthAndWorkspaceFull();
    if (!auth.ok) return auth.response;
    const { supabase, user, workspace } = auth;

    let stripeCustomerId = workspace.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await getStripe().customers.create({
        email: user.email,
        metadata: {
          workspace_id: workspace.id,
          user_id: user.id,
        },
      });

      stripeCustomerId = customer.id;

      const { error: updateError } = await supabase
        .from("workspaces")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", workspace.id);

      if (updateError) {
        return handleApiError(updateError, "Failed to update workspace");
      }
    }

    const baseUrl = getBaseUrl();

    const session = await getStripe().checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [
        {
          price: STRIPE_PRICES.pro_monthly,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard/settings?success=true`,
      cancel_url: `${baseUrl}/dashboard/settings?canceled=true`,
    });

    if (!session.url) {
      return handleApiError(
        new Error("Stripe session.url is missing"),
        "Failed to create checkout session",
      );
    }

    return apiSuccess({ url: session.url });
  } catch (error) {
    return handleApiError(error, "Internal server error");
  }
}
