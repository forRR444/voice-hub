import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { TESTIMONIAL_SELECT_COLUMNS } from "@/lib/constants";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ widgetId: string }> }
) {
  try {
    const { widgetId } = await params;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch widget config
    const { data: widget, error: widgetError } = await supabase
      .from("widgets")
      .select("*")
      .eq("id", widgetId)
      .single();

    if (widgetError || !widget) {
      return NextResponse.json(
        { error: "Widget not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Fetch workspace to check subscription
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("subscription_status")
      .eq("id", widget.workspace_id)
      .single();

    const showBadge = workspace?.subscription_status === "free";

    // Build testimonials query
    let query = supabase
      .from("testimonials")
      .select(TESTIMONIAL_SELECT_COLUMNS)
      .eq("workspace_id", widget.workspace_id)
      .eq("status", "approved")
      .not("source", "in", '("sample","guide")')
      .gte("rating", widget.filter_min_rating ?? 1)
      .order("submitted_at", { ascending: false });

    if (widget.only_featured) {
      query = query.eq("is_featured", true);
    }

    const maxItems = widget.theme?.maxItems ?? 10;
    query = query.limit(maxItems);

    const { data: testimonials, error: testimonialsError } = await query;

    if (testimonialsError) {
      return NextResponse.json(
        { error: "Failed to fetch testimonials" },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { widget, testimonials: testimonials ?? [], showBadge },
      {
        headers: {
          ...corsHeaders,
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    return handleApiError(error, "Internal server error", corsHeaders);
  }
}
