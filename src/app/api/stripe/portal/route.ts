import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getBaseUrl } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/api-utils";
import { requireAuthAndWorkspaceFull } from "@/lib/api-auth";
import { logError } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await checkRateLimit(`stripe_portal:${getClientIp(request)}`, 10, 60000);
    if (rateLimited) return rateLimited;
    const auth = await requireAuthAndWorkspaceFull();
    if (!auth.ok) return auth.response;
    const { workspace } = auth;

    if (!workspace.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account found. Please subscribe first." },
        { status: 400 }
      );
    }

    const baseUrl = getBaseUrl();

    const session = await getStripe().billingPortal.sessions.create({
      customer: workspace.stripe_customer_id,
      return_url: `${baseUrl}/dashboard/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logError("Stripe portal error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
