"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Eye } from "lucide-react";
import { FORM_TEMPLATES } from "@/lib/default-questions";
import { DEFAULT_BRAND_COLOR } from "@/lib/constants";
import type { FormQuestion, FormRow } from "@/types/database";
import QuestionEditor from "@/app/components/question-editor";
import { FormClient, type FormClientHandle } from "@/app/form/[slug]/form-client";

const TRY_STORAGE_KEY = "voicehub_try_data";

const SAMPLE_TESTIMONIALS = [
  {
    id: "s1",
    name: "Voice H.",
    title: "30代",
    rating: 5,
    content: "カラーの仕上がりが理想通りでした。色持ちも良くて大満足です！",
  },
  {
    id: "s2",
    name: "Hub M.",
    title: "20代",
    rating: 5,
    content: "初めてでしたが、似合う髪型を一緒に考えてくれて嬉しかったです。",
  },
  {
    id: "s3",
    name: "Voice K.",
    title: "40代",
    rating: 5,
    content: "ヘッドスパが最高でした。半年通っていますが毎回癒されます。",
  },
  {
    id: "s4",
    name: "Hub S.",
    title: "30代",
    rating: 4,
    content: "トリートメント後の手触りが全然違う。周りにも褒められました。",
  },
  {
    id: "s5",
    name: "Voice A.",
    title: "20代",
    rating: 5,
    content: "カットのセンスが抜群。おまかせでお願いしても毎回かわいくしてくれます。",
  },
];

function SampleCard({ t, className, compact }: { t: typeof SAMPLE_TESTIMONIALS[number]; className?: string; compact?: boolean }) {
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

function getInitialState() {
  if (typeof window === "undefined") return { step: 1, template: "coaching", questions: FORM_TEMPLATES[0].questions };
  const saved = localStorage.getItem("voicehub_template");
  if (saved) {
    localStorage.removeItem("voicehub_template");
    const tpl = FORM_TEMPLATES.find((t) => t.id === saved);
    if (tpl) return { step: 2, template: saved, questions: tpl.questions };
  }
  return { step: 1, template: "coaching", questions: FORM_TEMPLATES[0].questions };
}

export default function TryClient() {
  const initial = getInitialState();
  const [step, setStep] = useState(initial.step);
  const [selectedTemplate, setSelectedTemplate] = useState(initial.template);
  const [workspaceName, setWorkspaceName] = useState("");
  const [brandColor, setBrandColor] = useState(DEFAULT_BRAND_COLOR);
  const [questions, setQuestions] = useState<FormQuestion[]>(initial.questions);
  const [showPreview, setShowPreview] = useState(false);
  const formRef = useRef<FormClientHandle>(null);

  function handleTemplateChange(templateId: string) {
    setSelectedTemplate(templateId);
    const template = FORM_TEMPLATES.find((t) => t.id === templateId);
    if (template) setQuestions(template.questions);
  }

  function saveTryData() {
    localStorage.setItem(
      TRY_STORAGE_KEY,
      JSON.stringify({
        template: selectedTemplate,
        workspaceName: workspaceName.trim() || "マイサービス",
        brandColor,
        questions,
        savedAt: new Date().toISOString(),
      })
    );
  }



  const previewForm: FormRow = {
    id: "try-preview",
    workspace_id: "try-preview",
    slug: "try-preview",
    title: workspaceName || "お客様の声をお聞かせください",
    description: null,
    brand_color: brandColor,
    logo_url: null,
    thank_you_message: "ご回答ありがとうございました！（これはプレビューです）",
    questions: questions.filter((q) => q.enabled !== false),
    created_at: new Date().toISOString(),
  };

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

        {/* Step 1: テンプレート + サービス名 */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              フォームを作ってみましょう
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              登録なしで試せます。あとから保存できます。
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
                  <span className="block text-sm font-medium text-gray-900">
                    {tpl.label}
                  </span>
                  <span className="block text-xs text-gray-500 mt-0.5">
                    {tpl.description}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-medium bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
              >
                次へ
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: ブランドカラー + 質問編集 */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              フォームをカスタマイズ
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              ブランドカラー・質問の編集・並び替えができます。
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              ブランドカラー
            </label>
            <div className="flex items-center gap-3 mb-6">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
              />
              <span className="text-sm text-gray-500">{brandColor}</span>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              質問
            </label>
            <QuestionEditor questions={questions} onChange={setQuestions} />

            <button
              onClick={() => setShowPreview(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 mt-6 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
            >
              <Eye size={16} />
              フォームをプレビュー
            </button>

            <div className="flex justify-between mt-4">
              <button
                onClick={() => setStep(1)}
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

        {/* Step 3: 登録へ誘導 */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              フォームが完成しました
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              このフォームでお客様の声を集めると...<br />
              こんな風にサイトに表示できます
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
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.45) 100%)" }} />
                  {/* Floating nav */}
                  <div className="absolute top-0 left-0 right-0 px-4 py-3 flex items-center justify-between">
                    <span className="text-white/90 text-[10px] tracking-[0.3em]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>SALON</span>
                    <div className="flex gap-4">
                      {["Concept", "Menu", "Access"].map((item) => (
                        <span key={item} className="text-[7px] text-white/60 tracking-[0.12em]">{item}</span>
                      ))}
                      <span className="text-[7px] bg-white/20 backdrop-blur text-white/90 px-2 py-0.5 rounded-full tracking-wider">Reserve</span>
                    </div>
                  </div>
                  {/* Hero copy */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-white text-[20px] leading-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                      A new day,<br />a new style.
                    </p>
                    <p className="text-white/60 text-[8px] mt-2 tracking-wide">あなたらしさを引き出すサロン</p>
                  </div>
                </div>

                {/* 2-column: Concept image + text */}
                <div className="flex">
                  <img
                    src="https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=240&h=200&fit=crop&crop=center&sat=-100"
                    alt=""
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

                {/* Divider */}
                <div className="mx-5 h-px bg-[#ddd]" />

                {/* Testimonials */}
                <div className="py-5 bg-[#ededeb] overflow-hidden">
                  <p className="text-center mb-0.5" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                    <span className="text-[13px] text-[#555]">Voice</span>
                  </p>
                  <p className="text-[9px] text-[#999] text-center mb-4">お客様の声</p>
                  <div className="flex gap-2 w-max" style={{ animation: "mockup-marquee 25s linear infinite" }}>
                    {[...SAMPLE_TESTIMONIALS, ...SAMPLE_TESTIMONIALS].map((t, i) => (
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

                {/* Footer */}
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
                編集に戻る
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

      {/* Preview overlay */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              フォームプレビュー
            </span>
            <button
              onClick={() => setShowPreview(false)}
              className="px-4 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              閉じる
            </button>
          </div>
          <FormClient ref={formRef} form={previewForm} demo onDemoClose={() => setShowPreview(false)} />
        </div>
      )}
    </>
  );
}
