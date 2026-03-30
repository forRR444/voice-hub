import { NextRequest, NextResponse } from "next/server";

const PLACES_API_BASE = "https://places.googleapis.com/v1";

export async function GET(request: NextRequest) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Places APIキーが設定されていません" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "search") {
    const query = searchParams.get("query");
    if (!query?.trim()) {
      return NextResponse.json({ error: "queryは必須です" }, { status: 400 });
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
      return NextResponse.json(
        { error: data.error?.message || "検索に失敗しました" },
        { status: res.status }
      );
    }

    return NextResponse.json({ places: data.places || [] });
  }

  if (action === "reviews") {
    const placeId = searchParams.get("placeId");

    if (!placeId?.trim()) {
      return NextResponse.json({ error: "placeIdは必須です" }, { status: 400 });
    }

    const res = await fetch(
      `${PLACES_API_BASE}/places/${placeId}?languageCode=ja`,
      {
        headers: {
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "reviews.name,reviews.rating,reviews.text,reviews.originalText,reviews.authorAttribution,reviews.publishTime,reviews.relativePublishTimeDescription,displayName",
        },
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.error?.message || "口コミの取得に失敗しました" },
        { status: res.status }
      );
    }

    return NextResponse.json({
      reviews: data.reviews || [],
      placeName: data.displayName?.text || "",
    });
  }

  return NextResponse.json({ error: "無効なアクションです" }, { status: 400 });
}
