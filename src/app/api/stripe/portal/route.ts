import { NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getBaseUrl } from "@/lib/utils";
import { checkRateLimit, getClientIp, handleApiError } from "@/lib/api-utils";
import { apiError, apiSuccess } from "@/lib/api-response";
import { requireAuthAndWorkspaceFull } from "@/lib/api-auth";

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await checkRateLimit(`stripe_portal:${getClientIp(request)}`, 10, 60000);
    if (rateLimited) return rateLimited;
    const auth = await requireAuthAndWorkspaceFull();
    if (!auth.ok) return auth.response;
    const { workspace } = auth;

    if (!workspace.stripe_customer_id) {
      return apiError(
        "No billing account found. Please subscribe first.",
        400,
        "VALIDATION_ERROR",
      );
    }

    const baseUrl = getBaseUrl();

    const session = await getStripe().billingPortal.sessions.create({
      customer: workspace.stripe_customer_id,
      return_url: `${baseUrl}/dashboard/settings`,
    });

    return apiSuccess({ url: session.url });
  } catch (error) {
    return handleApiError(error, "Internal server error");
  }
}
