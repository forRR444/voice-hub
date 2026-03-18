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

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 w-[360px] transition-all duration-500 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
    >
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-600 px-5 py-3 flex items-center justify-between">
          <span className="text-white text-sm font-medium">
            VoiceHubを試してみる
          </span>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/60 hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Progress */}
        <div className="px-5 pt-4 flex gap-2">
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
        <div className="px-5 py-4">
          {step === 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">ステップ 1/3</p>
              <h3 className="text-base font-bold text-gray-900 mb-3">
                お客様の声をLPに表示したいですか？
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                お客様の声を載せたLPは、問い合わせ率が<span className="font-semibold text-indigo-600">34%向上</span>するというデータがあります。
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="w-full px-4 py-3 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
                >
                  はい、表示したい
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="w-full px-4 py-3 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  今はいいです
                </button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">ステップ 2/3</p>
              <h3 className="text-base font-bold text-gray-900 mb-3">
                あなたの業種を教えてください
              </h3>
              <div className="flex flex-col gap-2">
                {FORM_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`text-left px-3 py-2 rounded-lg border transition-colors cursor-pointer ${
                      selectedTemplate === tpl.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-900">
                      {tpl.label}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {tpl.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">ステップ 3/3</p>
              <div className="text-3xl mb-3">🎉</div>
              <h3 className="text-base font-bold text-gray-900 mb-2">
                準備ができました！
              </h3>
              <p className="text-sm text-gray-600 mb-1">
                {selectedTemplate
                  ? `「${FORM_TEMPLATES.find((t) => t.id === selectedTemplate)?.label}」テンプレートで`
                  : ""}
              </p>
              <p className="text-sm text-gray-600 mb-5">
                5分でお客様の声フォームが完成します。
              </p>
              <a
                href="/login"
                className="block w-full px-5 py-3 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-center"
              >
                Googleで無料登録
              </a>
              <p className="mt-3 text-xs text-gray-400">
                クレジットカード不要
              </p>
            </div>
          )}
        </div>

        {/* Navigation (step 1 only) */}
        {step === 1 && (
          <div className="px-5 pb-4 flex items-center justify-between">
            <button
              onClick={() => setStep(0)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <ChevronLeft size={14} />
              戻る
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!selectedTemplate}
              className="flex items-center gap-1 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              次へ
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
