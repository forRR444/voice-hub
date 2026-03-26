"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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


export function FormClient({ form, demo }: { form: FormRow; demo?: boolean }) {
  const questions = form.questions;
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
        // Custom question validation
        const customValue = formData.customFields[q.id];
        if (q.type === "star_rating") {
          return typeof customValue === "number" && customValue > 0;
        }
        if (q.type === "checkbox") {
          return customValue === true;
        }
        // text / textarea
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
      const resizedFile = new File([resized], file.name, {
        type: "image/jpeg",
      });
      const previewUrl = URL.createObjectURL(resized);
      setFormData((prev) => {
        if (prev.avatarPreview) {
          URL.revokeObjectURL(prev.avatarPreview);
        }
        return {
          ...prev,
          avatar: resizedFile,
          avatarPreview: previewUrl,
        };
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
      // Upload avatar if present
      if (formData.avatar) {
        const path = `${form.id}/${crypto.randomUUID()}.jpg`;
        uploadedPath = path;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, formData.avatar, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (uploadError) {
          throw new Error("写真のアップロードに失敗しました");
        }

        const { data: publicUrlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(path);
        avatarUrl = publicUrlData.publicUrl;
      }

      // Collect custom fields (only non-empty values)
      const customFields: Record<string, string | boolean | number> = {};
      for (const [key, value] of Object.entries(formData.customFields)) {
        if (value !== "" && value !== false && value !== 0) {
          customFields[key] = value;
        }
      }

      // Submit testimonial
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
      // Clean up orphaned avatar file if upload succeeded but submission failed
      if (uploadedPath) {
        supabase.storage.from("avatars").remove([uploadedPath]).catch(() => {});
      }
      setError(
        err instanceof Error
          ? err.message
          : "送信に失敗しました。もう一度お試しください。"
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

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setError(null);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center space-y-6 p-8">
          <div
            className="mx-auto w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl"
            style={{ backgroundColor: brandColor }}
          >
            ✓
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            ありがとうございます！
          </h2>
          <p className="text-gray-600 leading-relaxed">
            {form.thank_you_message ||
              "お声をお寄せいただき、誠にありがとうございます。いただいた内容は大切に活用させていただきます。"}
          </p>
          {demo && (
            <Link
              href="/"
              className="inline-block mt-2 px-6 py-3 text-sm font-medium text-white rounded-lg transition-colors"
              style={{ backgroundColor: brandColor }}
            >
              VoiceHubのトップに戻る
            </Link>
          )}
        </div>
      </div>
    );
  }

  const renderQuestion = (question: FormQuestion) => {
    const isKnown = KNOWN_IDS.includes(question.id);

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
            <div className="space-y-2">
              <textarea
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-shadow resize-none min-h-[160px]"
                style={
                  {
                    "--tw-ring-color": brandColor,
                  } as React.CSSProperties
                }
                placeholder={question.placeholder}
                value={value}
                onChange={(e) => updateField(fieldKey, e.target.value)}
                maxLength={TEXTAREA_MAX}
              />
              <p className="text-right text-sm text-gray-400">
                {value.length} / {TEXTAREA_MAX}
              </p>
            </div>
          );
        }
        const customValue = (formData.customFields[question.id] as string) || "";
        return (
          <div className="space-y-2">
            <textarea
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-shadow resize-none min-h-[160px]"
              style={
                {
                  "--tw-ring-color": brandColor,
                } as React.CSSProperties
              }
              placeholder={question.placeholder}
              value={customValue}
              onChange={(e) => updateCustomField(question.id, e.target.value)}
              maxLength={TEXTAREA_MAX}
            />
            <p className="text-right text-sm text-gray-400">
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
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-shadow"
              style={
                {
                  "--tw-ring-color": brandColor,
                } as React.CSSProperties
              }
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
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-shadow"
            style={
              {
                "--tw-ring-color": brandColor,
              } as React.CSSProperties
            }
            placeholder={question.placeholder}
            value={(formData.customFields[question.id] as string) || ""}
            onChange={(e) => updateCustomField(question.id, e.target.value)}
            maxLength={100}
          />
        );
      }

      case "image":
        return (
          <div className="space-y-4">
            {formData.avatarPreview && (
              <div className="flex justify-center">
                <img
                  src={formData.avatarPreview}
                  alt="プレビュー"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                />
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
              className="w-full rounded-lg border-2 border-dashed border-gray-300 px-4 py-8 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              onClick={() => fileInputRef.current?.click()}
            >
              {formData.avatarPreview
                ? "別の写真を選択"
                : "クリックして写真を選択"}
            </button>
            {formData.avatarPreview && (
              <button
                type="button"
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => {
                  setFormData((prev) => {
                    if (prev.avatarPreview) {
                      URL.revokeObjectURL(prev.avatarPreview);
                    }
                    return {
                      ...prev,
                      avatar: null,
                      avatarPreview: null,
                    };
                  });
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                写真を削除
              </button>
            )}
          </div>
        );

      case "checkbox": {
        if (isKnown) {
          return (
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={formData.permission}
                  onChange={(e) => updateField("permission", e.target.checked)}
                />
                <div
                  className="w-6 h-6 rounded border-2 border-gray-300 transition-colors peer-checked:border-transparent"
                  style={{
                    backgroundColor: formData.permission
                      ? brandColor
                      : "transparent",
                    borderColor: formData.permission ? brandColor : undefined,
                  }}
                >
                  {formData.permission && (
                    <svg
                      className="w-full h-full text-white p-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-gray-700 leading-relaxed">
                はい、掲載を許可します
              </span>
            </label>
          );
        }
        const checked = (formData.customFields[question.id] as boolean) || false;
        return (
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={checked}
                onChange={(e) => updateCustomField(question.id, e.target.checked)}
              />
              <div
                className="w-6 h-6 rounded border-2 border-gray-300 transition-colors peer-checked:border-transparent"
                style={{
                  backgroundColor: checked ? brandColor : "transparent",
                  borderColor: checked ? brandColor : undefined,
                }}
              >
                {checked && (
                  <svg
                    className="w-full h-full text-white p-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-gray-700 leading-relaxed">
              {question.label}
            </span>
          </label>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            {form.logo_url && (
              <img
                src={form.logo_url}
                alt=""
                className="w-8 h-8 rounded object-contain"
              />
            )}
            <h1 className="text-lg font-bold text-gray-900">{form.title}</h1>
          </div>
          <a
            href="https://voicehub.jp"
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-1 text-xs text-gray-400 hover:text-gray-600"
          >
            Powered by VoiceHub
          </a>
          {form.description && (
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              {form.description}
            </p>
          )}
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white">
        <div className="max-w-lg mx-auto px-4">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${progress}%`,
                backgroundColor: brandColor,
              }}
            />
          </div>
        </div>
      </div>

      {/* Form content */}
      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg space-y-6">
          {/* Step indicator */}
          <p className="text-sm text-gray-400">
            {step + 1} / {totalSteps}
          </p>

          {/* Honeypot - hidden from humans, bots fill this */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }}>
            <label>
              Website
              <input type="text" name="website" tabIndex={-1} autoComplete="off" />
            </label>
          </div>

          {/* Question */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
              {currentQuestion.label}
              {currentQuestion.required && (
                <span className="text-red-400 ml-1 text-sm">*必須</span>
              )}
            </h2>
            {renderQuestion(currentQuestion)}
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 rounded-lg border border-gray-300 px-6 py-3 text-gray-700 font-medium hover:bg-gray-100 transition-colors focus:outline-none"
              >
                戻る
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={
                (currentQuestion.required && !isCurrentStepValid()) ||
                submitting
              }
              className="flex-1 rounded-lg px-6 py-3 text-white font-medium transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: brandColor }}
            >
              {submitting
                ? "送信中..."
                : step === totalSteps - 1
                  ? "送信する"
                  : "次へ"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
