"use client";

import GoogleReviewsPicker, { type PickedReview } from "./google-reviews-picker";

export type { PickedReview };

export default function GoogleImportStep({
  footer,
}: {
  footer: (selectedReviews: PickedReview[]) => React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center mb-2">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Google口コミを取り込む</h2>
        <p className="text-sm text-gray-500">ビジネス名で検索して口コミを選んでください</p>
      </div>
      <GoogleReviewsPicker footer={footer} />
    </div>
  );
}
