"use client";

import { useState } from "react";
import { DEFAULT_BRAND_COLOR, WIDGET_TYPES } from "@/lib/constants";

const DEMO_WIDGET_TYPES = WIDGET_TYPES.map((w) => ({ label: w.label, type: w.id }));

const SAMPLE_DATA = [
  { name: "田中 美咲", title: "ライフコーチ", rating: 5, content: "コーチングを受けてから売上が大幅に伸びました。本当に感謝しています。" },
  { name: "佐藤 健一", title: "フリーランスデザイナー", rating: 5, content: "自分の強みが明確になり、自信を持って活動できるようになりました。" },
  { name: "山本 あかり", title: "ヨガインストラクター", rating: 4, content: "集客の悩みが解消されて、レッスンの予約が増えました。" },
  { name: "鈴木 大輔", title: "コンサルタント", rating: 5, content: "ブランディングの方向性が定まり、問い合わせが3倍になりました。" },
  { name: "高橋 真由", title: "オンライン講座運営", rating: 5, content: "受講生の声を集める仕組みができて、講座の信頼感が上がりました。" },
];

const BRAND = DEFAULT_BRAND_COLOR;

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: BRAND, fontSize: 14, letterSpacing: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (i < rating ? "★" : "☆")).join("")}
    </span>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: "50%", backgroundColor: BRAND,
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: 16, flexShrink: 0,
    }}>
      {name.charAt(0)}
    </div>
  );
}

function Card({ item, compact, fill }: { item: typeof SAMPLE_DATA[0]; compact?: boolean; fill?: boolean }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
      padding: compact ? 16 : 20, display: "flex", flexDirection: "column", gap: 10,
      minWidth: 0, maxWidth: fill ? "none" : (compact ? 280 : 360), flexShrink: 0, width: "100%",
    }}>
      <Stars rating={item.rating} />
      <p style={{ color: "#374151", fontSize: 14, lineHeight: 1.7, margin: 0, flex: 1 }}>
        {item.content}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
        <Avatar name={item.name} />
        <div>
          <div style={{ fontWeight: 600, color: "#111827", fontSize: 13 }}>{item.name}</div>
          <div style={{ color: "#6b7280", fontSize: 12 }}>{item.title}</div>
        </div>
      </div>
    </div>
  );
}

function CarouselDemo() {
  const [idx, setIdx] = useState(0);
  return (
    <div style={{ position: "relative", overflow: "hidden", padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
        <Card item={SAMPLE_DATA[idx]} fill />
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 16 }}>
        {SAMPLE_DATA.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} style={{
            width: 8, height: 8, borderRadius: "50%", border: "none", cursor: "pointer",
            background: i === idx ? BRAND : "#d1d5db",
          }} />
        ))}
      </div>
    </div>
  );
}

function GridDemo() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5">
      {SAMPLE_DATA.slice(0, 4).map((item, i) => (
        <Card key={i} item={item} compact fill />
      ))}
    </div>
  );
}

function MarqueeDemo() {
  return (
    <div style={{ overflow: "hidden", padding: "20px 0" }}>
      <div style={{
        display: "flex", gap: 16, animation: "marquee-scroll 20s linear infinite",
      }}>
        {[...SAMPLE_DATA, ...SAMPLE_DATA].map((item, i) => (
          <Card key={i} item={item} compact />
        ))}
      </div>
      <style>{`@keyframes marquee-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

function WallDemo() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
      {SAMPLE_DATA.map((item, i) => (
        <Card key={i} item={item} compact fill />
      ))}
    </div>
  );
}

function ListDemo() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 20, maxWidth: 480, width: "100%", margin: "0 auto" }}>
      {SAMPLE_DATA.slice(0, 3).map((item, i) => (
        <div key={i} style={{
          background: "#fff", border: "1px solid #e5e7eb", borderLeft: `3px solid ${BRAND}`,
          borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", gap: 8,
        }}>
          <Stars rating={item.rating} />
          <p style={{ color: "#374151", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{item.content}</p>
          <div style={{ color: "#6b7280", fontSize: 12 }}>{item.name} — {item.title}</div>
        </div>
      ))}
    </div>
  );
}

function SingleDemo() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
      <div style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16,
        padding: 20, maxWidth: 480, width: "100%", textAlign: "center",
      }}>
        <Stars rating={5} />
        <p style={{ color: "#374151", fontSize: 18, lineHeight: 1.8, margin: "16px 0" }}>
          {SAMPLE_DATA[0].content}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Avatar name={SAMPLE_DATA[0].name} />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 600, color: "#111827", fontSize: 14 }}>{SAMPLE_DATA[0].name}</div>
            <div style={{ color: "#6b7280", fontSize: 13 }}>{SAMPLE_DATA[0].title}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BadgeDemo() {
  const avg = SAMPLE_DATA.reduce((s, d) => s + d.rating, 0) / SAMPLE_DATA.length;
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 999, padding: "8px 16px",
      }}>
        <span style={{ color: BRAND, fontSize: 16 }}>★</span>
        <span style={{ fontWeight: 700, color: "#111827", fontSize: 15 }}>{avg.toFixed(1)}</span>
        <span style={{ color: "#6b7280", fontSize: 13 }}>({SAMPLE_DATA.length}件)</span>
      </div>
    </div>
  );
}

const RENDERERS: Record<string, () => React.ReactNode> = {
  carousel: () => <CarouselDemo />,
  grid: () => <GridDemo />,
  marquee: () => <MarqueeDemo />,
  wall: () => <WallDemo />,
  list: () => <ListDemo />,
  single: () => <SingleDemo />,
  badge: () => <BadgeDemo />,
};

export default function WidgetDemo() {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {DEMO_WIDGET_TYPES.map((w, i) => (
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
      <div className="rounded-2xl border border-gray-200 overflow-hidden bg-gray-50">
        {RENDERERS[DEMO_WIDGET_TYPES[active].type]()}
      </div>
    </div>
  );
}
