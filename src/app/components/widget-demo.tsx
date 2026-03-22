"use client";

import { useState } from "react";
import { DEFAULT_BRAND_COLOR, WIDGET_TYPES } from "@/lib/constants";

const DEMO_WIDGET_TYPES = WIDGET_TYPES.map((w) => ({ label: w.label, type: w.id }));

const SAMPLE_DATA = [
  { name: "田中 美咲", title: "ライフコーチ", rating: 5, content: "コーチングを受けてから売上が大幅に伸びました。最初は半信半疑でしたが、3ヶ月のプログラムを通じて自分のビジネスの課題が明確になり、具体的なアクションプランを立てることができました。特に集客の仕組み化についてのアドバイスが的確で、毎月の売上が安定するようになりました。本当に感謝しています。" },
  { name: "佐藤 健一", title: "フリーランスデザイナー", rating: 5, content: "自分の強みが明確になり、自信を持って活動できるようになりました。以前は価格設定にも悩んでいましたが、自分の価値を正しく理解できるようになってからは、適正価格で受注できるようになり、収入も大幅にアップしました。" },
  { name: "山本 あかり", title: "ヨガインストラクター", rating: 4, content: "集客の悩みが解消されて、レッスンの予約が増えました。SNSの活用法やリピーターを増やすコツを教えていただき、今では予約が埋まるほどの人気クラスになりました。生徒さんからも「先生のクラスが一番好き」と言ってもらえるようになり、やりがいを感じています。" },
  { name: "鈴木 大輔", title: "コンサルタント", rating: 5, content: "ブランディングの方向性が定まり、問い合わせが3倍になりました。" },
  { name: "高橋 真由", title: "オンライン講座運営", rating: 5, content: "受講生の声を集める仕組みができて、講座の信頼感が上がりました。VoiceHubを導入してからは、受講後のアンケートが自動化され、集まった声をそのままLPに反映できるので、新規受講生の申し込み率が格段に上がりました。" },
  { name: "中村 裕太", title: "整体院オーナー", rating: 5, content: "口コミが自然に集まる仕組みができて、新規のお客様が毎月安定して来院されるようになりました。以前は紹介頼みでしたが、今ではホームページを見て来てくださる方が半数以上です。" },
  { name: "伊藤 さくら", title: "カウンセラー", rating: 4, content: "クライアントの声をLP に載せたいと思っていましたが、お願いするのが苦手で後回しにしていました。フォームURLを送るだけなので、気軽にお願いできるようになりました。" },
  { name: "渡辺 一樹", title: "Webエンジニア", rating: 5, content: "ポートフォリオにクライアントの声を載せたくて導入しました。埋め込みコードをコピペするだけで、自動で最新の声が反映されるのが最高です。デザインも綺麗で大満足です。" },
  { name: "小林 真理", title: "エステサロン経営", rating: 5, content: "お客様から「ホームページの口コミを見て来ました」と言われることが増えました。信頼感がぐっと上がったと実感しています。操作もシンプルで助かっています。" },
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
      width: 28, height: 28, borderRadius: "50%", backgroundColor: BRAND,
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: 12, flexShrink: 0,
    }}>
      {name.charAt(0)}
    </div>
  );
}

function Card({ item, compact, fill }: { item: typeof SAMPLE_DATA[0]; compact?: boolean; fill?: boolean }) {
  return (
    <>
      <style>{`
        .demo-card-compact { min-width: min(140px, 38vw); max-width: 160px; padding: 10px; }
        @media (min-width: 640px) { .demo-card-compact { min-width: 220px; max-width: 260px; padding: 14px; } }
        .demo-card-compact .demo-text { font-size: 11px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .demo-card-compact .demo-text.demo-expanded { -webkit-line-clamp: unset; display: block; }
        @media (min-width: 640px) { .demo-card-compact .demo-text { font-size: 13px; } }
        .demo-read-more { background: none; border: none; padding: 0; margin-top: 2px; font-size: 10px; color: ${BRAND}; cursor: pointer; }
        .demo-read-more:hover { text-decoration: underline; }
        @media (min-width: 640px) { .demo-read-more { font-size: 12px; } }
        .demo-card-compact .demo-name { font-size: 10px; }
        @media (min-width: 640px) { .demo-card-compact .demo-name { font-size: 12px; } }
        .demo-card-compact .demo-title { font-size: 9px; }
        @media (min-width: 640px) { .demo-card-compact .demo-title { font-size: 11px; } }
      `}</style>
      <div
        className={compact ? "demo-card-compact" : undefined}
        style={{
          background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8,
          ...(!compact ? { padding: 16 } : {}),
          display: "flex", flexDirection: "column", gap: 4,
          ...(!compact ? { maxWidth: fill ? "none" : 300 } : {}),
          flexShrink: 0, width: "100%",
        }}
      >
        <Stars rating={item.rating} />
        <p className={compact ? "demo-text" : undefined} style={{ color: "#374151", ...(!compact ? { fontSize: 13 } : {}), lineHeight: 1.5, margin: 0 }}>
          {item.content}
        </p>
        {compact && item.content.length > 60 && (
          <button
            className="demo-read-more"
            onClick={(e) => {
              const btn = e.currentTarget;
              const text = btn.previousElementSibling as HTMLElement;
              if (!text) return;
              const isExpanded = text.classList.toggle("demo-expanded");
              btn.textContent = isExpanded ? "閉じる" : "もっと見る";
            }}
          >
            もっと見る
          </button>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <Avatar name={item.name} />
          <div>
            <div className={compact ? "demo-name" : undefined} style={{ fontWeight: 600, color: "#111827", ...(!compact ? { fontSize: 12 } : {}) }}>{item.name}</div>
            <div className={compact ? "demo-title" : undefined} style={{ color: "#6b7280", ...(!compact ? { fontSize: 11 } : {}) }}>{item.title}</div>
          </div>
        </div>
      </div>
    </>
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
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
      {SAMPLE_DATA.slice(0, 9).map((item, i) => (
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

function DualMarqueeDemo() {
  const rowA = SAMPLE_DATA.slice(0, 3);
  const rowB = SAMPLE_DATA.slice(3);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, overflow: "hidden", padding: 20 }}>
      <div style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 16, animation: "dual-marquee-left 20s linear infinite" }}>
          {[...rowA, ...rowA].map((item, i) => <Card key={i} item={item} compact />)}
        </div>
      </div>
      <div style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", gap: 16, animation: "dual-marquee-right 20s linear infinite" }}>
          {[...rowB, ...rowB].map((item, i) => <Card key={i} item={item} compact />)}
        </div>
      </div>
      <style>{`
        @keyframes dual-marquee-left { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes dual-marquee-right { from { transform: translateX(-50%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}

function WallDemo() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4">
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
  "dual-marquee": () => <DualMarqueeDemo />,
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
