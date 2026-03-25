"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { FORM_TEMPLATES } from "@/lib/default-questions";

export default function TestimonialToast() {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  if (dismissed) return null;

  const totalSteps = 3;

  function handleRegister() {
    localStorage.setItem("voicehub_template", selectedTemplate || "coaching");
    localStorage.setItem("voicehub_skip_onboarding", "true");
    window.location.href = "/login";
  }

  return (
    <div
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] max-w-[320px] sm:max-w-[360px] transition-all duration-500 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 px-4 py-2.5 sm:px-5 sm:py-3 flex items-center justify-between">
          <span className="text-white text-xs sm:text-sm font-medium">
            VoiceHubを試してみる
          </span>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/60 hover:text-white cursor-pointer"
          >
            <X size={14} className="sm:hidden" />
            <X size={16} className="hidden sm:block" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-4 pt-3 sm:px-5 sm:pt-4 flex gap-1.5 sm:gap-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-indigo-500" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="px-4 py-3 sm:px-5 sm:py-4">
          {step === 0 && (
            <div>
              <p className="text-[10px] sm:text-xs text-gray-500 mb-1.5 sm:mb-2">ステップ 1/3</p>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 sm:mb-3">
                お客様の声をホームページに表示したいですか？
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                お客様の声を載せたホームページは、問い合わせ率が<span className="font-semibold text-indigo-600">34%向上</span>するというデータがあります。
              </p>
              <div className="flex flex-col gap-1.5 sm:gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
                >
                  はい、表示したい
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="w-full px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  今はいいです
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="text-[10px] sm:text-xs text-gray-500 mb-1.5 sm:mb-2">ステップ 2/3</p>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 sm:mb-3">
                あなたの業種を教えてください
              </h3>
              <div className="flex flex-col gap-1.5 sm:gap-2">
                {FORM_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`text-left px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg border transition-colors cursor-pointer ${
                      selectedTemplate === tpl.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-medium text-gray-900">
                      {tpl.label}
                    </span>
                    <span className="block text-[10px] sm:text-xs text-gray-500">
                      {tpl.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <p className="text-[10px] sm:text-xs text-gray-500 mb-1.5 sm:mb-2">ステップ 3/3</p>
              <div className="relative mx-auto w-11 h-11 sm:w-14 sm:h-14 mb-3 sm:mb-4">
                <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-30" />
                <div className="relative w-11 h-11 sm:w-14 sm:h-14 bg-indigo-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-7 sm:h-7 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1.5 sm:mb-2">
                準備ができました！
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-5">
                Googleアカウントで登録すると、フォームが自動で作成されます。
              </p>
              <button
                onClick={handleRegister}
                className="block w-full px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
              >
                Googleで無料登録
              </button>
              <p className="mt-2 sm:mt-3 text-[10px] sm:text-xs text-gray-400">
                クレジットカード不要
              </p>
            </div>
          )}
        </div>

        {/* Navigation (step 1 & 2) */}
        {step === 1 && (
          <div className="px-4 pb-3 sm:px-5 sm:pb-4 flex items-center justify-between">
            <button
              onClick={() => setStep(0)}
              className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <ChevronLeft size={12} className="sm:hidden" />
              <ChevronLeft size={14} className="hidden sm:block" />
              戻る
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!selectedTemplate}
              className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              次へ
              <ChevronRight size={12} className="sm:hidden" />
              <ChevronRight size={14} className="hidden sm:block" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
