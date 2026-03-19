"use client";

import { useState } from "react";

const BASE_WIDGET_ID = "d0000000-0000-0000-0000-000000000001";

const WIDGET_TYPES = [
  { label: "カルーセル", type: "carousel" },
  { label: "グリッド", type: "grid" },
  { label: "マーキー", type: "marquee" },
  { label: "Wall of Love", type: "wall" },
  { label: "リスト", type: "list" },
  { label: "シングル", type: "single" },
  { label: "バッジ", type: "badge" },
];

export default function WidgetDemo() {
  const [active, setActive] = useState(0);

  const src =
    active === 0
      ? `/preview/${BASE_WIDGET_ID}`
      : `/preview/${BASE_WIDGET_ID}?type=${WIDGET_TYPES[active].type}`;

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {WIDGET_TYPES.map((w, i) => (
          <button
            key={w.type}
            onClick={() => setActive(i)}
            className={`px-4 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
              active === i
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>
      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
        <iframe
          key={WIDGET_TYPES[active].type}
          src={src}
          className="w-full border-0"
          style={{ height: WIDGET_TYPES[active].type === "badge" ? "120px" : "500px" }}
          title={`${WIDGET_TYPES[active].label}ウィジェットデモ`}
        />
      </div>
    </div>
  );
}
