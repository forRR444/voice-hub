"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";
import { DEFAULT_FORM_QUESTIONS, FORM_TEMPLATES } from "@/lib/default-questions";
import { WorkspaceRow, FormQuestion, FormRow } from "@/types/database";
import { DEFAULT_BRAND_COLOR } from "@/lib/constants";
import QuestionEditor from "@/app/components/question-editor";
import { FormClient, type FormClientHandle } from "@/app/form/[slug]/form-client";

export default function OnboardingClient({ workspace, betaUserCount = 0 }: { workspace: WorkspaceRow; betaUserCount?: number }) {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [workspaceName, setWorkspaceName] = useState(workspace.name);
  const [selectedTemplate, setSelectedTemplate] = useState("coaching");
  const [brandColor, setBrandColor] = useState(DEFAULT_BRAND_COLOR);
  const [questions, setQuestions] = useState<FormQuestion[]>(
    FORM_TEMPLATES[0].questions
  );
  const [creating, setCreating] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<FormClientHandle>(null);

  useEffect(() => {
    // Try flow: user built a form without logging in
    const tryDataRaw = localStorage.getItem("voicehub_try_data");
    if (tryDataRaw) {
      localStorage.removeItem("voicehub_try_data");
      try {
        const tryData = JSON.parse(tryDataRaw);
        const savedAt = new Date(tryData.savedAt);
        const daysOld = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysOld < 7 && tryData.questions) {
          (async () => {
            setCreating(true);
            try {
              const supabase = createClient();
              const slug = generateSlug();

              await supabase.from("workspaces").update({ name: tryData.workspaceName || "マイサービス" }).eq("id", workspace.id);

              const { data: form, error: formError } = await supabase
                .from("forms")
                .insert({
                  workspace_id: workspace.id,
                  slug,
                  title: "お客様の声をお聞かせください",
                  questions: tryData.questions,
                  brand_color: tryData.brandColor || DEFAULT_BRAND_COLOR,
                  thank_you_message: "ご回答いただきありがとうございます！",
                })
                .select("id")
                .single();

              if (formError) throw formError;

              await supabase.from("testimonials").insert({
                workspace_id: workspace.id,
                form_id: form.id,
                rating: 5,
                content: "下のURLをコピーして、お客様にLINEやメールで送ってください。",
                name: "VoiceHub ガイド",
                title: "ご案内",
                status: "approved",
                is_featured: false,
                permission_granted: true,
                source: "guide",
              });

              await supabase.from("widgets").insert({
                workspace_id: workspace.id,
                name: "カルーセル",
                type: "carousel",
                theme: { mode: "light", brandColor: tryData.brandColor || DEFAULT_BRAND_COLOR, showRating: true, showAvatar: true, showDate: false, maxItems: 10, autoplay: true },
                filter_min_rating: 1,
                only_featured: false,
              });

              await supabase.from("workspaces").update({ onboarding_completed: true }).eq("id", workspace.id);
              router.push("/dashboard");
            } catch (e) {
              setError(e instanceof Error ? e.message : "セットアップに失敗しました。もう一度お試しください。");
              setCreating(false);
              setChecking(false);
              setStep(1);
            }
          })();
          return;
        }
      } catch {
        // Invalid JSON, ignore
      }
    }

    // Legacy popup flow
    const skipOnboarding = localStorage.getItem("voicehub_skip_onboarding");
    if (skipOnboarding) {
      const storedTemplate = localStorage.getItem("voicehub_template") || "coaching";
      localStorage.removeItem("voicehub_skip_onboarding");
      localStorage.removeItem("voicehub_template");
      (async () => {
        setCreating(true);
        try {
          const supabase = createClient();
          const slug = generateSlug();
          const template = FORM_TEMPLATES.find(t => t.id === storedTemplate);

          await supabase.from("workspaces").update({ name: workspace.name || "マイサービス" }).eq("id", workspace.id);

          const { data: form, error: formError } = await supabase
            .from("forms")
            .insert({
              workspace_id: workspace.id,
              slug,
              title: "お客様の声をお聞かせください",
              questions: template?.questions || DEFAULT_FORM_QUESTIONS,
              brand_color: DEFAULT_BRAND_COLOR,
              thank_you_message: "ご回答いただきありがとうございます！",
            })
            .select("id")
            .single();

          if (formError) throw formError;

          await supabase.from("testimonials").insert({
            workspace_id: workspace.id,
            form_id: form.id,
            rating: 5,
            content: "下のURLをコピーして、お客様にLINEやメールで送ってください。",
            name: "VoiceHub ガイド",
            title: "ご案内",
            status: "approved",
            is_featured: false,
            permission_granted: true,
            source: "guide",
          });

          await supabase.from("widgets").insert({
            workspace_id: workspace.id,
            name: "カルーセル",
            type: "carousel",
            theme: { mode: "light", brandColor: DEFAULT_BRAND_COLOR, showRating: true, showAvatar: true, showDate: false, maxItems: 10, autoplay: true },
            filter_min_rating: 1,
            only_featured: false,
          });

          await supabase.from("workspaces").update({ onboarding_completed: true }).eq("id", workspace.id);
          router.push("/dashboard");
        } catch (e) {
          setError(e instanceof Error ? e.message : "セットアップに失敗しました。もう一度お試しください。");
          setCreating(false);
          setChecking(false);
          setStep(0);
        }
      })();
      return;
    }

    // Template from localStorage (set during popup)
    const stored = localStorage.getItem("voicehub_template");
    if (stored) {
      localStorage.removeItem("voicehub_template");
      const template = FORM_TEMPLATES.find(t => t.id === stored);
      if (template) {
        setSelectedTemplate(stored);
        setQuestions(template.questions);
      }
    }

    setChecking(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTemplateChange(templateId: string) {
    setSelectedTemplate(templateId);
    const template = FORM_TEMPLATES.find((t) => t.id === templateId);
    if (template) setQuestions(template.questions);
  }

  async function completeOnboarding() {
    setCreating(true);
    setError(null);
    try {
      const supabase = createClient();
      const slug = generateSlug();

      await supabase
        .from("workspaces")
        .update({ name: workspaceName })
        .eq("id", workspace.id);

      const { data: form, error: formError } = await supabase
        .from("forms")
        .insert({
          workspace_id: workspace.id,
          slug,
          title: "お客様の声をお聞かせください",
          questions,
          brand_color: brandColor,
          thank_you_message: "ご回答いただきありがとうございます！",
        })
        .select("id")
        .single();

      if (formError) throw formError;

      await supabase.from("testimonials").insert({
        workspace_id: workspace.id,
        form_id: form.id,
        rating: 5,
        content: "下のURLをコピーして、お客様にLINEやメールで送ってください。お客様の回答がここに届きます。",
        name: "VoiceHub ガイド",
        title: "ご案内",
        status: "approved",
        is_featured: false,
        permission_granted: true,
        source: "guide",
      });

      await supabase.from("widgets").insert({
        workspace_id: workspace.id,
        name: "カルーセル",
        type: "carousel",
        theme: {
          mode: "light",
          brandColor: brandColor,
          showRating: true,
          showAvatar: true,
          showDate: false,
          maxItems: 10,
          autoplay: true,
        },
        filter_min_rating: 1,
        only_featured: false,
      });

      await supabase
        .from("workspaces")
        .update({ onboarding_completed: true })
        .eq("id", workspace.id);

      setCompleted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "フォームの作成に失敗しました。もう一度お試しください。");
    } finally {
      setCreating(false);
    }
  }

  const previewForm: FormRow = {
    id: "onboarding-preview",
    workspace_id: "onboarding-preview",
    slug: "onboarding-preview",
    title: workspaceName || "お客様の声をお聞かせください",
    description: null,
    brand_color: brandColor,
    logo_url: null,
    thank_you_message: "ご回答ありがとうございました！（これはプレビューです）",
    questions: questions.filter((q) => q.enabled !== false),
    created_at: new Date().toISOString(),
  };

  if (checking || (creating && !completed)) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">準備中...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
        {/* Early adopter banner */}
        {betaUserCount <= 10 && (
          <div className="bg-indigo-50 text-indigo-700 text-sm rounded-lg px-4 py-3 mb-6 text-center">
            先着10名限定：正式リリース後もずっと無料でご利用いただけます（現在 {betaUserCount}/10名）
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-6 text-center">
            {error}
          </div>
        )}

        {/* Progress bar */}
        {!completed && (
          <div className="flex gap-2 mb-8">
            {[1, 2].map((i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i <= step ? "bg-indigo-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        )}

        {/* Step 1: サービス名 + テンプレート */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              フォームを作りましょう
            </h2>
            <p className="text-sm text-gray-500 text-center mb-6">
              サービス名とテンプレートを選んでください。
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
                disabled={!workspaceName.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
              >
                次へ
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: カスタマイズ */}
        {step === 2 && !completed && (
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
                onClick={() => completeOnboarding()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-medium bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
              >
                フォームを作成
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Completion */}
        {completed && (
          <div className="text-center">
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-30" />
              <div className="relative w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              フォームが完成しました！
            </h2>
            <p className="text-gray-500 mb-8">
              フォームの質問内容を確認・編集してから、お客様に送りましょう。
            </p>

            <button
              onClick={() => router.push("/dashboard")}
              className="w-full px-6 py-3 rounded-xl text-white text-sm font-medium bg-indigo-600 hover:bg-indigo-700 cursor-pointer transition-colors"
            >
              フォームを確認する
            </button>
          </div>
        )}
      </div>

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
