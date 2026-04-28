import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientIp, checkRateLimit } from "@/lib/api-utils";
import { apiError, apiSuccess } from "@/lib/api-response";
import { RATE_LIMITS } from "@/lib/constants";

const PLACES_API_BASE = "https://places.googleapis.com/v1";

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return apiError("Google Places APIキーが設定されていません", 500, "INTERNAL_ERROR");
  }

  // ログイン状態を確認してレートリミットを分ける
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ip = getClientIp(request);

  if (user) {
    const rateLimited = await checkRateLimit(
      `google-reviews:user:${user.id}`,
      RATE_LIMITS.googleReviewsUser.limit,
      RATE_LIMITS.googleReviewsUser.windowMs,
      "本日の利用上限に達しました。"
    );
    if (rateLimited) return rateLimited;
  } else {
    const hourly = await checkRateLimit(
      `google-reviews:guest:hourly:${ip}`,
      RATE_LIMITS.googleReviewsGuestHourly.limit,
      RATE_LIMITS.googleReviewsGuestHourly.windowMs,
      "1時間あたりの利用上限に達しました。"
    );
    if (hourly) return hourly;
    const daily = await checkRateLimit(
      `google-reviews:guest:daily:${ip}`,
      RATE_LIMITS.googleReviewsGuestDaily.limit,
      RATE_LIMITS.googleReviewsGuestDaily.windowMs,
      "本日の利用上限に達しました。"
    );
    if (daily) return daily;
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "search") {
    const query = searchParams.get("query");
    if (!query?.trim()) {
      return apiError("queryは必須です", 400, "VALIDATION_ERROR");
    }

    const res = await fetch(`${PLACES_API_BASE}/places:searchText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
      },
      body: JSON.stringify({ textQuery: query, languageCode: "ja" }),
    });

    const data = await res.json();
    if (!res.ok) {
      return apiError(data.error?.message || "検索に失敗しました", res.status, "UPSTREAM_ERROR");
    }

    return apiSuccess({ places: data.places || [] });
  }

  if (action === "reviews") {
    const placeId = searchParams.get("placeId");

    if (!placeId?.trim()) {
      return apiError("placeIdは必須です", 400, "VALIDATION_ERROR");
    }

    const res = await fetch(`${PLACES_API_BASE}/places/${placeId}?languageCode=ja`, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
          "reviews.name,reviews.rating,reviews.text,reviews.originalText,reviews.authorAttribution,reviews.publishTime,reviews.relativePublishTimeDescription,displayName",
      },
    });

    const data = await res.json();
    if (!res.ok) {
      return apiError(
        data.error?.message || "口コミの取得に失敗しました",
        res.status,
        "UPSTREAM_ERROR"
      );
    }

    return apiSuccess({
      reviews: data.reviews || [],
      placeName: data.displayName?.text || "",
    });
  }

  return apiError("無効なアクションです", 400, "VALIDATION_ERROR");
}
