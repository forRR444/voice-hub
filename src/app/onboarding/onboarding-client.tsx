"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Copy, Check } from "lucide-react";
import { useCopy } from "@/hooks/use-copy";
import { createClient } from "@/lib/supabase/client";
import { generateSlug, getBaseUrl } from "@/lib/utils";
import { FORM_TEMPLATES } from "@/lib/default-questions";
import { WorkspaceRow, FormQuestion } from "@/types/database";
import { DEFAULT_BRAND_COLOR } from "@/lib/constants";
import GoogleImportStep, { type PickedReview } from "@/app/components/google-import-step";
import StepCard from "@/app/components/step-card";

export default function OnboardingClient({ workspace, betaUserCount = 0 }: { workspace: WorkspaceRow; betaUserCount?: number }) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [questions] = useState<FormQuestion[]>(FORM_TEMPLATES[0].questions);
  const [creating, setCreating] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const { copiedKey, copy } = useCopy();

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

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if (tryData.googleReviews?.length > 0) {
                await supabase.from("testimonials").insert(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  tryData.googleReviews.map((r: any) => ({
                    workspace_id: workspace.id,
                    form_id: null,
                    name: "Googleユーザー",
                    content: r.content,
                    rating: r.rating,
                    avatar_url: null,
                    status: "approved",
                    source: "google",
                    is_featured: false,
                    permission_granted: true,
                    submitted_at: r.publishTime,
                  }))
                );
              }

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
          const slug = generateSlug();
          const template = FORM_TEMPLATES.find(t => t.id === storedTemplate);
          await supabase.from("workspaces").update({ name: workspace.name || "マイサービス" }).eq("id", workspace.id);
          const { data: form, error: formError } = await supabase
            .from("forms")
            .insert({
              workspace_id: workspace.id,
              slug,
              title: "お客様の声をお聞かせください",
              questions: template?.questions || FORM_TEMPLATES[0].questions,
              brand_color: DEFAULT_BRAND_COLOR,
              thank_you_message: "ご回答いただきありがとうございます！",
            })
            .select("id")
            .single();
          if (formError) throw formError;
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

    setChecking(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 1 → Step 2: フォーム・ウィジェット作成 + Google口コミ保存
  async function handleSetupAndNext(selectedReviews: PickedReview[] = []) {
    setCreating(true);
    setError(null);
    try {
      const slug = generateSlug();
      const { error: formError } = await supabase
        .from("forms")
        .insert({
          workspace_id: workspace.id,
          slug,
          title: "お客様の声をお聞かせください",
          questions,
          brand_color: DEFAULT_BRAND_COLOR,
          thank_you_message: "ご回答いただきありがとうございます！",
        })
        .select("id")
        .single();
      if (formError) throw formError;

      if (selectedReviews.length > 0) {
        await supabase.from("testimonials").insert(
          selectedReviews.map(r => ({
            workspace_id: workspace.id,
            form_id: null,
            name: "Googleユーザー",
            content: r.content,
            rating: r.rating,
            avatar_url: null,
            status: "approved",
            source: "google",
            is_featured: false,
            permission_granted: true,
            submitted_at: r.publishTime,
          }))
        );
      }

      const { data: widget, error: widgetError } = await supabase
        .from("widgets")
        .insert({
          workspace_id: workspace.id,
          name: "カルーセル",
          type: "carousel",
          theme: { mode: "light", brandColor: DEFAULT_BRAND_COLOR, showRating: true, showAvatar: true, showDate: false, maxItems: 10, autoplay: true },
          filter_min_rating: 1,
          only_featured: false,
        })
        .select("id")
        .single();
      if (widgetError) throw widgetError;

      setWidgetId(widget.id);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "セットアップに失敗しました。もう一度お試しください。");
    } finally {
      setCreating(false);
    }
  }

  // Step 2 → ダッシュボード
  async function handleFinish() {
    await supabase.from("workspaces").update({ onboarding_completed: true }).eq("id", workspace.id);
    router.push("/dashboard");
  }

  const baseUrl = getBaseUrl();
  const scriptCode = widgetId
    ? `<script src="${baseUrl}/widget/v1/embed.js" defer></script>\n<div data-testimonial-widget="${widgetId}" data-theme="light"></div>`
    : "";
  const iframeCode = widgetId
    ? `<iframe src="${baseUrl}/preview/${widgetId}" width="100%" height="400" frameborder="0"></iframe>`
    : "";

  if (checking || creating) {
    return (
      <StepCard step={1}>
        <div className="py-12 text-center">
          <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">準備中...</p>
        </div>
      </StepCard>
    );
  }

  const header = (
    <>
      {betaUserCount <= 10 && (
        <div className="bg-indigo-50 text-indigo-700 text-sm rounded-lg px-4 py-3 mb-6 text-center">
          先着10名限定：正式リリース後もずっと無料でご利用いただけます（現在 {betaUserCount}/10名）
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3 mb-6 text-center">
          {error}
        </div>
      )}
    </>
  );

  return (
    <StepCard step={step} header={header}>

      {/* Step 1: Google口コミ取り込み */}
      {step === 1 && (
        <GoogleImportStep
          footer={(selectedReviews) => (
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => handleSetupAndNext([])}
                disabled={creating}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 cursor-pointer"
              >
                スキップして次へ
              </button>
              <button
                onClick={() => handleSetupAndNext(selectedReviews)}
                disabled={selectedReviews.length === 0 || creating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
              >
                {selectedReviews.length > 0
                  ? `${selectedReviews.length}件を取り込む`
                  : "取り込む"}
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        />
      )}

      {/* Step 2: 埋め込みコード */}
      {step === 2 && (
        <div>
          <div className="text-center mb-6">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-30" />
              <div className="relative w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">準備完了です！</h2>
            <p className="text-sm text-gray-500">
              下のコードをコピーして、ホームページのHTMLに貼り付けてください。
            </p>
          </div>

          <div className="flex flex-col gap-4 mb-4">
            {/* Script embed */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">
                  スクリプト埋め込み
                  <span className="font-normal text-gray-400 ml-2">おすすめ・デザインが自然に馴染む</span>
                </span>
                <button
                  onClick={() => copy(scriptCode, "script")}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  {copiedKey === "script" ? <><Check size={12} />コピーしました</> : <><Copy size={12} />コピー</>}
                </button>
              </div>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all font-mono leading-relaxed">
                {scriptCode}
              </pre>
            </div>

            {/* iFrame embed */}
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">
                  iFrame埋め込み
                  <span className="font-normal text-gray-400 ml-2">ペライチ・Wixなどスクリプトが使えない場合</span>
                </span>
                <button
                  onClick={() => copy(iframeCode, "iframe")}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  {copiedKey === "iframe" ? <><Check size={12} />コピーしました</> : <><Copy size={12} />コピー</>}
                </button>
              </div>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all font-mono leading-relaxed">
                {iframeCode}
              </pre>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center mb-6">
            ペライチ・WordPress・Wix・どんなサイトにも対応しています
          </p>

          <button
            onClick={handleFinish}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-medium bg-indigo-600 hover:bg-indigo-700 cursor-pointer transition-colors"
          >
            ダッシュボードへ
            <ArrowRight size={16} />
          </button>

          <div className="flex justify-center mt-4">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <ArrowLeft size={14} />戻る
            </button>
          </div>
        </div>
      )}
    </StepCard>
  );
}
