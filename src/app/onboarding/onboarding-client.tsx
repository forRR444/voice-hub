"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Search, Star, MapPin, Copy, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { generateSlug, getBaseUrl } from "@/lib/utils";
import { FORM_TEMPLATES } from "@/lib/default-questions";
import { WorkspaceRow, FormQuestion } from "@/types/database";
import { DEFAULT_BRAND_COLOR } from "@/lib/constants";

type Place = {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
};

type GoogleReview = {
  name: string;
  rating: number;
  text?: { text: string };
  originalText?: { text: string };
  authorAttribution: {
    displayName: string;
    photoUri?: string;
  };
  publishTime: string;
  relativePublishTimeDescription: string;
};

type GoogleStep = "search" | "reviews";

export default function OnboardingClient({ workspace, betaUserCount = 0 }: { workspace: WorkspaceRow; betaUserCount?: number }) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [path, setPath] = useState<"form" | "google" | null>(null);
  const [workspaceName, setWorkspaceName] = useState(workspace.name);
  const [selectedTemplate, setSelectedTemplate] = useState("coaching");
  const [questions, setQuestions] = useState<FormQuestion[]>(FORM_TEMPLATES[0].questions);
  const [creating, setCreating] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Google Reviews state
  const [googleStep, setGoogleStep] = useState<GoogleStep>("search");
  const [googleQuery, setGoogleQuery] = useState("");
  const [googleSearchLoading, setGoogleSearchLoading] = useState(false);
  const [googlePlaces, setGooglePlaces] = useState<Place[]>([]);
  const [googleSelectedPlace, setGoogleSelectedPlace] = useState<Place | null>(null);
  const [googleReviews, setGoogleReviews] = useState<GoogleReview[]>([]);
  const [googleReviewsLoading, setGoogleReviewsLoading] = useState(false);
  const [googleSelectedIds, setGoogleSelectedIds] = useState<Set<string>>(new Set());
  const [googleError, setGoogleError] = useState("");

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
                    name: r.name,
                    content: r.content,
                    rating: r.rating,
                    avatar_url: r.photoUri || null,
                    status: "approved",
                    source: "google",
                    is_featured: false,
                    permission_granted: true,
                    submitted_at: r.publishTime,
                  }))
                );
              }

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

    // Template from localStorage
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

  // Google Reviews: ビジネス検索
  async function handleGoogleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!googleQuery.trim()) return;
    setGoogleSearchLoading(true);
    setGoogleError("");
    setGooglePlaces([]);

    const res = await fetch(`/api/google-reviews?action=search&query=${encodeURIComponent(googleQuery)}`);
    const data = await res.json();
    setGoogleSearchLoading(false);

    if (!res.ok) { setGoogleError(data.error || "検索に失敗しました"); return; }
    setGooglePlaces(data.places);
    if (data.places.length === 0) setGoogleError("ビジネスが見つかりませんでした。別のキーワードで試してください。");
  }

  async function handleGoogleSelectPlace(place: Place) {
    setGoogleSelectedPlace(place);
    setGoogleStep("reviews");
    setGoogleSelectedIds(new Set());
    setGoogleError("");
    setGoogleReviewsLoading(true);
    setGoogleReviews([]);

    const res = await fetch(`/api/google-reviews?action=reviews&placeId=${encodeURIComponent(place.id)}`);
    const data = await res.json();
    setGoogleReviewsLoading(false);

    if (!res.ok) { setGoogleError(data.error || "口コミの取得に失敗しました"); return; }
    setGoogleReviews(data.reviews);
    if (data.reviews.length === 0) setGoogleError("口コミがまだありません。");
  }

  function toggleGoogleSelect(reviewName: string) {
    setGoogleSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(reviewName)) next.delete(reviewName);
      else next.add(reviewName);
      return next;
    });
  }

  function toggleGoogleSelectAll() {
    if (googleSelectedIds.size === googleReviews.length) {
      setGoogleSelectedIds(new Set());
    } else {
      setGoogleSelectedIds(new Set(googleReviews.map((r) => r.name)));
    }
  }

  // Step 2 → Step 3: Google口コミ保存 + フォーム・ウィジェット作成
  async function handleSetupAndNext(skipGoogle = false) {
    setCreating(true);
    setError(null);
    try {
      await supabase.from("workspaces").update({ name: workspaceName }).eq("id", workspace.id);

      const slug = generateSlug();
      const template = FORM_TEMPLATES.find(t => t.id === selectedTemplate);
      const { data: form, error: formError } = await supabase
        .from("forms")
        .insert({
          workspace_id: workspace.id,
          slug,
          title: "お客様の声をお聞かせください",
          questions: template?.questions || questions,
          brand_color: DEFAULT_BRAND_COLOR,
          thank_you_message: "ご回答いただきありがとうございます！",
        })
        .select("id")
        .single();
      if (formError) throw formError;

      // Google口コミをインポート
      if (!skipGoogle && googleSelectedIds.size > 0) {
        const toImport = googleReviews.filter(r => googleSelectedIds.has(r.name));
        await supabase.from("testimonials").insert(
          toImport.map(r => ({
            workspace_id: workspace.id,
            form_id: null,
            name: r.authorAttribution.displayName,
            content: r.originalText?.text || r.text?.text || "",
            rating: r.rating,
            avatar_url: r.authorAttribution.photoUri || null,
            status: "approved",
            source: "google",
            is_featured: false,
            permission_granted: true,
            submitted_at: r.publishTime,
          }))
        );
      }

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
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "セットアップに失敗しました。もう一度お試しください。");
    } finally {
      setCreating(false);
    }
  }

  // Step 3 → ダッシュボード
  async function handleFinish() {
    await supabase.from("workspaces").update({ onboarding_completed: true }).eq("id", workspace.id);
    router.push("/dashboard");
  }

  const baseUrl = getBaseUrl();
  const embedCode = widgetId
    ? `<script src="${baseUrl}/widget/v1/embed.js" defer></script>\n<div data-testimonial-widget="${widgetId}" data-theme="light"></div>`
    : "";

  function copyEmbed() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (checking || creating) {
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
      {/* Early adopter banner */}
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

      {/* Progress bar */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-indigo-500" : "bg-gray-200"}`} />
        ))}
      </div>

      {/* Step 1: パス選択 */}
      {step === 1 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">どちらで始めますか？</h2>
          <p className="text-sm text-gray-500 text-center mb-8">あとからどちらも使えます。</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => { setPath("form"); setStep(2); }}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors cursor-pointer text-left"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 text-center">フォームを作成する</p>
                <p className="text-xs text-gray-500 text-center mt-1">お客様に記入してもらう</p>
              </div>
            </button>

            <button
              onClick={() => { setPath("google"); setStep(2); }}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors cursor-pointer text-left"
            >
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 text-center">Google口コミを取り込む</p>
                <p className="text-xs text-gray-500 text-center mt-1">既存の口コミをすぐに表示</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: フォームパス - サービス名 + テンプレート */}
      {step === 2 && path === "form" && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 text-center mb-2">フォームを作りましょう</h2>
          <p className="text-sm text-gray-500 text-center mb-6">サービス名と業種を選んでください。</p>

          <label className="block text-sm font-medium text-gray-700 mb-2">サービス名</label>
          <input
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-6"
            placeholder="例：山田コーチング"
            autoFocus
          />

          <label className="block text-sm font-medium text-gray-700 mb-2">業種テンプレート</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
            {FORM_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => handleTemplateChange(tpl.id)}
                className={`text-left p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                  selectedTemplate === tpl.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="block text-sm font-medium text-gray-900">{tpl.label}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{tpl.description}</span>
              </button>
            ))}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer">
              <ArrowLeft size={16} />戻る
            </button>
            <button
              onClick={() => handleSetupAndNext(true)}
              disabled={!workspaceName.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              作成する <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Googleパス - 口コミ取り込み */}
      {step === 2 && path === "google" && (
        <div className="flex flex-col gap-4">
          <div className="text-center mb-2">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Google口コミを取り込む</h2>
            <p className="text-sm text-gray-500">取り込んだ口コミをすぐにサイトに表示できます。</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">サービス名</label>
            <input
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="例：山田歯科クリニック"
            />
          </div>

          {googleError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{googleError}</div>
          )}

          {googleStep === "search" && (
            <>
              <form onSubmit={handleGoogleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={googleQuery}
                  onChange={(e) => setGoogleQuery(e.target.value)}
                  placeholder="ビジネス名を入力（例：田中歯科クリニック 東京）"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={googleSearchLoading || !googleQuery.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Search size={15} />検索
                </button>
              </form>

              {googleSearchLoading && <p className="text-sm text-gray-400 text-center py-2">検索中...</p>}

              {googlePlaces.length > 0 && (
                <div className="flex flex-col gap-2 max-h-52 overflow-y-auto">
                  {googlePlaces.map((place) => (
                    <button
                      key={place.id}
                      onClick={() => handleGoogleSelectPlace(place)}
                      className="text-left p-3 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                    >
                      <p className="text-sm font-medium text-gray-900">{place.displayName.text}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} />{place.formattedAddress}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {googleStep === "reviews" && (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setGoogleStep("search"); setGoogleError(""); }}
                  className="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  ← 検索に戻る
                </button>
                <span className="text-sm font-medium text-gray-700 truncate">{googleSelectedPlace?.displayName.text}</span>
              </div>

              {googleReviewsLoading && <p className="text-sm text-gray-400 text-center py-2">取得中...</p>}

              {googleReviews.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <button onClick={toggleGoogleSelectAll} className="text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer">
                      {googleSelectedIds.size === googleReviews.length ? "選択を解除" : "全て選択"}
                    </button>
                    <span className="text-xs text-gray-400">{googleReviews.length}件</span>
                  </div>
                  <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
                    {googleReviews.map((review) => (
                      <label
                        key={review.name}
                        className={`flex gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          googleSelectedIds.has(review.name) ? "border-indigo-300 bg-indigo-50/50" : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={googleSelectedIds.has(review.name)}
                          onChange={() => toggleGoogleSelect(review.name)}
                          className="mt-0.5 accent-indigo-600 cursor-pointer shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-800 truncate">{review.authorAttribution.displayName}</span>
                            <span className="text-xs text-gray-400 shrink-0">{review.relativePublishTimeDescription}</span>
                          </div>
                          <div className="flex gap-0.5 mb-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} size={12} className={i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
                            ))}
                          </div>
                          {(review.originalText?.text || review.text?.text) && (
                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                              {review.originalText?.text || review.text?.text}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          <div className="flex justify-between mt-2">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <ArrowLeft size={16} />戻る
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => handleSetupAndNext(true)}
                className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 cursor-pointer"
              >
                スキップして次へ
              </button>
              <button
                onClick={() => handleSetupAndNext(false)}
                disabled={googleSelectedIds.size === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
              >
                {googleSelectedIds.size > 0 ? `${googleSelectedIds.size}件を取り込む` : "取り込む"}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: 埋め込みコード */}
      {step === 3 && (
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

          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">埋め込みコード（スクリプト）</span>
              <button
                onClick={copyEmbed}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                {copied ? <><Check size={12} />コピーしました</> : <><Copy size={12} />コピー</>}
              </button>
            </div>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all font-mono leading-relaxed">
              {embedCode}
            </pre>
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
        </div>
      )}
    </div>
  );
}
