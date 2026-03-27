"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_BRAND_COLOR } from "@/lib/constants";
import type { FormQuestion } from "@/types/database";
import { PRESET_QUESTIONS } from "@/app/components/question-editor";

type TryData = {
  workspaceName: string;
  brandColor: string;
  questions: FormQuestion[];
};

export default function TryDataDetector({
  existingForm,
}: {
  existingForm: { id: string; brand_color: string; questions: FormQuestion[] };
}) {
  const [tryData, setTryData] = useState<TryData | null>(null);
  const [tryChoice, setTryChoice] = useState<"current" | "new" | null>(null);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("voicehub_try_data");
    if (!raw) return;
    localStorage.removeItem("voicehub_try_data");
    try {
      const parsed = JSON.parse(raw);
      if (parsed.questions) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTryData(parsed);
      }
    } catch {
      // invalid JSON
    }
  }, []);

  async function applyTryData() {
    if (!tryData) return;
    setApplying(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("forms")
      .update({
        questions: tryData.questions,
        brand_color: tryData.brandColor || DEFAULT_BRAND_COLOR,
      })
      .eq("id", existingForm.id);
    if (!error) {
      window.location.reload();
    }
    setTryData(null);
    setApplying(false);
  }

  if (!tryData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">
          お試しで作成したフォーム設定があります
        </h3>
        <p className="text-sm text-foreground/60 mb-6">
          どちらの設定を使いますか？比較して選んでください。
        </p>

        {tryChoice === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* 現在のフォーム */}
            <button
              onClick={() => setTryChoice("current")}
              className="text-left rounded-lg border-2 border-foreground/10 p-4 hover:border-foreground/30 transition-colors cursor-pointer"
            >
              <h4 className="text-sm font-semibold text-foreground mb-3">現在のフォーム</h4>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-foreground/50">ブランドカラー</span>
                <div
                  className="w-5 h-5 rounded border border-foreground/10"
                  style={{ backgroundColor: existingForm.brand_color }}
                />
              </div>
              <p className="text-xs text-foreground/50 mb-2">
                質問（{existingForm.questions.filter((q) => q.enabled !== false).length}件）
              </p>
              <ul className="space-y-1">
                {existingForm.questions.map((q) => {
                  const preset = PRESET_QUESTIONS.find((p) => p.id === q.id);
                  return (
                    <li key={q.id} className={`text-xs py-1 px-2 rounded ${q.enabled === false ? "text-foreground/30 line-through" : "text-foreground/70 bg-foreground/[0.03]"}`}>
                      {preset ? preset.label : q.label}
                    </li>
                  );
                })}
              </ul>
            </button>

            {/* お試し設定 */}
            <button
              onClick={() => setTryChoice("new")}
              className="text-left rounded-lg border-2 border-indigo-200 bg-indigo-50/30 p-4 hover:border-indigo-400 transition-colors cursor-pointer"
            >
              <h4 className="text-sm font-semibold text-foreground mb-3">
                お試しで作成した設定
                <span className="ml-2 text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">新しい</span>
              </h4>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-foreground/50">ブランドカラー</span>
                <div
                  className="w-5 h-5 rounded border border-foreground/10"
                  style={{ backgroundColor: tryData.brandColor || DEFAULT_BRAND_COLOR }}
                />
              </div>
              <p className="text-xs text-foreground/50 mb-2">
                質問（{tryData.questions.filter((q) => q.enabled !== false).length}件）
              </p>
              <ul className="space-y-1">
                {tryData.questions.map((q) => {
                  const preset = PRESET_QUESTIONS.find((p) => p.id === q.id);
                  return (
                    <li key={q.id} className={`text-xs py-1 px-2 rounded ${q.enabled === false ? "text-foreground/30 line-through" : "text-foreground/70 bg-foreground/[0.03]"}`}>
                      {preset ? preset.label : q.label}
                    </li>
                  );
                })}
              </ul>
            </button>
          </div>
        ) : (
          <div className="bg-foreground/[0.03] rounded-lg p-4 mb-6">
            <p className="text-sm text-foreground">
              {tryChoice === "new"
                ? "お試しで作成した設定に切り替えます。現在のフォーム設定は上書きされます。"
                : "現在の設定をそのまま使います。お試しで作成した設定は破棄されます。"}
            </p>
            <p className="text-xs text-foreground/50 mt-1">
              よろしいですか？
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setTryChoice(null)}
                className="px-4 py-2 text-sm border border-foreground/10 rounded-lg hover:bg-foreground/5 cursor-pointer"
              >
                戻る
              </button>
              <button
                onClick={() => {
                  if (tryChoice === "new") {
                    applyTryData();
                  } else {
                    setTryData(null);
                    setTryChoice(null);
                  }
                }}
                disabled={applying}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
              >
                {applying ? "反映中..." : "確定する"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
