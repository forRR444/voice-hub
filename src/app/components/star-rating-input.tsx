"use client";

import { useState } from "react";

/**
 * インタラクティブな星評価入力コンポーネント（フォーム用）
 */
export function StarRatingInput({
  value,
  onChange,
  brandColor,
}: {
  value: number;
  onChange: (v: number) => void;
  brandColor: string;
}) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className="text-4xl transition-transform hover:scale-110 focus:outline-none"
          style={{
            color: star <= (hover || value) ? brandColor : "#d1d5db",
          }}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          aria-label={`${star}つ星`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
