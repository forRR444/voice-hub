"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function TestimonialToast() {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  if (dismissed) return null;

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

        {/* Content */}
        <div className="px-4 py-3 sm:px-5 sm:py-4">
          {step === 0 && (
            <div>
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
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2">
                登録なしでそのまま試せます
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                Google口コミを取り込んで、サイトに表示するとどう見えるか確認できます。
              </p>
              <a
                href="/try"
                className="block w-full px-3 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer text-center"
              >
                ちょっと試してみる →
              </a>
              <button
                onClick={() => setDismissed(true)}
                className="w-full mt-1.5 px-3 py-2 text-xs sm:text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                今はいいです
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
