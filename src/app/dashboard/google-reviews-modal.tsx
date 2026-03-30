"use client";

import { useState } from "react";
import { X, Search, Star, ChevronLeft, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TestimonialWithTags } from "@/types/database";

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
    photoUri?: string;
  };
  publishTime: string;
  relativePublishTimeDescription: string;
};

type Step = "search" | "reviews";

export default function GoogleReviewsModal({
  workspaceId,
  onClose,
  onImported,
}: {
  workspaceId: string;
  onClose: () => void;
  onImported: (testimonials: TestimonialWithTags[]) => void;
}) {
  const supabase = createClient();
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
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
    await fetchReviews(place.id);
  }

  async function fetchReviews(placeId: string) {
    setReviewsLoading(true);
    setError("");
    setReviews([]);

    const res = await fetch(
      `/api/google-reviews?action=reviews&placeId=${encodeURIComponent(placeId)}`
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

  function toggleSelect(reviewName: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(reviewName)) {
        next.delete(reviewName);
      } else {
        next.add(reviewName);
      }
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

  async function handleImport() {
    if (selectedIds.size === 0) return;
    setImporting(true);
    setError("");

    const toImport = reviews.filter((r) => selectedIds.has(r.name));
    const rows = toImport.map((r) => ({
      workspace_id: workspaceId,
      form_id: null,
      name: r.authorAttribution.displayName,
      content: r.originalText?.text || r.text?.text || "",
      rating: r.rating,
      avatar_url: r.authorAttribution.photoUri || null,
      status: "pending" as const,
      source: "google",
      is_featured: false,
      permission_granted: true,
      submitted_at: r.publishTime,
    }));

    const { data, error: insertError } = await supabase
      .from("testimonials")
      .insert(rows)
      .select();

    setImporting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (data) {
      onImported(data.map((t) => ({ ...t, tags: [] })));
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-sm w-full max-w-lg mx-4 p-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <div className="flex items-center gap-2">
            {step === "reviews" && (
              <button
                onClick={() => { setStep("search"); setError(""); }}
                className="p-1 text-foreground/40 hover:text-foreground/60 cursor-pointer"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h3 className="text-lg font-bold text-foreground">
              {step === "search" ? "Google口コミをインポート" : selectedPlace?.displayName.text}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-foreground/40 hover:text-foreground/60 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg shrink-0">
            {error}
          </div>
        )}

        {/* Search Step */}
        {step === "search" && (
          <div className="flex flex-col gap-4 overflow-hidden">
            <form onSubmit={handleSearch} className="flex gap-2 shrink-0">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ビジネス名を入力（例：田中歯科クリニック 東京）"
                className="flex-1 px-3 py-2 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              <button
                type="submit"
                disabled={searchLoading || !query.trim()}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Search size={15} />
                検索
              </button>
            </form>

            {searchLoading && (
              <p className="text-sm text-foreground/50 text-center py-4">検索中...</p>
            )}

            {places.length > 0 && (
              <div className="overflow-y-auto flex flex-col gap-2">
                {places.map((place) => (
                  <button
                    key={place.id}
                    onClick={() => handleSelectPlace(place)}
                    className="text-left p-3 rounded-lg border border-foreground/10 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {place.displayName.text}
                    </p>
                    <p className="text-xs text-foreground/50 flex items-center gap-1 mt-0.5">
                      <MapPin size={11} />
                      {place.formattedAddress}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews Step */}
        {step === "reviews" && (
          <div className="flex flex-col gap-4 overflow-hidden flex-1 min-h-0">
            {reviewsLoading && (
              <p className="text-sm text-foreground/50 text-center py-4">取得中...</p>
            )}

            {reviews.length > 0 && (
              <>
                <div className="flex items-center justify-between shrink-0">
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    {selectedIds.size === reviews.length ? "選択を解除" : "全て選択"}
                  </button>
                  <span className="text-xs text-foreground/40">
                    {reviews.length}件
                  </span>
                </div>

                <div className="overflow-y-auto flex flex-col gap-2 flex-1 min-h-0">
                  {reviews.map((review) => (
                    <label
                      key={review.name}
                      className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedIds.has(review.name)
                          ? "border-indigo-300 bg-indigo-50/50"
                          : "border-foreground/10 hover:border-foreground/20"
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
                          <span className="text-sm font-medium text-foreground truncate">
                            {review.authorAttribution.displayName}
                          </span>
                          <span className="text-xs text-foreground/40 shrink-0">
                            {review.relativePublishTimeDescription}
                          </span>
                        </div>
                        <div className="flex gap-0.5 mb-1.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={12}
                              className={
                                i < review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-foreground/20"
                              }
                            />
                          ))}
                        </div>
                        {(review.originalText?.text || review.text?.text) && (
                          <p className="text-xs text-foreground/60 line-clamp-2 leading-relaxed">
                            {review.originalText?.text || review.text?.text}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}

            {/* Footer buttons */}
            <div className="flex justify-end gap-3 shrink-0 pt-2 border-t border-foreground/5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-foreground/70 border border-foreground/10 rounded-lg hover:bg-foreground/5 cursor-pointer"
              >
                キャンセル
              </button>
              <button
                onClick={handleImport}
                disabled={selectedIds.size === 0 || importing}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
              >
                {importing ? "インポート中..." : `${selectedIds.size}件をインポート`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
