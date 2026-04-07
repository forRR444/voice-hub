"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Trash,
  Bookmark,
  Tag,
  X,
  Plus,
  ImageIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TestimonialWithTags } from "@/types/database";
import { formatDate } from "@/lib/utils";
import { useTestimonialOperations } from "@/hooks/use-testimonial-operations";
import SnsImageModal from "../sns-image-modal";
import DeleteConfirmModal from "@/app/components/delete-confirm-modal";
import Button from "@/app/components/ui/button";
import Card from "@/app/components/ui/card";

export default function TestimonialDetailClient({
  testimonial: initial,
  brandColor,
  questionLabels = {},
}: {
  testimonial: TestimonialWithTags;
  brandColor: string;
  questionLabels?: Record<string, string>;
}) {
  const supabase = createClient();
  const router = useRouter();
  const { testimonial, setTestimonial, errorMsg, setErrorMsg, updateStatus, toggleFeatured } =
    useTestimonialOperations(initial);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [showSnsModal, setShowSnsModal] = useState(false);

  async function addTag() {
    setErrorMsg(null);
    const tag = newTag.trim();
    if (!tag || testimonial.tags.includes(tag)) return;
    const { error } = await supabase
      .from("testimonial_tags")
      .insert({ testimonial_id: testimonial.id, tag });
    if (error) { setErrorMsg("タグの追加に失敗しました"); return; }
    setTestimonial((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    setNewTag("");
  }

  async function removeTag(tag: string) {
    setErrorMsg(null);
    const { error } = await supabase
      .from("testimonial_tags")
      .delete()
      .eq("testimonial_id", testimonial.id)
      .eq("tag", tag);
    if (error) { setErrorMsg("タグの削除に失敗しました"); return; }
    setTestimonial((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  }

  async function handleDelete() {
    setDeleting(true);
    setErrorMsg(null);
    const { error } = await supabase
      .from("testimonials")
      .delete()
      .eq("id", testimonial.id);
    setDeleting(false);
    if (error) { setErrorMsg("削除に失敗しました"); return; }
    router.push("/dashboard");
  }

  const t = testimonial;

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground mb-6"
      >
        <ArrowLeft size={16} />
        お客様の声に戻る
      </Link>

      {errorMsg && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <Card padding="p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3 sm:gap-4">
            {t.avatar_url ? (
              <img
                src={t.avatar_url}
                alt={t.name}
                className="w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-foreground/5 flex items-center justify-center text-foreground/50 font-bold text-base sm:text-xl">
                {t.name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-base sm:text-xl font-bold text-foreground">{t.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                {(t.title || t.company) && (
                  <p className="text-xs sm:text-sm text-foreground/50">
                    {[t.title, t.company].filter(Boolean).join(" / ")}
                  </p>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 sm:p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
            title="削除"
          >
            <Trash size={16} className="sm:hidden" />
            <Trash size={18} className="hidden sm:block" />
          </button>
        </div>

        {/* Rating + date */}
        {t.rating != null && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  fill={i < (t.rating ?? 0) ? "currentColor" : "none"}
                  className={
                    i < (t.rating ?? 0)
                      ? "text-amber-400"
                      : "text-foreground/20"
                  }
                />
              ))}
            </div>
            <span className="text-[10px] sm:text-xs text-foreground/25">{formatDate(t.submitted_at)}</span>
          </div>
        )}

        {/* Before story */}
        {t.before_story && (
          <div className="mb-3 sm:mb-4 bg-foreground/[0.02] rounded-lg p-3 sm:p-4 border border-foreground/5">
            <h3 className="text-[10px] sm:text-xs font-medium text-foreground/40 mb-1 sm:mb-1.5">
              {questionLabels.before_story || "ご利用前のお悩み"}
            </h3>
            <p className="text-xs sm:text-sm text-foreground/60 leading-relaxed">{t.before_story}</p>
          </div>
        )}

        {/* Content */}
        <div className="mb-4 sm:mb-6">
          <h3 className="text-[10px] sm:text-xs font-medium text-foreground/40 mb-1 sm:mb-1.5">
            {questionLabels.content || "お客様の声"}
          </h3>
          <p className="text-sm sm:text-base text-foreground/70 whitespace-pre-wrap leading-relaxed">{t.content}</p>
        </div>

        {/* Status */}
        <div className="border-t border-foreground/10 pt-4 sm:pt-6 mb-4 sm:mb-6">
          <h3 className="text-xs sm:text-sm font-medium text-foreground/40 mb-2 sm:mb-3">
            ステータス
          </h3>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {(
              [
                { key: "pending", label: "未承認", dot: "bg-amber-400" },
                { key: "approved", label: "承認済み", dot: "bg-emerald-500" },
                { key: "rejected", label: "非承認", dot: "bg-red-400" },
              ] as const
            ).map(({ key, label, dot }) => (
              <button
                key={key}
                onClick={() => updateStatus(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg border transition-colors cursor-pointer ${
                  t.status === key
                    ? "border-foreground/20 bg-foreground/5 text-foreground"
                    : "border-foreground/10 text-foreground/50 hover:bg-foreground/5"
                }`}
              >
                <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${dot}`} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Featured + SNS */}
        <div className="border-t border-foreground/10 pt-4 sm:pt-6 mb-4 sm:mb-6">
          <div className="flex gap-1.5 sm:gap-2">
            <button
              onClick={toggleFeatured}
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-lg border transition-colors cursor-pointer ${
                t.is_featured
                  ? "border-violet-300 text-violet-700 bg-violet-50"
                  : "border-foreground/10 text-foreground/60 hover:bg-foreground/5"
              }`}
            >
              <Bookmark size={14} fill={t.is_featured ? "currentColor" : "none"} className={t.is_featured ? "text-violet-500" : ""} />
              {t.is_featured ? "注目から解除" : "注目に設定"}
            </button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowSnsModal(true)}
            >
              <ImageIcon size={14} />
              SNS画像
            </Button>
          </div>
        </div>

        {/* Tags */}
        <div className="border-t border-foreground/10 pt-4 sm:pt-6">
          <h3 className="text-xs sm:text-sm font-medium text-foreground/40 mb-2 sm:mb-3 flex items-center gap-1.5">
            <Tag size={14} />
            タグ
          </h3>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            {t.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 bg-foreground/5 text-foreground/70 text-xs sm:text-sm rounded-full"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="text-foreground/40 hover:text-foreground/60 cursor-pointer"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addTag())
              }
              placeholder="新しいタグ..."
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm border border-foreground/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button onClick={addTag} size="sm">
              <Plus size={12} className="sm:hidden" />
              <Plus size={14} className="hidden sm:block" />
              追加
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          title="削除の確認"
          message="このお客様の声を削除しますか？この操作は取り消せません。"
          isDeleting={deleting}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      )}

      {/* SNS Image modal */}
      {showSnsModal && (
        <SnsImageModal
          testimonial={testimonial}
          brandColor={brandColor}
          onClose={() => setShowSnsModal(false)}
        />
      )}
    </div>
  );
}
