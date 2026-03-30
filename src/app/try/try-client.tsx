"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Search, Star, MapPin, FileText } from "lucide-react";
import { FORM_TEMPLATES } from "@/lib/default-questions";
import { DEFAULT_BRAND_COLOR } from "@/lib/constants";
import type { FormQuestion } from "@/types/database";

const TRY_STORAGE_KEY = "voicehub_try_data";

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

type ImportedReview = {
  id: string;
  name: string;
  title: string;
  rating: number;
  content: string;
  photoUri?: string;
  publishTime: string;
};

const SAMPLE_TESTIMONIALS: ImportedReview[] = [
  { id: "s1", name: "Voice H.", title: "30代", rating: 5, content: "カラーの仕上がりが理想通りでした。色持ちも良くて大満足です！", publishTime: "" },
  { id: "s2", name: "Hub M.", title: "20代", rating: 5, content: "初めてでしたが、似合う髪型を一緒に考えてくれて嬉しかったです。", publishTime: "" },
  { id: "s3", name: "Voice K.", title: "40代", rating: 5, content: "ヘッドスパが最高でした。半年通っていますが毎回癒されます。", publishTime: "" },
  { id: "s4", name: "Hub S.", title: "30代", rating: 4, content: "トリートメント後の手触りが全然違う。周りにも褒められました。", publishTime: "" },
  { id: "s5", name: "Voice A.", title: "20代", rating: 5, content: "カットのセンスが抜群。おまかせでお願いしても毎回かわいくしてくれます。", publishTime: "" },
];

function SampleCard({ t, className, compact }: { t: ImportedReview; className?: string; compact?: boolean }) {
  return (
    <div className={`bg-[#fafaf9] rounded-lg border border-[#e5e5e3] ${compact ? "p-2.5" : "p-3.5"} flex flex-col gap-1.5 ${className || ""}`}
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      <span className={`text-[#888] ${compact ? "text-[10px]" : "text-xs"}`} style={{ letterSpacing: 1 }}>
        {"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)}
      </span>
      <p className={`text-gray-600 leading-relaxed line-clamp-3 ${compact ? "text-[9px]" : "text-xs"}`}>{t.content}</p>
      <div className={`flex items-center gap-1.5 mt-auto ${compact ? "pt-1.5" : "pt-2"} border-t border-gray-100`}>
        <div className={`rounded-full bg-gray-300 flex items-center justify-center text-white font-bold flex-shrink-0 ${compact ? "w-5 h-5 text-[7px]" : "w-6 h-6 text-[9px]"}`}>
          {t.name.charAt(0)}
        </div>
        <div>
          <div className={`font-medium text-gray-800 ${compact ? "text-[9px]" : "text-[11px]"}`}>{t.name}</div>
          <div className={`text-gray-400 ${compact ? "text-[7px]" : "text-[9px]"}`}>{t.title}</div>
        </div>
      </div>
    </div>
  );
}

type GoogleStep = "search" | "reviews";

function getInitialState() {
  if (typeof window === "undefined") return { step: 1, template: "coaching", questions: FORM_TEMPLATES[0].questions };
  try {
    const saved = localStorage.getItem("voicehub_template");
    if (saved) {
      localStorage.removeItem("voicehub_template");
      const tpl = FORM_TEMPLATES.find((t) => t.id === saved);
      if (tpl) return { step: 2, template: saved, questions: tpl.questions };
    }
  } catch {
    // localStorage unavailable
  }
  return { step: 1, template: "coaching", questions: FORM_TEMPLATES[0].questions };
}

export default function TryClient() {
  const initial = getInitialState();
  const [step, setStep] = useState(initial.step);
  const [path, setPath] = useState<"form" | "google" | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(initial.template);
  const [workspaceName, setWorkspaceName] = useState("");
  const [questions, setQuestions] = useState<FormQuestion[]>(initial.questions);

  // Google Reviews state
  const [googleStep, setGoogleStep] = useState<GoogleStep>("search");
  const [googleQuery, setGoogleQuery] = useState("");
  const [googleSearchLoading, setGoogleSearchLoading] = useState(false);
  const [googlePlaces, setGooglePlaces] = useState<Place[]>([]);
  const [googleSelectedPlace, setGoogleSelectedPlace] = useState<Place | null>(null);
  const [googleReviews, setGoogleReviews] = useState<GoogleReview[]>([]);
  const [googleReviewsLoading, setGoogleReviewsLoading] = useState(false);
  const [googleSelectedIds, setGoogleSelectedIds] = useState<Set<string>>(new Set());
  const [googleError, setGoogleError] = useState("");
  const [importedReviews, setImportedReviews] = useState<ImportedReview[]>([]);

  function handleTemplateChange(templateId: string) {
    setSelectedTemplate(templateId);
    const template = FORM_TEMPLATES.find((t) => t.id === templateId);
    if (template) setQuestions(template.questions);
  }

  function saveTryData() {
    try {
      localStorage.setItem(
        TRY_STORAGE_KEY,
        JSON.stringify({
          template: selectedTemplate,
          workspaceName: workspaceName.trim() || "マイサービス",
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

  // Google Reviews: ビジネス検索
  async function handleGoogleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!googleQuery.trim()) return;
    setGoogleSearchLoading(true);
    setGoogleError("");
    setGooglePlaces([]);

    const res = await fetch(
      `/api/google-reviews?action=search&query=${encodeURIComponent(googleQuery)}`
    );
    const data = await res.json();
    setGoogleSearchLoading(false);

    if (!res.ok) {
      setGoogleError(data.error || "検索に失敗しました");
      return;
    }
    setGooglePlaces(data.places);
    if (data.places.length === 0) {
      setGoogleError("ビジネスが見つかりませんでした。別のキーワードで試してください。");
    }
  }

  // Google Reviews: ビジネス選択 → 口コミ取得
  async function handleGoogleSelectPlace(place: Place) {
    setGoogleSelectedPlace(place);
    setGoogleStep("reviews");
    setGoogleSelectedIds(new Set());
    setGoogleError("");
    setGoogleReviewsLoading(true);
    setGoogleReviews([]);

    const res = await fetch(
      `/api/google-reviews?action=reviews&placeId=${encodeURIComponent(place.id)}`
    );
    const data = await res.json();
    setGoogleReviewsLoading(false);

    if (!res.ok) {
      setGoogleError(data.error || "口コミの取得に失敗しました");
      return;
    }
    setGoogleReviews(data.reviews);
    if (data.reviews.length === 0) {
      setGoogleError("口コミがまだありません。");
    }
  }

  function toggleGoogleSelect(reviewName: string) {
    setGoogleSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(reviewName)) next.delete(reviewName);
      else next.add(reviewName);
      return next;
    });
  }

  function toggleGoogleSelectAll() {
    if (googleSelectedIds.size === googleReviews.length) {
      setGoogleSelectedIds(new Set());
    } else {
      setGoogleSelectedIds(new Set(googleReviews.map((r) => r.name)));
    }
  }

  // Google Reviews: 取り込んで次へ
  function handleGoogleNext() {
    if (googleSelectedIds.size > 0) {
      const selected = googleReviews.filter((r) => googleSelectedIds.has(r.name));
      setImportedReviews(
        selected.map((r, i) => ({
          id: `google-${i}`,
          name: r.authorAttribution.displayName,
          title: r.relativePublishTimeDescription,
          rating: r.rating,
          content: r.originalText?.text || r.text?.text || "",
          photoUri: r.authorAttribution.photoUri,
          publishTime: r.publishTime,
        }))
      );
    }
    setStep(3);
  }

  const displayTestimonials = importedReviews.length > 0 ? importedReviews : SAMPLE_TESTIMONIALS;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-indigo-500" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Step 1: 選択画面 */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              まず何から始めますか？
            </h2>
            <p className="text-sm text-gray-500 text-center mb-8">
              登録なしで試せます。あとから保存できます。
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setPath("google"); setStep(2); }}
                className="text-left p-5 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <span className="text-base font-semibold text-gray-900">Google口コミを取り込む</span>
                </div>
                <p className="text-sm text-gray-500 ml-12">
                  既存のGoogle口コミをそのままサイトに表示できます
                </p>
              </button>

              <button
                onClick={() => { setPath("form"); setStep(2); }}
                className="text-left p-5 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-indigo-500" />
                  </div>
                  <span className="text-base font-semibold text-gray-900">フォームを作成する</span>
                </div>
                <p className="text-sm text-gray-500 ml-12">
                  お客様にフォームを送って新しい声を集めます
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Step 2a: フォーム作成 */}
        {step === 2 && path === "form" && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              フォームを作ってみましょう
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              業種に合わせたテンプレートを選んでください
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              サービス名
            </label>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-6"
              placeholder="例：山田コーチング"
              autoFocus
            />

            <label className="block text-sm font-medium text-gray-700 mb-2">
              業種テンプレート
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {FORM_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => handleTemplateChange(tpl.id)}
                  className={`text-left p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                    selectedTemplate === tpl.id
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="block text-sm font-medium text-gray-900">{tpl.label}</span>
                  <span className="block text-xs text-gray-500 mt-0.5">{tpl.description}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => { setPath(null); setStep(1); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <ArrowLeft size={16} />
                戻る
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-medium bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
              >
                次へ
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2b: Google口コミ取り込み */}
        {step === 2 && path === "google" && (
          <div className="flex flex-col gap-4">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Google口コミを取り込む
              </h2>
              <p className="text-sm text-gray-500">
                ビジネス名で検索して口コミを選んでください
              </p>
            </div>

            {googleError && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {googleError}
              </div>
            )}

            {googleStep === "search" && (
              <>
                <form onSubmit={handleGoogleSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={googleQuery}
                    onChange={(e) => setGoogleQuery(e.target.value)}
                    placeholder="ビジネス名を入力（例：田中歯科クリニック 東京）"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={googleSearchLoading || !googleQuery.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Search size={15} />
                    検索
                  </button>
                </form>

                {googleSearchLoading && (
                  <p className="text-sm text-gray-400 text-center py-2">検索中...</p>
                )}

                {googlePlaces.length > 0 && (
                  <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
                    {googlePlaces.map((place) => (
                      <button
                        key={place.id}
                        onClick={() => handleGoogleSelectPlace(place)}
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

            {googleStep === "reviews" && (
              <>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setGoogleStep("search"); setGoogleError(""); }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    ← 検索に戻る
                  </button>
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {googleSelectedPlace?.displayName.text}
                  </span>
                </div>

                {googleReviewsLoading && (
                  <p className="text-sm text-gray-400 text-center py-2">取得中...</p>
                )}

                {googleReviews.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={toggleGoogleSelectAll}
                        className="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer"
                      >
                        {googleSelectedIds.size === googleReviews.length ? "選択を解除" : "全て選択"}
                      </button>
                      <span className="text-xs text-gray-400">{googleReviews.length}件</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {googleReviews.map((review) => (
                        <label
                          key={review.name}
                          className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            googleSelectedIds.has(review.name)
                              ? "border-indigo-300 bg-indigo-50/50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={googleSelectedIds.has(review.name)}
                            onChange={() => toggleGoogleSelect(review.name)}
                            className="mt-0.5 accent-indigo-600 cursor-pointer shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-800 truncate">
                                {review.authorAttribution.displayName}
                              </span>
                              <span className="text-xs text-gray-400 shrink-0">
                                {review.relativePublishTimeDescription}
                              </span>
                            </div>
                            <div className="flex gap-0.5 mb-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} size={12}
                                  className={i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}
                                />
                              ))}
                            </div>
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
              </>
            )}

            <div className="flex justify-between mt-2">
              <button
                onClick={() => { setPath(null); setStep(1); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                <ArrowLeft size={16} />
                戻る
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  スキップして次へ
                </button>
                <button
                  onClick={handleGoogleNext}
                  disabled={googleSelectedIds.size === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                >
                  {googleSelectedIds.size > 0 ? `${googleSelectedIds.size}件を取り込む` : "取り込む"}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: 登録へ誘導 */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              {importedReviews.length > 0 ? "あなたの口コミを表示できます" : "フォームが完成しました"}
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              {importedReviews.length > 0
                ? "取り込んだGoogle口コミをこんな風にサイトに表示できます"
                : "このフォームでお客様の声を集めると...\nこんな風にサイトに表示できます"}
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
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.45) 100%)" }} />
                  <div className="absolute top-0 left-0 right-0 px-4 py-3 flex items-center justify-between">
                    <span className="text-white/90 text-[10px] tracking-[0.3em]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>SALON</span>
                    <div className="flex gap-4">
                      {["Concept", "Menu", "Access"].map((item) => (
                        <span key={item} className="text-[7px] text-white/60 tracking-[0.12em]">{item}</span>
                      ))}
                      <span className="text-[7px] bg-white/20 backdrop-blur text-white/90 px-2 py-0.5 rounded-full tracking-wider">Reserve</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-white text-[20px] leading-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                      A new day,<br />a new style.
                    </p>
                    <p className="text-white/60 text-[8px] mt-2 tracking-wide">あなたらしさを引き出すサロン</p>
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
                    <p className="text-[7px] tracking-[0.3em] text-[#999] uppercase mb-1">Concept</p>
                    <p className="text-[9px] text-[#666] leading-[1.8]">
                      一人ひとりの髪質と<br />
                      ライフスタイルに寄り添い、<br />
                      心地よい空間をお届けします。
                    </p>
                  </div>
                </div>

                <div className="mx-5 h-px bg-[#ddd]" />

                {/* Testimonials marquee */}
                <div className="py-5 bg-[#ededeb] overflow-hidden">
                  <p className="text-center mb-0.5" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                    <span className="text-[13px] text-[#555]">Voice</span>
                  </p>
                  <p className="text-[9px] text-[#999] text-center mb-4">お客様の声</p>
                  <div className="flex gap-2 w-max" style={{ animation: "mockup-marquee 25s linear infinite" }}>
                    {[...displayTestimonials, ...displayTestimonials].map((t, i) => (
                      <SampleCard key={`${t.id}-${i}`} t={t} className="w-[152px] flex-shrink-0" compact />
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
                  <span className="text-[8px] text-[#777] tracking-[0.25em]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>SALON</span>
                  <div className="flex gap-2.5 items-center">
                    <span className="text-[7px] text-[#777]">Instagram</span>
                    <span className="text-[7px] text-[#555]">|</span>
                    <span className="text-[7px] text-[#777]">LINE</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center mb-4">
              ペライチ・WordPress・どんなサイトにも埋め込めます
            </p>

            <Link
              href="/signup?from=try"
              onClick={() => saveTryData()}
              className="w-full flex items-center justify-center px-6 py-3 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700"
            >
              無料で登録して保存
            </Link>

            <p className="text-xs text-gray-400 text-center mt-3">
              クレジットカード不要
            </p>

            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => setStep(2)}
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
      </div>

      <p className="text-center mt-4">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
          トップに戻る
        </Link>
      </p>

    </>
  );
}
