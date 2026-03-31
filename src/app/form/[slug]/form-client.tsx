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

export type FormClientHandle = { skip: () => void };

// ── Helpers ──────────────────────────────────────────────────

function darkenHex(hex: string, amount: number): string {
  const clean = hex.replace("#", "");
  const num = parseInt(clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean, 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `rgb(${r},${g},${b})`;
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ── Left panel illustration ───────────────────────────────────

function BrandIllustration() {
  return (
    <svg width="220" height="200" viewBox="0 0 220 200" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Main speech bubble */}
      <rect x="18" y="16" width="152" height="104" rx="22" fill="white" fillOpacity="0.13" />
      <rect x="18" y="16" width="152" height="104" rx="22" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" />
      {/* Bubble tail */}
      <path d="M55 120 L38 152 L82 120" fill="white" fillOpacity="0.13" />
      <path d="M55 120 L38 152 L82 120" stroke="white" strokeWidth="1.5" strokeOpacity="0.35" strokeLinejoin="round" />

      {/* 5 stars inside bubble */}
      {[0, 1, 2, 3, 4].map((i) => {
        const cx = 44 + i * 27;
        const cy = 68;
        const s = 9;
        return (
          <path
            key={i}
            d={`M${cx} ${cy - s} L${cx + s * 0.37} ${cy - s * 0.29} L${cx + s * 0.95} ${cy - s * 0.31} L${cx + s * 0.59} ${cy + s * 0.19} L${cx + s * 0.76} ${cy + s * 0.81} L${cx} ${cy + s * 0.47} L${cx - s * 0.76} ${cy + s * 0.81} L${cx - s * 0.59} ${cy + s * 0.19} L${cx - s * 0.95} ${cy - s * 0.31} L${cx - s * 0.37} ${cy - s * 0.29} Z`}
            fill="white"
            fillOpacity={0.55 + i * 0.08}
          />
        );
      })}

      {/* Text lines (abstract) */}
      <rect x="38" y="92" width="72" height="5" rx="2.5" fill="white" fillOpacity="0.25" />
      <rect x="38" y="102" width="50" height="5" rx="2.5" fill="white" fillOpacity="0.18" />

      {/* Floating decorative elements */}
      {/* Top-right sparkle */}
      <path d="M192 24 L194 18 L196 24 L202 26 L196 28 L194 34 L192 28 L186 26 Z" fill="white" fillOpacity="0.45" />
      {/* Small dot cluster */}
      <circle cx="196" cy="80" r="3.5" fill="white" fillOpacity="0.3" />
      <circle cx="206" cy="72" r="2" fill="white" fillOpacity="0.2" />
      <circle cx="202" cy="90" r="1.5" fill="white" fillOpacity="0.2" />
      {/* Bottom-left sparkle */}
      <path d="M14 168 L16 162 L18 168 L24 170 L18 172 L16 178 L14 172 L8 170 Z" fill="white" fillOpacity="0.35" />
      {/* Small circles */}
      <circle cx="180" cy="140" r="4" fill="white" fillOpacity="0.2" />
      <circle cx="195" cy="155" r="2.5" fill="white" fillOpacity="0.15" />
      <circle cx="26" cy="140" r="2" fill="white" fillOpacity="0.2" />
    </svg>
  );
}

const inputClass =
  "w-full rounded-xl border border-black/[0.08] bg-gray-50/80 px-4 py-3.5 text-[15px] text-gray-900 placeholder-gray-400 transition-all duration-150 focus:outline-none focus:bg-white focus:border-transparent focus:ring-[3px]";

// ── Main component ────────────────────────────────────────────

export const FormClient = forwardRef<FormClientHandle, { form: FormRow; demo?: boolean; onDemoClose?: () => void }>(
  function FormClient({ form, demo, onDemoClose }, ref) {
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

    useEffect(() => {
      return () => {
        if (formData.avatarPreview) URL.revokeObjectURL(formData.avatarPreview);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const brandColor = form.brand_color || DEFAULT_BRAND_COLOR;
    const brandDark = darkenHex(brandColor, 50);
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
        case "rating": return formData.rating >= 1 && formData.rating <= 5;
        case "before_story": return formData.before_story.trim().length > 0;
        case "content": return formData.content.trim().length > 0;
        case "name": return formData.name.trim().length > 0;
        case "title": return formData.title.trim().length > 0;
        case "permission": return formData.permission;
        case "avatar": return formData.avatar !== null;
        default: {
          const v = formData.customFields[q.id];
          if (q.type === "star_rating") return typeof v === "number" && v > 0;
          if (q.type === "checkbox") return v === true;
          if (q.type === "select") return typeof v === "string" && v.length > 0;
          return typeof v === "string" && v.trim().length > 0;
        }
      }
    };

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) { setError("画像ファイルを選択してください"); return; }
      if (file.size > IMAGE_MAX_SIZE_BYTES) { setError("ファイルサイズが大きすぎます（10MB以下にしてください）"); return; }
      setError(null);
      try {
        const resized = await resizeImage(file, IMAGE_RESIZE_MAX_PX);
        if (resized.size > IMAGE_RESIZED_MAX_BYTES) { setError("画像の圧縮後もサイズが大きすぎます。別の画像をお試しください。"); return; }
        const resizedFile = new File([resized], file.name, { type: "image/jpeg" });
        const previewUrl = URL.createObjectURL(resized);
        setFormData((prev) => {
          if (prev.avatarPreview) URL.revokeObjectURL(prev.avatarPreview);
          return { ...prev, avatar: resizedFile, avatarPreview: previewUrl };
        });
      } catch { setError("画像の処理に失敗しました"); }
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
          const { error: uploadError } = await supabase.storage.from("avatars").upload(path, formData.avatar, { contentType: "image/jpeg", upsert: false });
          if (uploadError) throw new Error("写真のアップロードに失敗しました");
          const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
          avatarUrl = publicUrlData.publicUrl;
        }
        const customFields: Record<string, string | boolean | number> = {};
        for (const [key, value] of Object.entries(formData.customFields)) {
          if (value !== "" && value !== false && value !== 0) customFields[key] = value;
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
        if (uploadedPath) supabase.storage.from("avatars").remove([uploadedPath]).catch(() => {});
        setError(err instanceof Error ? err.message : "送信に失敗しました。もう一度お試しください。");
      } finally {
        setSubmitting(false);
      }
    };

    const handleNext = () => {
      if (step < totalSteps - 1) { setStep(step + 1); setError(null); }
      else handleSubmit();
    };

    useImperativeHandle(ref, () => ({
      skip: () => {
        if (step < totalSteps - 1) { setStep(step + 1); setError(null); }
      },
    }), [step, totalSteps]);

    const handleBack = () => {
      if (step > 0) { setStep(step - 1); setError(null); }
    };

    // ── Render question inputs ──────────────────────────────
    const renderQuestion = (question: FormQuestion) => {
      const isKnown = KNOWN_IDS.includes(question.id);
      const ringStyle = { "--tw-ring-color": `${brandColor}38` } as React.CSSProperties;

      switch (question.type) {
        case "star_rating":
          return isKnown
            ? <StarRatingInput value={formData.rating} onChange={(v) => updateField("rating", v)} brandColor={brandColor} />
            : <StarRatingInput value={(formData.customFields[question.id] as number) || 0} onChange={(v) => updateCustomField(question.id, v)} brandColor={brandColor} />;

        case "textarea": {
          if (isKnown) {
            const fieldKey = question.id as "before_story" | "content";
            const value = formData[fieldKey];
            return (
              <div className="space-y-1.5">
                <textarea className={`${inputClass} resize-none min-h-[140px]`} style={ringStyle} placeholder={question.placeholder} value={value} onChange={(e) => updateField(fieldKey, e.target.value)} maxLength={TEXTAREA_MAX} />
                <p className="text-right text-[11px] text-gray-400">{value.length} / {TEXTAREA_MAX}</p>
              </div>
            );
          }
          const cv = (formData.customFields[question.id] as string) || "";
          return (
            <div className="space-y-1.5">
              <textarea className={`${inputClass} resize-none min-h-[140px]`} style={ringStyle} placeholder={question.placeholder} value={cv} onChange={(e) => updateCustomField(question.id, e.target.value)} maxLength={TEXTAREA_MAX} />
              <p className="text-right text-[11px] text-gray-400">{cv.length} / {TEXTAREA_MAX}</p>
            </div>
          );
        }

        case "text": {
          if (isKnown) {
            const textKey = question.id as "name" | "title";
            return <input type="text" className={inputClass} style={ringStyle} placeholder={question.placeholder} value={formData[textKey]} onChange={(e) => updateField(textKey, e.target.value)} maxLength={100} />;
          }
          return <input type="text" className={inputClass} style={ringStyle} placeholder={question.placeholder} value={(formData.customFields[question.id] as string) || ""} onChange={(e) => updateCustomField(question.id, e.target.value)} maxLength={100} />;
        }

        case "select":
          return (
            <div className="relative">
              <select className={`${inputClass} appearance-none pr-10 cursor-pointer`} style={ringStyle} value={(formData.customFields[question.id] as string) || ""} onChange={(e) => updateCustomField(question.id, e.target.value)}>
                <option value="">選択してください</option>
                {(question.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </div>
          );

        case "image":
          return (
            <div className="space-y-4">
              {formData.avatarPreview && (
                <div className="flex justify-center">
                  <div className="relative">
                    <img src={formData.avatarPreview} alt="プレビュー" className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-md" />
                    <button type="button" className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
                      onClick={() => { setFormData((prev) => { if (prev.avatarPreview) URL.revokeObjectURL(prev.avatarPreview); return { ...prev, avatar: null, avatarPreview: null }; }); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              <button type="button" className="w-full rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-sm text-gray-400 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-600 transition-all duration-150 focus:outline-none" onClick={() => fileInputRef.current?.click()}>
                <span className="flex flex-col items-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {formData.avatarPreview ? "別の写真を選択" : "クリックして写真をアップロード"}
                </span>
              </button>
            </div>
          );

        case "checkbox": {
          const isPermission = isKnown;
          const checked = isPermission ? formData.permission : ((formData.customFields[question.id] as boolean) || false);
          const label = isPermission ? "はい、掲載を許可します" : question.label;
          const onChange = isPermission
            ? (e: React.ChangeEvent<HTMLInputElement>) => updateField("permission", e.target.checked)
            : (e: React.ChangeEvent<HTMLInputElement>) => updateCustomField(question.id, e.target.checked);
          return (
            <label className="flex items-start gap-3.5 cursor-pointer select-none group">
              <div className="relative mt-0.5 w-5 h-5 rounded-[5px] border-2 shrink-0 transition-all duration-150"
                style={{ backgroundColor: checked ? brandColor : "transparent", borderColor: checked ? brandColor : "#D1D5DB", boxShadow: checked ? `0 0 0 3px ${brandColor}22` : "none" }}>
                <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
                {checked && (
                  <svg className="absolute inset-0 w-full h-full text-white p-[3px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-[15px] text-gray-700 leading-relaxed">{label}</span>
            </label>
          );
        }

        default: return null;
      }
    };

    // ── Success screen ────────────────────────────────────────
    if (submitted) {
      return (
        <div className="min-h-dvh flex items-stretch sm:items-center justify-center sm:p-6 lg:p-10" style={{ background: "#F0F0F5" }}>
          <div
            className="w-full sm:max-w-[860px] bg-white sm:rounded-3xl overflow-hidden flex flex-col sm:flex-row"
            style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.05), 0 8px 24px -4px rgba(0,0,0,0.1), 0 32px 64px -16px rgba(0,0,0,0.12)" }}
          >
            {/* Left panel */}
            <div
              className="relative overflow-hidden sm:w-[320px] sm:flex-shrink-0 px-8 py-8 sm:px-10 sm:py-10 flex items-center justify-center"
              style={{ background: `linear-gradient(145deg, ${brandColor} 0%, ${brandDark} 100%)` }}
            >
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white opacity-[0.06]" />
              <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-white opacity-[0.06]" />
              <div className="relative z-10 text-center">
                <BrandIllustration />
              </div>
            </div>

            {/* Right: success message */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 py-14 sm:px-12 text-center animate-success-card">
              <div
                className="mb-6 w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${brandColor}15` }}
              >
                <svg width="30" height="30" viewBox="0 0 36 36" fill="none" style={{ color: brandColor }}>
                  <circle cx="18" cy="18" r="17" stroke="currentColor" strokeWidth="2" opacity="0.2" />
                  <path d="M10 18l6 6 10-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    strokeDasharray="60" style={{ animation: "success-check 0.6s 0.2s cubic-bezier(0.22,1,0.36,1) forwards", strokeDashoffset: 60 }} />
                </svg>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-3">ありがとうございます！</h2>
              <p className="text-[15px] text-gray-500 leading-relaxed max-w-sm">
                {form.thank_you_message || "お声をお寄せいただき、誠にありがとうございます。いただいた内容は大切に活用させていただきます。"}
              </p>
              {demo && (
                <Link href="/" className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-[15px] font-semibold transition-all hover:-translate-y-px"
                  style={{ backgroundColor: brandColor, boxShadow: `0 4px 12px ${brandColor}45` }}>
                  VoiceHubのトップに戻る
                </Link>
              )}
            </div>
          </div>
        </div>
      );
    }

    // ── Main form ─────────────────────────────────────────────
    return (
      <div className="min-h-dvh flex items-stretch sm:items-center justify-center sm:p-6 lg:p-10" style={{ background: "#F0F0F5" }}>
        {/* Card */}
        <div
          className="w-full sm:max-w-[860px] bg-white sm:rounded-3xl overflow-hidden flex flex-col sm:flex-row"
          style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.05), 0 8px 24px -4px rgba(0,0,0,0.1), 0 32px 64px -16px rgba(0,0,0,0.12)" }}
        >
          {/* ── Left: Brand Panel ──────────────────────────── */}
          <div
            className="relative overflow-hidden sm:w-[320px] sm:flex-shrink-0 flex flex-col"
            style={{ background: `linear-gradient(145deg, ${brandColor} 0%, ${brandDark} 100%)` }}
          >
            {/* Decorative blobs */}
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white opacity-[0.07]" />
            <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full bg-white opacity-[0.06]" />
            <div className="absolute top-1/2 -translate-y-1/2 right-0 w-28 h-28 rounded-full bg-white opacity-[0.04]" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full p-7 sm:p-10">

              {/* Mobile: horizontal logo + title + skip */}
              <div className="flex items-center gap-3 sm:block">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="" className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl object-contain shrink-0 sm:mb-5" style={{ background: "rgba(255,255,255,0.18)" }} />
                ) : (
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl shrink-0 sm:mb-5" style={{ background: "rgba(255,255,255,0.18)" }} />
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-base sm:text-lg font-bold text-white leading-snug truncate sm:mt-0">
                    {form.title}
                  </h1>
                  {form.description && (
                    <p className="mt-1 text-xs sm:hidden text-white/60 line-clamp-1">{form.description}</p>
                  )}
                </div>
                {demo && (
                  <button type="button" onClick={() => { if (step < totalSteps - 1) { setStep(step + 1); setError(null); } else { onDemoClose?.(); } }}
                    className="sm:hidden ml-auto shrink-0 text-xs text-white/50 hover:text-white/80 transition-colors">
                    スキップ →
                  </button>
                )}
              </div>

              {/* Desktop: description + illustration */}
              <div className="hidden sm:flex flex-col flex-1">
                {form.description && (
                  <p className="mt-4 text-sm text-white/65 leading-relaxed">{form.description}</p>
                )}

                {/* Illustration centered in remaining space */}
                <div className="flex-1 flex items-center justify-center py-8">
                  <BrandIllustration />
                </div>

                {/* Progress indicator (desktop only, in left panel) */}
                <div className="space-y-3">
                  <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-white/45">
                    進捗 {step + 1} / {totalSteps}
                  </p>
                  <div className="flex gap-1.5">
                    {questions.map((_, i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-500"
                        style={{ backgroundColor: i <= step ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.2)" }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Desktop skip + powered by */}
              <div className="hidden sm:flex items-center justify-between mt-6">
                {demo ? (
                  <button type="button" onClick={() => { if (step < totalSteps - 1) { setStep(step + 1); setError(null); } else { onDemoClose?.(); } }}
                    className="text-xs text-white/45 hover:text-white/70 transition-colors">
                    スキップ →
                  </button>
                ) : <span />}
                <a href="https://voicehub.jp" target="_blank" rel="noopener noreferrer" className="text-[11px] text-white/30 hover:text-white/60 transition-colors">
                  Powered by VoiceHub
                </a>
              </div>
            </div>
          </div>

          {/* ── Right: Form Panel ──────────────────────────── */}
          <div className="flex-1 flex flex-col bg-white px-7 py-7 sm:px-10 sm:py-10 overflow-y-auto">

            {/* Mobile progress bar */}
            <div className="sm:hidden mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-gray-400">{step + 1} / {totalSteps}</p>
                <a href="https://voicehub.jp" target="_blank" rel="noopener noreferrer" className="text-[11px] text-gray-300 hover:text-gray-500 transition-colors">
                  Powered by VoiceHub
                </a>
              </div>
              <div className="h-0.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%`, backgroundColor: brandColor }} />
              </div>
            </div>

            {/* Honeypot */}
            <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }}>
              <label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label>
            </div>

            {/* Animated question content */}
            <div key={step} className="animate-step-in flex-1 flex flex-col justify-center space-y-6 sm:space-y-7">

              {/* Step badge (desktop) */}
              <div className="hidden sm:flex items-center gap-2">
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide"
                  style={{ backgroundColor: `${brandColor}14`, color: brandColor }}
                >
                  STEP {step + 1}
                </span>
                {currentQuestion.required && (
                  <span className="text-[11px] text-gray-400">必須</span>
                )}
              </div>

              {/* Question heading */}
              <div>
                <h2 className="form-question text-gray-900">
                  {currentQuestion.label}
                  {currentQuestion.required && (
                    <span className="sm:hidden text-red-400 text-sm font-normal ml-2 tracking-normal">必須</span>
                  )}
                </h2>
              </div>

              {/* Input */}
              <div>{renderQuestion(currentQuestion)}</div>
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-5 flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3.5 text-sm text-red-700"
                style={{ borderLeft: "3px solid #EF4444", animation: "form-step-in 0.2s ease forwards" }}>
                <svg className="shrink-0 mt-0.5 w-4 h-4 text-red-500" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 10.5a.75.75 0 110-1.5.75.75 0 010 1.5zm.75-4.75a.75.75 0 01-1.5 0V5.25a.75.75 0 011.5 0v1.5z" />
                </svg>
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex gap-3">
              {step > 0 && (
                <button type="button" onClick={handleBack}
                  className="flex-1 h-[52px] rounded-xl px-6 text-gray-600 text-[15px] font-medium bg-gray-100 hover:bg-gray-200 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-300">
                  ← 戻る
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                disabled={(!demo && currentQuestion.required && !isCurrentStepValid()) || submitting}
                className="flex-1 h-[52px] rounded-xl px-6 text-white text-[15px] font-semibold transition-all duration-150 focus:outline-none focus:ring-[3px] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: brandColor,
                  boxShadow: `0 1px 3px rgba(0,0,0,0.12), 0 4px 14px ${brandColor}40`,
                  "--tw-ring-color": `${brandColor}38`,
                } as React.CSSProperties}
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2"><SpinnerIcon /> 送信中...</span>
                ) : step === totalSteps - 1 ? "送信する" : "次へ →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
