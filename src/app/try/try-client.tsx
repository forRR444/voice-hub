"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { FORM_TEMPLATES } from "@/lib/default-questions";
import { DEFAULT_BRAND_COLOR } from "@/lib/constants";
import type { FormQuestion } from "@/types/database";
import GoogleImportStep, { type PickedReview } from "@/app/components/google-import-step";
import StepCard from "@/app/components/step-card";

const TRY_STORAGE_KEY = "voicehub_try_data";

type ImportedReview = {
  id: string;
  name: string;
  title: string;
  rating: number;
  content: string;
  publishTime: string;
  sourceId?: string;
};

const SAMPLE_TESTIMONIALS: ImportedReview[] = [
  {
    id: "s1",
    name: "Voice H.",
    title: "30代",
    rating: 5,
    content: "カラーの仕上がりが理想通りでした。色持ちも良くて大満足です！",
    publishTime: "",
  },
  {
    id: "s2",
    name: "Hub M.",
    title: "20代",
    rating: 5,
    content: "初めてでしたが、似合う髪型を一緒に考えてくれて嬉しかったです。",
    publishTime: "",
  },
  {
    id: "s3",
    name: "Voice K.",
    title: "40代",
    rating: 5,
    content: "ヘッドスパが最高でした。半年通っていますが毎回癒されます。",
    publishTime: "",
  },
  {
    id: "s4",
    name: "Hub S.",
    title: "30代",
    rating: 4,
    content: "トリートメント後の手触りが全然違う。周りにも褒められました。",
    publishTime: "",
  },
  {
    id: "s5",
    name: "Voice A.",
    title: "20代",
    rating: 5,
    content: "カットのセンスが抜群。おまかせでお願いしても毎回かわいくしてくれます。",
    publishTime: "",
  },
];

function SampleCard({
  t,
  className,
  compact,
}: {
  t: ImportedReview;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`bg-[#fafaf9] rounded-lg border border-[#e5e5e3] ${compact ? "p-2.5" : "p-3.5"} flex flex-col gap-1.5 ${className || ""}`}
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <span
        className={`text-[#888] ${compact ? "text-[10px]" : "text-xs"}`}
        style={{ letterSpacing: 1 }}
      >
        {"★".repeat(t.rating)}
        {"☆".repeat(5 - t.rating)}
      </span>
      <p
        className={`text-gray-600 leading-relaxed line-clamp-3 ${compact ? "text-[9px]" : "text-xs"}`}
      >
        {t.content}
      </p>
      <div
        className={`flex items-center gap-1.5 mt-auto ${compact ? "pt-1.5" : "pt-2"} border-t border-gray-100`}
      >
        <div
          className={`rounded-full bg-gray-300 flex items-center justify-center text-white font-bold flex-shrink-0 ${compact ? "w-5 h-5 text-[7px]" : "w-6 h-6 text-[9px]"}`}
        >
          {t.name.charAt(0)}
        </div>
        <div>
          <div className={`font-medium text-gray-800 ${compact ? "text-[9px]" : "text-[11px]"}`}>
            {t.name}
          </div>
          <div className={`text-gray-400 ${compact ? "text-[7px]" : "text-[9px]"}`}>{t.title}</div>
        </div>
      </div>
    </div>
  );
}

export default function TryClient() {
  const [step, setStep] = useState(1);
  const [questions] = useState<FormQuestion[]>(FORM_TEMPLATES[0].questions);
  const [importedReviews, setImportedReviews] = useState<ImportedReview[]>([]);

  function saveTryData() {
    try {
      localStorage.setItem(
        TRY_STORAGE_KEY,
        JSON.stringify({
          template: "coaching",
          workspaceName: "マイサービス",
          brandColor: DEFAULT_BRAND_COLOR,
          questions,
          savedAt: new Date().toISOString(),
          googleReviews: importedReviews.length > 0 ? importedReviews : undefined,
        })
      );
    } catch {
      // localStorage unavailable
    }
  }

  function handleImport(picked: PickedReview[]) {
    setImportedReviews(
      picked.map((r, i) => ({
        id: `google-${i}`,
        name: "Googleユーザー",
        title: r.relativePublishTimeDescription,
        sourceId: r.googleId,
        rating: r.rating,
        content: r.content,
        publishTime: r.publishTime,
      }))
    );
    setStep(2);
  }

  const displayTestimonials = importedReviews.length > 0 ? importedReviews : SAMPLE_TESTIMONIALS;

  return (
    <>
      <StepCard step={step}>
        {/* Step 1: Google口コミ取り込み */}
        {step === 1 && (
          <GoogleImportStep
            footer={(selectedReviews) => (
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  スキップして次へ
                </button>
                <button
                  onClick={() => handleImport(selectedReviews)}
                  disabled={selectedReviews.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                >
                  {selectedReviews.length > 0
                    ? `${selectedReviews.length}件を取り込む`
                    : "取り込む"}
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          />
        )}

        {/* Step 2: 登録へ誘導 */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              {importedReviews.length > 0
                ? "あなたの口コミを表示できます"
                : "口コミをサイトに表示できます"}
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              {importedReviews.length > 0
                ? "取り込んだGoogle口コミをこんな風にサイトに表示できます"
                : "口コミをこんな風にサイトに表示できます"}
            </p>

            {/* HP mockup */}
            <div className="rounded-xl overflow-hidden mb-4 shadow-lg border border-gray-100 -mx-2">
              {/* Browser chrome */}
              <div className="bg-gradient-to-b from-[#ebebeb] to-[#dedede] border-b border-gray-300/80 px-3 py-1.5 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-[9px] h-[9px] rounded-full bg-[#ff5f57]" />
                  <div className="w-[9px] h-[9px] rounded-full bg-[#febc2e]" />
                  <div className="w-[9px] h-[9px] rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 mx-4 bg-white/70 backdrop-blur rounded-md px-2 py-0.5 text-[9px] text-gray-400 text-center truncate">
                  your-salon.com
                </div>
              </div>

              {/* Site content */}
              <div className="bg-[#f2f2f0]">
                {/* Full-bleed hero image */}
                <div className="relative" style={{ height: 180 }}>
                  <img
                    src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=360&fit=crop&crop=center"
                    alt="サロンの内装イメージ"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.45) 100%)",
                    }}
                  />
                  <div className="absolute top-0 left-0 right-0 px-4 py-3 flex items-center justify-between">
                    <span
                      className="text-white/90 text-[10px] tracking-[0.3em]"
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      SALON
                    </span>
                    <div className="flex gap-4">
                      {["Concept", "Menu", "Access"].map((item) => (
                        <span key={item} className="text-[7px] text-white/60 tracking-[0.12em]">
                          {item}
                        </span>
                      ))}
                      <span className="text-[7px] bg-white/20 backdrop-blur text-white/90 px-2 py-0.5 rounded-full tracking-wider">
                        Reserve
                      </span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p
                      className="text-white text-[20px] leading-tight"
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      A new day,
                      <br />a new style.
                    </p>
                    <p className="text-white/60 text-[8px] mt-2 tracking-wide">
                      あなたらしさを引き出すサロン
                    </p>
                  </div>
                </div>

                <div className="flex">
                  <img
                    src="https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=240&h=200&fit=crop&crop=center&sat=-100"
                    alt="サロンの施術イメージ"
                    className="w-[45%] object-cover"
                    style={{ height: 110 }}
                  />
                  <div className="flex-1 px-4 py-4 flex flex-col justify-center bg-[#eaeae8]">
                    <p className="text-[7px] tracking-[0.3em] text-[#999] uppercase mb-1">
                      Concept
                    </p>
                    <p className="text-[9px] text-[#666] leading-[1.8]">
                      一人ひとりの髪質と
                      <br />
                      ライフスタイルに寄り添い、
                      <br />
                      心地よい空間をお届けします。
                    </p>
                  </div>
                </div>

                <div className="mx-5 h-px bg-[#ddd]" />

                {/* Testimonials marquee */}
                <div className="py-5 bg-[#ededeb] overflow-hidden">
                  <p
                    className="text-center mb-0.5"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    <span className="text-[13px] text-[#555]">Voice</span>
                  </p>
                  <p className="text-[9px] text-[#999] text-center mb-4">お客様の声</p>
                  <div
                    className="flex gap-2 w-max"
                    style={{ animation: "mockup-marquee 25s linear infinite" }}
                  >
                    {[...displayTestimonials, ...displayTestimonials].map((t, i) => (
                      <SampleCard
                        key={`${t.id}-${i}`}
                        t={t}
                        className="w-[152px] flex-shrink-0"
                        compact
                      />
                    ))}
                  </div>
                  <style>{`
                    @keyframes mockup-marquee {
                      0% { transform: translateX(0); }
                      100% { transform: translateX(-50%); }
                    }
                  `}</style>
                </div>

                <div className="bg-[#333] px-4 py-3 flex items-center justify-between">
                  <span
                    className="text-[8px] text-[#777] tracking-[0.25em]"
                    style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                  >
                    SALON
                  </span>
                  <div className="flex gap-2.5 items-center">
                    <span className="text-[7px] text-[#777]">Instagram</span>
                    <span className="text-[7px] text-[#555]">|</span>
                    <span className="text-[7px] text-[#777]">LINE</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center mt-2 mb-6">
              ペライチ・WordPress・どんなサイトにも埋め込めます
            </p>

            <Link
              href="/signup?from=try"
              onClick={() => saveTryData()}
              className="w-full flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 mb-2"
            >
              無料で登録してサイトに貼り付ける
            </Link>
            <p className="text-xs text-gray-400 text-center mb-4">クレジットカード不要</p>

            <div className="flex items-center justify-center gap-4 mt-2">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <ArrowLeft size={14} />
                戻る
              </button>
              <span className="text-gray-300">|</span>
              <Link
                href="/login?from=try"
                onClick={() => saveTryData()}
                className="text-sm text-indigo-600 hover:underline"
              >
                アカウントをお持ちの方
              </Link>
            </div>
          </div>
        )}
      </StepCard>

      <p className="text-center mt-4">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
          トップに戻る
        </Link>
      </p>
    </>
  );
}
