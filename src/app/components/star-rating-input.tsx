"use client";

import { useState } from "react";

function StarIcon({ filled, color }: { filled: boolean; color: string }) {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      className="transition-all duration-100"
      style={{ color: filled ? color : "#E5E7EB" }}
    >
      <path
        d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  const active = hover || value;

  return (
    <div className="flex gap-3">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          aria-label={`${star}つ星`}
          className="transition-transform duration-100 hover:scale-110 active:scale-95 focus:outline-none"
          style={{
            filter:
              star <= active
                ? `drop-shadow(0 2px 6px ${brandColor}60)`
                : "none",
          }}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
        >
          <StarIcon filled={star <= active} color={brandColor} />
        </button>
      ))}
    </div>
  );
}
