import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { shouldShowBadge, getTestimonialDisplayLimit, toSubscriptionStatus } from "@/lib/plan";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

type WidgetTheme = { maxItems?: number } & Record<string, unknown>;

type PublicWidget = {
  id: string;
  type: string;
  theme: WidgetTheme | null;
  filter_min_rating: number | null;
  only_featured: boolean;
};

type WidgetPublicData = {
  widget: PublicWidget;
  subscription_status: unknown;
  testimonials: unknown[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseWidget(value: unknown): PublicWidget | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== "string") return null;
  if (typeof value.type !== "string") return null;
  if (typeof value.only_featured !== "boolean") return null;

  const theme = value.theme;
  const parsedTheme: WidgetTheme | null =
    theme === null || theme === undefined
      ? null
      : isRecord(theme)
        ? theme
        : null;

  const filterMinRating = value.filter_min_rating;
  const parsedFilterMinRating: number | null =
    filterMinRating === null || filterMinRating === undefined
      ? null
      : typeof filterMinRating === "number"
        ? filterMinRating
        : null;

  return {
    id: value.id,
    type: value.type,
    theme: parsedTheme,
    filter_min_rating: parsedFilterMinRating,
    only_featured: value.only_featured,
  };
}

function parseWidgetPublicData(value: unknown): WidgetPublicData | null {
  if (!isRecord(value)) return null;
  const widget = parseWidget(value.widget);
  if (!widget) return null;
  const testimonials = Array.isArray(value.testimonials) ? value.testimonials : [];
  return {
    widget,
    subscription_status: value.subscription_status,
    testimonials,
  };
}

function getThemeMaxItems(theme: WidgetTheme | null): number {
  if (!theme) return 10;
  const value = theme.maxItems;
  return typeof value === "number" ? value : 10;
}

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

    const { data, error } = await supabase.rpc("get_widget_public_data", {
      p_widget_id: widgetId,
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch testimonials" },
        { status: 500, headers: corsHeaders }
      );
    }

    const parsed = parseWidgetPublicData(data);
    if (!parsed) {
      return NextResponse.json(
        { error: "Widget not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const status = toSubscriptionStatus(parsed.subscription_status);
    const showBadge = shouldShowBadge(status);
    const displayLimit = getTestimonialDisplayLimit(status);
    const themeMax = getThemeMaxItems(parsed.widget.theme);
    const maxItems = Math.min(themeMax, displayLimit);
    const testimonials = parsed.testimonials.slice(0, maxItems);

    return NextResponse.json(
      { widget: parsed.widget, testimonials, showBadge },
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
