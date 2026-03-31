"use client";

import { useState, useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { FormRow, FormQuestion } from "@/types/database";
import { DEFAULT_BRAND_COLOR, TEXTAREA_MAX_LENGTH, IMAGE_MAX_SIZE_BYTES, IMAGE_RESIZED_MAX_BYTES, IMAGE_RESIZE_MAX_PX } from "@/lib/constants";
import { resizeImage } from "@/lib/image-utils";
import { StarRatingInput } from "@/app/components/star-rating-input";

type FormData = {
  rating: number;
  before_story: string;
  content: string;
  name: string;
  title: string;
  avatar: File | null;
  avatarPreview: string | null;
  permission: boolean;
  customFields: Record<string, string | boolean | number>;
};

const TEXTAREA_MAX = TEXTAREA_MAX_LENGTH;
const KNOWN_IDS = ["rating", "before_story", "content", "name", "title", "avatar", "permission"];

export type FormClientHandle = {
  skip: () => void;
};

function SpinnerIcon() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

const inputClass =
  "w-full rounded-xl border border-black/10 bg-gray-50 px-4 py-3.5 text-[15px] text-gray-900 placeholder-gray-400 transition-all duration-150 focus:outline-none focus:bg-white focus:border-transparent focus:ring-[3px]";

export const FormClient = forwardRef<FormClientHandle, { form: FormRow; demo?: boolean; onDemoClose?: () => void }>(function FormClient({ form, demo, onDemoClose }, ref) {
  const questions = form.questions.filter((q) => q.enabled !== false);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormData>({
    rating: 0,
    before_story: "",
    content: "",
    name: "",
    title: "",
    avatar: null,
    avatarPreview: null,
    permission: false,
    customFields: {},
  });

  // Cleanup preview object URL on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (formData.avatarPreview) {
        URL.revokeObjectURL(formData.avatarPreview);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const brandColor = form.brand_color || DEFAULT_BRAND_COLOR;
  const currentQuestion = questions[step];
  const totalSteps = questions.length;
  const progress = ((step + 1) / totalSteps) * 100;

  const updateField = useCallback(
    (field: keyof FormData, value: FormData[keyof FormData]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const updateCustomField = useCallback(
    (id: string, value: string | boolean | number) => {
      setFormData((prev) => ({
        ...prev,
        customFields: { ...prev.customFields, [id]: value },
      }));
    },
    []
  );

  const isCurrentStepValid = (): boolean => {
    const q = currentQuestion;
    if (!q.required) return true;

    switch (q.id) {
      case "rating":
        return formData.rating >= 1 && formData.rating <= 5;
      case "before_story":
        return formData.before_story.trim().length > 0;
      case "content":
        return formData.content.trim().length > 0;
      case "name":
        return formData.name.trim().length > 0;
      case "title":
        return formData.title.trim().length > 0;
      case "permission":
        return formData.permission;
      case "avatar":
        return formData.avatar !== null;
      default: {
        const customValue = formData.customFields[q.id];
        if (q.type === "star_rating") {
          return typeof customValue === "number" && customValue > 0;
        }
        if (q.type === "checkbox") {
          return customValue === true;
        }
        if (q.type === "select") {
          return typeof customValue === "string" && customValue.length > 0;
        }
        return typeof customValue === "string" && customValue.trim().length > 0;
      }
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください");
      return;
    }

    if (file.size > IMAGE_MAX_SIZE_BYTES) {
      setError("ファイルサイズが大きすぎます（10MB以下にしてください）");
      return;
    }

    setError(null);

    try {
      const resized = await resizeImage(file, IMAGE_RESIZE_MAX_PX);
      if (resized.size > IMAGE_RESIZED_MAX_BYTES) {
        setError("画像の圧縮後もサイズが大きすぎます。別の画像をお試しください。");
        return;
      }
      const resizedFile = new File([resized], file.name, { type: "image/jpeg" });
      const previewUrl = URL.createObjectURL(resized);
      setFormData((prev) => {
        if (prev.avatarPreview) {
          URL.revokeObjectURL(prev.avatarPreview);
        }
        return { ...prev, avatar: resizedFile, avatarPreview: previewUrl };
      });
    } catch {
      setError("画像の処理に失敗しました");
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    if (demo) {
      await new Promise((r) => setTimeout(r, 800));
      setSubmitted(true);
      setSubmitting(false);
      return;
    }

    const supabase = createClient();
    let avatarUrl: string | null = null;
    let uploadedPath: string | null = null;

    try {
      if (formData.avatar) {
        const path = `${form.id}/${crypto.randomUUID()}.jpg`;
        uploadedPath = path;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, formData.avatar, { contentType: "image/jpeg", upsert: false });

        if (uploadError) {
          throw new Error("写真のアップロードに失敗しました");
        }

        const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
        avatarUrl = publicUrlData.publicUrl;
      }

      const customFields: Record<string, string | boolean | number> = {};
      for (const [key, value] of Object.entries(formData.customFields)) {
        if (value !== "" && value !== false && value !== 0) {
          customFields[key] = value;
        }
      }

      const response = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form_id: form.id,
          rating: formData.rating,
          content: formData.content,
          before_story: formData.before_story || undefined,
          name: formData.name,
          title: formData.title || undefined,
          avatar_url: avatarUrl,
          permission_granted: formData.permission,
          ...(Object.keys(customFields).length > 0 && { custom_fields: customFields }),
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "送信に失敗しました");
      }

      setSubmitted(true);
    } catch (err) {
      if (uploadedPath) {
        supabase.storage.from("avatars").remove([uploadedPath]).catch(() => {});
      }
      setError(
        err instanceof Error ? err.message : "送信に失敗しました。もう一度お試しください。"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep(step + 1);
      setError(null);
    } else {
      handleSubmit();
    }
  };

  useImperativeHandle(ref, () => ({
    skip: () => {
      if (step < totalSteps - 1) {
        setStep(step + 1);
        setError(null);
      }
    },
  }), [step, totalSteps]);

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setError(null);
    }
  };

  // ── Success screen ──────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-dvh bg-[#F4F4F6] flex items-center justify-center px-4 py-8">
        <div
          className="animate-success-card w-full max-w-[440px] bg-white rounded-2xl px-10 py-14 text-center"
          style={{
            boxShadow: "0 0 0 1px rgba(0,0,0,0.05), 0 4px 6px -1px rgba(0,0,0,0.04), 0 16px 32px -4px rgba(0,0,0,0.08)",
          }}
        >
          <div
            className="mx-auto mb-8 w-20 h-20 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${brandColor}18` }}
          >
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ color: brandColor }}>
              <circle cx="18" cy="18" r="17" stroke="currentColor" strokeWidth="2" opacity="0.2" />
              <path
                d="M10 18l6 6 10-10"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="60"
                style={{ animation: "success-check 0.6s 0.2s cubic-bezier(0.22,1,0.36,1) forwards", strokeDashoffset: 60 }}
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-3">
            ありがとうございます！
          </h2>
          <p className="text-[15px] text-gray-500 leading-relaxed">
            {form.thank_you_message ||
              "お声をお寄せいただき、誠にありがとうございます。いただいた内容は大切に活用させていただきます。"}
          </p>
          {demo && (
            <Link
              href="/"
              className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-[15px] font-semibold transition-all hover:-translate-y-px"
              style={{
                backgroundColor: brandColor,
                boxShadow: `0 4px 12px ${brandColor}45`,
              }}
            >
              VoiceHubのトップに戻る
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ── Render question inputs ───────────────────────────────────
  const renderQuestion = (question: FormQuestion) => {
    const isKnown = KNOWN_IDS.includes(question.id);
    const ringStyle = { "--tw-ring-color": `${brandColor}40` } as React.CSSProperties;

    switch (question.type) {
      case "star_rating":
        if (isKnown) {
          return (
            <StarRatingInput
              value={formData.rating}
              onChange={(v) => updateField("rating", v)}
              brandColor={brandColor}
            />
          );
        }
        return (
          <StarRatingInput
            value={(formData.customFields[question.id] as number) || 0}
            onChange={(v) => updateCustomField(question.id, v)}
            brandColor={brandColor}
          />
        );

      case "textarea": {
        if (isKnown) {
          const fieldKey = question.id as "before_story" | "content";
          const value = formData[fieldKey];
          return (
            <div className="space-y-1.5">
              <textarea
                className={`${inputClass} resize-none min-h-[150px]`}
                style={ringStyle}
                placeholder={question.placeholder}
                value={value}
                onChange={(e) => updateField(fieldKey, e.target.value)}
                maxLength={TEXTAREA_MAX}
              />
              <p className="text-right text-[11px] text-gray-400">
                {value.length} / {TEXTAREA_MAX}
              </p>
            </div>
          );
        }
        const customValue = (formData.customFields[question.id] as string) || "";
        return (
          <div className="space-y-1.5">
            <textarea
              className={`${inputClass} resize-none min-h-[150px]`}
              style={ringStyle}
              placeholder={question.placeholder}
              value={customValue}
              onChange={(e) => updateCustomField(question.id, e.target.value)}
              maxLength={TEXTAREA_MAX}
            />
            <p className="text-right text-[11px] text-gray-400">
              {customValue.length} / {TEXTAREA_MAX}
            </p>
          </div>
        );
      }

      case "text": {
        if (isKnown) {
          const textKey = question.id as "name" | "title";
          return (
            <input
              type="text"
              className={inputClass}
              style={ringStyle}
              placeholder={question.placeholder}
              value={formData[textKey]}
              onChange={(e) => updateField(textKey, e.target.value)}
              maxLength={100}
            />
          );
        }
        return (
          <input
            type="text"
            className={inputClass}
            style={ringStyle}
            placeholder={question.placeholder}
            value={(formData.customFields[question.id] as string) || ""}
            onChange={(e) => updateCustomField(question.id, e.target.value)}
            maxLength={100}
          />
        );
      }

      case "select":
        return (
          <div className="relative">
            <select
              className={`${inputClass} appearance-none pr-10 cursor-pointer`}
              style={ringStyle}
              value={(formData.customFields[question.id] as string) || ""}
              onChange={(e) => updateCustomField(question.id, e.target.value)}
            >
              <option value="">選択してください</option>
              {(question.options || []).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        );

      case "image":
        return (
          <div className="space-y-4">
            {formData.avatarPreview && (
              <div className="flex justify-center">
                <div className="relative">
                  <img
                    src={formData.avatarPreview}
                    alt="プレビュー"
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-md"
                  />
                  <button
                    type="button"
                    className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
                    onClick={() => {
                      setFormData((prev) => {
                        if (prev.avatarPreview) URL.revokeObjectURL(prev.avatarPreview);
                        return { ...prev, avatar: null, avatarPreview: null };
                      });
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <button
              type="button"
              className="w-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-sm text-gray-400 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-600 transition-all duration-150 focus:outline-none"
              onClick={() => fileInputRef.current?.click()}
            >
              {formData.avatarPreview ? "別の写真を選択" : "クリックして写真をアップロード"}
            </button>
          </div>
        );

      case "checkbox": {
        if (isKnown) {
          return (
            <label className="flex items-start gap-3.5 cursor-pointer select-none">
              <div
                className="relative mt-0.5 w-5 h-5 rounded-[5px] border-2 shrink-0 transition-all duration-150"
                style={{
                  backgroundColor: formData.permission ? brandColor : "transparent",
                  borderColor: formData.permission ? brandColor : "#D1D5DB",
                  boxShadow: formData.permission ? `0 0 0 3px ${brandColor}25` : "none",
                }}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={formData.permission}
                  onChange={(e) => updateField("permission", e.target.checked)}
                />
                {formData.permission && (
                  <svg className="absolute inset-0 w-full h-full text-white p-[3px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-[15px] text-gray-700 leading-relaxed">
                はい、掲載を許可します
              </span>
            </label>
          );
        }
        const checked = (formData.customFields[question.id] as boolean) || false;
        return (
          <label className="flex items-start gap-3.5 cursor-pointer select-none">
            <div
              className="relative mt-0.5 w-5 h-5 rounded-[5px] border-2 shrink-0 transition-all duration-150"
              style={{
                backgroundColor: checked ? brandColor : "transparent",
                borderColor: checked ? brandColor : "#D1D5DB",
                boxShadow: checked ? `0 0 0 3px ${brandColor}25` : "none",
              }}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={(e) => updateCustomField(question.id, e.target.checked)}
              />
              {checked && (
                <svg className="absolute inset-0 w-full h-full text-white p-[3px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-[15px] text-gray-700 leading-relaxed">
              {question.label}
            </span>
          </label>
        );
      }

      default:
        return null;
    }
  };

  // ── Main form layout ─────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-[#F4F4F6] flex items-center justify-center px-4 py-8">
      <div
        className="w-full max-w-[480px] bg-white rounded-2xl px-8 py-8 sm:px-10 sm:py-10"
        style={{
          boxShadow:
            "0 0 0 1px rgba(0,0,0,0.05), 0 4px 6px -1px rgba(0,0,0,0.04), 0 16px 32px -4px rgba(0,0,0,0.08)",
        }}
      >
        {/* Branding row */}
        <div className="flex items-center gap-2.5 mb-5">
          {form.logo_url && (
            <img
              src={form.logo_url}
              alt=""
              className="w-7 h-7 rounded-md object-contain shrink-0"
            />
          )}
          <span className="text-sm font-semibold text-gray-800 truncate">{form.title}</span>
          {demo && (
            <button
              type="button"
              onClick={() => {
                if (step < totalSteps - 1) {
                  setStep(step + 1);
                  setError(null);
                } else {
                  onDemoClose?.();
                }
              }}
              className="ml-auto text-xs text-gray-400 hover:text-gray-600 cursor-pointer shrink-0 transition-colors"
            >
              スキップ →
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-0.5 w-full bg-gray-100 rounded-full overflow-hidden mb-8">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, backgroundColor: brandColor }}
          />
        </div>

        {/* Honeypot - hidden from humans, bots fill this */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }}>
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {/* Animated step content */}
        <div key={step} className="animate-step-in space-y-7">
          {/* Step counter */}
          <p className="text-[11px] font-medium tracking-[0.1em] uppercase text-gray-400">
            {step + 1} / {totalSteps}
          </p>

          {/* Question heading */}
          <h2 className="form-question text-gray-900">
            {currentQuestion.label}
            {currentQuestion.required && (
              <span className="text-red-400 text-sm font-normal ml-2 tracking-normal">必須</span>
            )}
          </h2>

          {/* Input */}
          {renderQuestion(currentQuestion)}
        </div>

        {/* Description (shown once, below the first input render) */}
        {form.description && step === 0 && (
          <p className="mt-4 text-sm text-gray-400 leading-relaxed">{form.description}</p>
        )}

        {/* Error message */}
        {error && (
          <div
            className="mt-5 flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3.5 text-sm text-red-700"
            style={{ borderLeft: "3px solid #EF4444", animation: "form-step-in 0.2s ease forwards" }}
          >
            <svg className="shrink-0 mt-0.5 w-4 h-4 text-red-500" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 10.5a.75.75 0 110-1.5.75.75 0 010 1.5zm.75-4.75a.75.75 0 01-1.5 0V5.25a.75.75 0 011.5 0v1.5z" />
            </svg>
            {error}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 h-[52px] rounded-xl px-6 text-gray-600 text-[15px] font-medium bg-gray-100 hover:bg-gray-200 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              ← 戻る
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={
              (!demo && currentQuestion.required && !isCurrentStepValid()) || submitting
            }
            className="flex-1 h-[52px] rounded-xl px-6 text-white text-[15px] font-semibold transition-all duration-150 focus:outline-none focus:ring-[3px] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: brandColor,
              boxShadow: `0 1px 3px rgba(0,0,0,0.12), 0 4px 12px ${brandColor}45`,
              "--tw-ring-color": `${brandColor}40`,
            } as React.CSSProperties}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <SpinnerIcon /> 送信中...
              </span>
            ) : step === totalSteps - 1 ? (
              "送信する"
            ) : (
              "次へ →"
            )}
          </button>
        </div>

        {/* Powered by footer */}
        <div className="mt-6 flex justify-end">
          <a
            href="https://voicehub.jp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-gray-300 hover:text-gray-500 transition-colors"
          >
            Powered by VoiceHub
          </a>
        </div>
      </div>
    </div>
  );
});
