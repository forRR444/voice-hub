"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { generateSlug, getBaseUrl } from "@/lib/utils";
import { DEFAULT_FORM_QUESTIONS, FORM_TEMPLATES } from "@/lib/default-questions";
import { WorkspaceRow } from "@/types/database";

const TOTAL_STEPS = 4;

export default function OnboardingClient({ workspace }: { workspace: WorkspaceRow }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [hasCustomers, setHasCustomers] = useState<boolean | null>(null);
  const [workspaceName, setWorkspaceName] = useState(workspace.name);
  const [selectedTemplate, setSelectedTemplate] = useState("coaching");
  const [brandColor, setBrandColor] = useState("#635BFF");
  const [creating, setCreating] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [formSlug, setFormSlug] = useState("");
  const [copied, setCopied] = useState(false);

  async function completeOnboarding() {
    setCreating(true);
    try {
      const supabase = createClient();
      const slug = generateSlug();
      const template = FORM_TEMPLATES.find(t => t.id === selectedTemplate);

      // Update workspace name
      await supabase
        .from("workspaces")
        .update({ name: workspaceName })
        .eq("id", workspace.id);

      // Create form
      const { data: form, error: formError } = await supabase
        .from("forms")
        .insert({
          workspace_id: workspace.id,
          slug,
          title: "お客様の声をお聞かせください",
          questions: template?.questions || DEFAULT_FORM_QUESTIONS,
          brand_color: brandColor,
          thank_you_message: "ご回答いただきありがとうございます！",
        })
        .select("id")
        .single();

      if (formError) throw formError;

      // Insert sample testimonial
      await supabase.from("testimonials").insert({
        workspace_id: workspace.id,
        form_id: form.id,
        rating: 5,
        content:
          "VoiceHubのおかげで、お客様の声を簡単に集めてウェブサイトに表示できるようになりました。セットアップも数分で完了して驚きました！",
        before_story:
          "お客様の声をホームページに載せたかったのですが、手動でコピペするのが手間で更新が止まっていました。",
        name: "VoiceHub サポートチーム",
        title: "サンプル",
        status: "approved",
        is_featured: true,
        permission_granted: true,
        source: "sample",
      });

      // Mark onboarding complete
      await supabase
        .from("workspaces")
        .update({ onboarding_completed: true })
        .eq("id", workspace.id);

      setFormSlug(slug);
      setCompleted(true);
    } catch {
      // Error handled silently
    } finally {
      setCreating(false);
    }
  }

  function handleCopyUrl() {
    const url = `${getBaseUrl()}/form/${formSlug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
      {/* Progress bar */}
      {!completed && (
        <div className="flex gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < step ? "bg-indigo-500" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      )}

      {/* Step 1: Segmentation — "顧客がいますか？" */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            あなたのビジネスについて教えてください
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            お客様はすでにいらっしゃいますか？
          </p>

          {hasCustomers === null ? (
            <div className="space-y-3">
              <button
                onClick={() => {
                  setHasCustomers(true);
                  setStep(2);
                }}
                className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-500 transition-colors text-left cursor-pointer"
              >
                <span className="text-base font-medium text-gray-900">はい、います</span>
                <span className="block text-sm text-gray-500 mt-1">お客様の声を集めて表示しましょう</span>
              </button>
              <button
                onClick={() => setHasCustomers(false)}
                className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-500 transition-colors text-left cursor-pointer"
              >
                <span className="text-base font-medium text-gray-900">まだいません</span>
                <span className="block text-sm text-gray-500 mt-1">今のうちにセットアップしておけます</span>
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-6">
                最初のお客様ができたら、VoiceHubがすぐにお役に立てます。<br />
                今のうちにセットアップしておきましょう！
              </p>
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-lg text-white text-sm font-medium bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
              >
                セットアップを始める
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Service name */}
      {step === 2 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            サービス名を教えてください
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8">
            お客様に表示される名前です
          </p>

          <input
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-8"
            placeholder="例：山田コーチング"
            autoFocus
          />

          <div className="flex justify-between">
            <button
              onClick={() => { setStep(1); setHasCustomers(null); }}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              戻る
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!workspaceName.trim()}
              className="px-6 py-2.5 rounded-lg text-white text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              次へ
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Template + Brand color (combined) */}
      {step === 3 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
            フォームを設定
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6">
            業種とブランドカラーを選んでください
          </p>

          {/* Template selection */}
          <label className="block text-sm font-medium text-gray-700 mb-2">業種テンプレート</label>
          <div className="grid grid-cols-2 gap-2 mb-6">
            {FORM_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl.id)}
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

          {/* Brand color */}
          <label className="block text-sm font-medium text-gray-700 mb-2">ブランドカラー</label>
          <div className="flex items-center gap-3 mb-8">
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
            />
            <span className="text-sm text-gray-500">{brandColor}</span>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              戻る
            </button>
            <button
              onClick={() => {
                setStep(4);
                completeOnboarding();
              }}
              className="px-6 py-2.5 rounded-lg text-white text-sm font-medium bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
            >
              フォームを作成
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Completion */}
      {step === 4 && (
        <div className="text-center">
          {creating && (
            <div className="py-12">
              <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-500">フォームを作成中...</p>
            </div>
          )}

          {completed && (
            <div>
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                フォームが完成しました！
              </h2>
              <p className="text-sm text-gray-500 mb-8">
                このURLをお客様に送るだけで、声が集まります
              </p>

              <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 mb-8">
                <code className="flex-1 text-sm text-gray-700 truncate text-left">
                  {getBaseUrl()}/form/{formSlug}
                </code>
                <button
                  onClick={handleCopyUrl}
                  className="shrink-0 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
                >
                  {copied ? "✓ コピー済み" : "コピー"}
                </button>
              </div>

              <div className="space-y-3">
                <a
                  href={`${getBaseUrl()}/form/${formSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full px-6 py-2.5 rounded-lg text-sm font-medium border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                >
                  フォームをプレビュー
                </a>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="w-full px-6 py-2.5 rounded-lg text-white text-sm font-medium bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
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
