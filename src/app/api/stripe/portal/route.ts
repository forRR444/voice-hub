import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { getBaseUrl } from "@/lib/utils";
import { checkRateLimit, getClientIp } from "@/lib/api-utils";
import { logError } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await checkRateLimit(getClientIp(request), "stripe_portal", 10, 60);
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
