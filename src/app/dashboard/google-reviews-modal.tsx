"use client";

import { useState } from "react";
import { X } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { TestimonialWithTags } from "@/types/database";
import GoogleReviewsPicker, { type PickedReview } from "@/app/components/google-reviews-picker";

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
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState<{ added: number; skipped: number } | null>(null);

  async function handleImport(selectedReviews: PickedReview[]) {
    if (selectedReviews.length === 0) return;
    setImporting(true);
    setImportError("");
    setImportResult(null);

    const rows = selectedReviews.map((r) => ({
      workspace_id: workspaceId,
      form_id: null,
      name: "Googleユーザー",
      content: r.content,
      rating: r.rating,
      avatar_url: null,
      status: "pending" as const,
      source: "google",
      source_id: r.googleId,
      is_featured: false,
      permission_granted: true,
      submitted_at: r.publishTime,
    }));

    // 既存のsource_idを取得して重複を除外
    const sourceIds = rows.map((r) => r.source_id).filter(Boolean);
    const { data: existing } = sourceIds.length > 0
      ? await supabase
          .from("testimonials")
          .select("source_id")
          .eq("workspace_id", workspaceId)
          .in("source_id", sourceIds)
      : { data: [] };

    const existingIds = new Set((existing ?? []).map((e: { source_id: string }) => e.source_id));
    const newRows = rows.filter((r) => !r.source_id || !existingIds.has(r.source_id));

    let data: typeof rows = [];
    if (newRows.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from("testimonials")
        .insert(newRows)
        .select();

      if (insertError) {
        setImporting(false);
        setImportError(insertError.message);
        return;
      }
      data = inserted ?? [];
    }

    setImporting(false);

    const added = data.length;
    const skipped = selectedReviews.length - added;
    setImportResult({ added, skipped });

    if (data && data.length > 0) {
      onImported(data.map((t) => ({ ...t, tags: [] })));
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-sm w-full max-w-lg mx-4 p-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 shrink-0">
          <h3 className="text-lg font-bold text-gray-900">Google口コミをインポート</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {importError && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg shrink-0">
            {importError}
          </div>
        )}

        {importResult && (
          <div className="mb-4 text-sm bg-green-50 text-green-700 p-3 rounded-lg shrink-0">
            {importResult.added}件を追加しました
            {importResult.skipped > 0 && `（${importResult.skipped}件はすでにインポート済みのためスキップ）`}
          </div>
        )}

        <GoogleReviewsPicker
          scrollable
          footer={(selectedReviews) => (
            <div className="flex justify-end gap-3 shrink-0 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                {importResult ? "閉じる" : "キャンセル"}
              </button>
              {!importResult && (
                <button
                  onClick={() => handleImport(selectedReviews)}
                  disabled={selectedReviews.length === 0 || importing}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                >
                  {importing ? "インポート中..." : `${selectedReviews.length}件をインポート`}
                </button>
              )}
            </div>
          )}
        />
      </div>
    </div>
  );
}
