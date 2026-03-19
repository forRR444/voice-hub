"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateSlug, getBaseUrl } from "@/lib/utils";
import { DEFAULT_FORM_QUESTIONS, FORM_TEMPLATES } from "@/lib/default-questions";
import { WorkspaceRow } from "@/types/database";

export default function OnboardingClient({ workspace }: { workspace: WorkspaceRow }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [hasCustomers, setHasCustomers] = useState<boolean | null>(null);
  const [workspaceName, setWorkspaceName] = useState(workspace.name);
  const [formTitle, setFormTitle] = useState("お客様の声をお聞かせください");
  const [brandColor, setBrandColor] = useState("#635BFF");
  const [thankYouMessage, setThankYouMessage] = useState(
    "ご回答いただきありがとうございます！"
  );
  const [selectedTemplate, setSelectedTemplate] = useState("coaching");
  const [creating, setCreating] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [formSlug, setFormSlug] = useState("");
  const [copied, setCopied] = useState(false);

  async function completeOnboarding() {
    setCreating(true);
    try {
      const supabase = createClient();
      const slug = generateSlug();

      const { data: form, error: formError } = await supabase
        .from("forms")
        .insert({
          workspace_id: workspace.id,
          slug,
          title: formTitle,
          questions: FORM_TEMPLATES.find(t => t.id === selectedTemplate)?.questions || DEFAULT_FORM_QUESTIONS,
          brand_color: brandColor,
          thank_you_message: thankYouMessage,
        })
        .select("id")
        .single();

      if (formError) throw formError;

      await supabase.from("testimonials").insert({
        workspace_id: workspace.id,
        form_id: form.id,
        rating: 5,
        content:
          "VoiceHubのおかげで、お客様の声を簡単に集めてウェブサイトに表示できるようになりました。セットアップも数分で完了して驚きました！",
        before_story:
          "お客様の声をLPに載せたかったのですが、手動でコピペするのが手間で更新が止まっていました。",
        name: "VoiceHub サポートチーム",
        title: "サンプル",
        status: "approved",
        is_featured: true,
        permission_granted: true,
        source: "sample",
      });

      await supabase
        .from("workspaces")
        .update({ onboarding_completed: true })
        .eq("id", workspace.id);

      setFormSlug(slug);
      setCompleted(true);
    } catch (error) {
      // Error handled silently in production
    } finally {
      setCreating(false);
    }
  }

  async function handleStep2Next() {
    const supabase = createClient();
    await supabase
      .from("workspaces")
      .update({ name: workspaceName })
      .eq("id", workspace.id);
    setStep(3);
  }

  function handleCopyUrl() {
    const url = `${getBaseUrl()}/form/${formSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
      {/* Progress */}
      {step < 5 && (
        <div className="text-sm text-gray-400 text-center mb-6">
          {step} / 5
        </div>
      )}

      {/* Step 1: Segmentation */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
            あなたのビジネスについて教えてください
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            お客様はすでにいらっしゃいますか？
          </p>

          {hasCustomers === null && (
            <div className="space-y-3">
              <button
                onClick={() => {
                  setHasCustomers(true);
                  setStep(2);
                }}
                className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-gray-900 transition-colors text-left"
              >
                <span className="text-base font-medium text-gray-900">
                  はい、います
                </span>
              </button>
              <button
                onClick={() => setHasCustomers(false)}
                className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-gray-900 transition-colors text-left"
              >
                <span className="text-base font-medium text-gray-900">
                  まだいません
                </span>
              </button>
            </div>
          )}

          {hasCustomers === false && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-6">
                最初のお客様ができたら、VoiceHubがすぐにお役に立てます。今のうちにセットアップしておきましょう！
              </p>
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
                style={{ backgroundColor: brandColor }}
              >
                続ける
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Workspace Name */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
            サービス名を教えてください
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            フォームに表示される名前です
          </p>

          <input
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 mb-8"
            style={{ focusRingColor: brandColor } as React.CSSProperties}
            placeholder="例：山田コーチング"
          />

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              戻る
            </button>
            <button
              onClick={handleStep2Next}
              disabled={!workspaceName.trim()}
              className="px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: brandColor }}
            >
              次へ
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Template Selection */}
      {step === 3 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
            テンプレートを選択
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            業種に合ったテンプレートを選びましょう
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {FORM_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl.id)}
                className={`text-left p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                  selectedTemplate === tpl.id
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-gray-400"
                }`}
              >
                <span className="block text-sm font-bold text-gray-900">
                  {tpl.label}
                </span>
                <span className="block text-xs text-gray-500 mt-1">
                  {tpl.description}
                </span>
              </button>
            ))}
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              戻る
            </button>
            <button
              onClick={() => setStep(4)}
              className="px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
              style={{ backgroundColor: brandColor }}
            >
              次へ
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Form Customization */}
      {step === 4 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 text-center mb-2">
            フォームをカスタマイズ
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            お客様が見るフォームの見た目を設定します
          </p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                フォームタイトル
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                ブランドカラー
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                />
                <span className="text-sm text-gray-500">{brandColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                サンクスメッセージ
              </label>
              <input
                type="text"
                value={thankYouMessage}
                onChange={(e) => setThankYouMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="mt-6 rounded-lg border border-gray-200 overflow-hidden">
            <div
              className="px-4 py-3 text-white text-sm font-medium"
              style={{ backgroundColor: brandColor }}
            >
              {formTitle || "フォームタイトル"}
            </div>
            <div className="px-4 py-3 bg-gray-50 text-xs text-gray-500">
              プレビュー
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              戻る
            </button>
            <button
              onClick={() => {
                setStep(5);
                completeOnboarding();
              }}
              className="px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
              style={{ backgroundColor: brandColor }}
            >
              次へ
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Completion */}
      {step === 5 && (
        <div className="text-center">
          {creating && (
            <div className="py-12">
              <div
                className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                style={{ borderColor: brandColor, borderTopColor: "transparent" }}
              />
              <p className="text-sm text-gray-500">フォームを作成中...</p>
            </div>
          )}

          {completed && (
            <div>
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                お客様の声フォームが完成しました！
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                以下のURLをお客様に共有してください
              </p>

              <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 mb-6">
                <code className="flex-1 text-sm text-gray-700 truncate text-left">
                  {getBaseUrl()}/form/{formSlug}
                </code>
                <button
                  onClick={handleCopyUrl}
                  className="shrink-0 px-3 py-1.5 rounded-md text-xs font-medium text-white transition-colors"
                  style={{ backgroundColor: brandColor }}
                >
                  {copied ? "コピー済み" : "コピー"}
                </button>
              </div>

              <div className="space-y-3">
                <a
                  href={`${getBaseUrl()}/form/${formSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-6 py-2.5 rounded-lg text-sm font-medium border-2 transition-colors"
                  style={{ borderColor: brandColor, color: brandColor }}
                >
                  フォームをプレビュー
                </a>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-colors"
                  style={{ backgroundColor: brandColor }}
                >
                  ダッシュボードへ
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
