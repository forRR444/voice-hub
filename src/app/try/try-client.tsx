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
              登録すると、この設定が保存されます。
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
