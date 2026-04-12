"use client";

import { useState, useRef, useEffect } from "react";
import { Search, MapPin, ChevronLeft } from "lucide-react";
import StarRating from "@/app/components/ui/star-rating";

type Place = {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
};

type GoogleReview = {
  name: string;
  rating: number;
  text?: { text: string };
  originalText?: { text: string };
  authorAttribution: {
    displayName: string;
  };
  publishTime: string;
  relativePublishTimeDescription: string;
};

export type PickedReview = {
  googleId: string;
  rating: number;
  content: string;
  publishTime: string;
  relativePublishTimeDescription: string;
};

type Props = {
  footer: (selectedReviews: PickedReview[]) => React.ReactNode;
  scrollable?: boolean;
};

export default function GoogleReviewsPicker({ footer, scrollable = false }: Props) {
  const [step, setStep] = useState<"search" | "reviews">("search");
  const [query, setQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchLoading(true);
    setError("");
    setPlaces([]);

    const res = await fetch(
      `/api/google-reviews?action=search&query=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    setSearchLoading(false);

    if (!res.ok) {
      setError(data.error || "検索に失敗しました");
      return;
    }
    setPlaces(data.places);
    if (data.places.length === 0) {
      setError("ビジネスが見つかりませんでした。別のキーワードで試してください。");
    }
  }

  async function handleSelectPlace(place: Place) {
    setSelectedPlace(place);
    setStep("reviews");
    setSelectedIds(new Set());
    setError("");
    setReviewsLoading(true);
    setReviews([]);

    const res = await fetch(
      `/api/google-reviews?action=reviews&placeId=${encodeURIComponent(place.id)}`
    );
    const data = await res.json();
    setReviewsLoading(false);

    if (!res.ok) {
      setError(data.error || "口コミの取得に失敗しました");
      return;
    }
    setReviews(data.reviews);
    if (data.reviews.length === 0) {
      setError("口コミがまだありません。");
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === reviews.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(reviews.map((r) => r.name)));
    }
  }

  const selectedReviews: PickedReview[] = reviews
    .filter((r) => selectedIds.has(r.name))
    .map((r) => ({
      googleId: r.name,
      rating: r.rating,
      content: r.originalText?.text || r.text?.text || "",
      publishTime: r.publishTime,
      relativePublishTimeDescription: r.relativePublishTimeDescription,
    }));

  const selectAllRef = useRef<HTMLInputElement>(null);
  const isAllSelected = reviews.length > 0 && selectedIds.size === reviews.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < reviews.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const listClass = scrollable
    ? "overflow-y-auto flex-1 min-h-0 flex flex-col gap-2"
    : "flex flex-col gap-2";

  return (
    <div className={`flex flex-col gap-4 ${scrollable ? "flex-1 min-h-0 overflow-hidden" : ""}`}>
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg shrink-0">
          {error}
        </div>
      )}

      {/* Search Step */}
      {step === "search" && (
        <>
          <form onSubmit={handleSearch} className="flex gap-2 shrink-0">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ビジネス名を入力（例：田中歯科クリニック 東京）"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={searchLoading || !query.trim()}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Search size={15} />
              検索
            </button>
          </form>

          {searchLoading && (
            <p className="text-sm text-gray-400 text-center py-2">検索中...</p>
          )}

          {places.length > 0 && (
            <div className="flex flex-col gap-2">
              {places.map((place) => (
                <button
                  key={place.id}
                  onClick={() => handleSelectPlace(place)}
                  className="text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                >
                  <p className="text-sm font-medium text-gray-900">{place.displayName.text}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={11} />
                    {place.formattedAddress}
                  </p>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Reviews Step */}
      {step === "reviews" && (
        <div className={`flex flex-col gap-3 ${scrollable ? "flex-1 min-h-0 overflow-hidden" : ""}`}>
          {/* Back + place name */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => { setStep("search"); setError(""); }}
              className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-gray-700 truncate">
              {selectedPlace?.displayName.text}
            </span>
          </div>

          {reviewsLoading && (
            <p className="text-sm text-gray-400 text-center py-2 shrink-0">取得中...</p>
          )}

          {reviews.length > 0 && (
            <>
              {/* Select all bar */}
              <div className="flex items-center justify-between py-2 border-y border-gray-100 shrink-0">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="accent-indigo-600 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">すべて選択</span>
                </label>
                <span className="text-sm text-gray-400">
                  {selectedIds.size > 0
                    ? `${selectedIds.size} / ${reviews.length}件`
                    : `${reviews.length}件`}
                </span>
              </div>

              {/* Review list */}
              <div className={listClass}>
                {reviews.map((review) => (
                  <label
                    key={review.name}
                    className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedIds.has(review.name)
                        ? "border-indigo-300 bg-indigo-50/50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(review.name)}
                      onChange={() => toggleSelect(review.name)}
                      className="mt-0.5 accent-indigo-600 cursor-pointer shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-800 truncate">
                          Googleユーザー
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">
                          {review.relativePublishTimeDescription}
                        </span>
                      </div>
                      <StarRating rating={review.rating} size={12} emptyClass="text-gray-200" className="mb-1" />
                      {(review.originalText?.text || review.text?.text) && (
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {review.originalText?.text || review.text?.text}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {footer(selectedReviews)}
    </div>
  );
}
