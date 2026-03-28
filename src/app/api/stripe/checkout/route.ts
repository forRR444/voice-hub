import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, STRIPE_PRICES } from "@/lib/stripe";
import { getBaseUrl } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/api-utils";
import { logError } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await checkRateLimit(`stripe_checkout:${getClientIp(request)}`, 10, 60000);
    if (rateLimited) return rateLimited;
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (workspaceError || !workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

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
        return NextResponse.json(
          { error: "Failed to update workspace" },
          { status: 500 }
        );
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
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logError("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
