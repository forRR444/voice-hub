"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Trash2,
  Bookmark,
  Tag,
  X,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TestimonialWithTags } from "@/types/database";
import { formatDate } from "@/lib/utils";

export default function TestimonialDetailClient({
  testimonial: initial,
}: {
  testimonial: TestimonialWithTags;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [testimonial, setTestimonial] = useState(initial);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function updateStatus(status: "pending" | "approved" | "rejected") {
    setErrorMsg(null);
    const { error } = await supabase
      .from("testimonials")
      .update({ status })
      .eq("id", testimonial.id);
    if (error) { setErrorMsg("ステータスの更新に失敗しました"); return; }
    setTestimonial((prev) => ({ ...prev, status }));
  }

  async function toggleFeatured() {
    setErrorMsg(null);
    const val = !testimonial.is_featured;
    const { error } = await supabase
      .from("testimonials")
      .update({ is_featured: val })
      .eq("id", testimonial.id);
    if (error) { setErrorMsg("おすすめ設定の更新に失敗しました"); return; }
    setTestimonial((prev) => ({ ...prev, is_featured: val }));
  }

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

      <div className="bg-background rounded-xl border border-foreground/10 p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {t.avatar_url ? (
              <img
                src={t.avatar_url}
                alt={t.name}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                {t.name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-foreground">{t.name}</h2>
              {(t.title || t.company) && (
                <p className="text-sm text-foreground/50">
                  {[t.title, t.company].filter(Boolean).join(" / ")}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
            title="削除"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Rating */}
        {t.rating != null && (
          <div className="flex gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={20}
                className={
                  i < (t.rating ?? 0)
                    ? "fill-amber-400 text-amber-400"
                    : "text-foreground/20"
                }
              />
            ))}
          </div>
        )}

        {/* Before story */}
        {(() => {
          const beforeStory = (t as Record<string, unknown>)["before_story"];
          if (!beforeStory) return null;
          return (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-foreground/50 mb-1">
                ご利用前のお悩み
              </h3>
              <p className="text-foreground/70">{String(beforeStory)}</p>
            </div>
          );
        })()}

        {/* Content */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-foreground/50 mb-1">
            お客様の声
          </h3>
          <p className="text-foreground/70 whitespace-pre-wrap">{t.content}</p>
        </div>

        {/* Meta */}
        <div className="text-xs text-foreground/30 mb-6">
          投稿日: {formatDate(t.submitted_at)} | ソース: {t.source}
        </div>

        {/* Status */}
        <div className="border-t border-foreground/10 pt-6 mb-6">
          <h3 className="text-sm font-medium text-foreground/70 mb-3">
            ステータス
          </h3>
          <div className="flex gap-2">
            {(
              [
                { key: "pending", label: "未承認" },
                { key: "approved", label: "承認済み" },
                { key: "rejected", label: "非承認" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => updateStatus(key)}
                className={`px-4 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${
                  t.status === key
                    ? key === "approved"
                      ? "bg-green-100 border-green-300 text-green-800"
                      : key === "rejected"
                        ? "bg-red-100 border-red-300 text-red-800"
                        : "bg-yellow-100 border-yellow-300 text-yellow-800"
                    : "border-foreground/10 text-foreground/60 hover:bg-foreground/5"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Featured */}
        <div className="border-t border-foreground/10 pt-6 mb-6">
          <button
            onClick={toggleFeatured}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors cursor-pointer ${
              t.is_featured
                ? "bg-amber-50 border-amber-300 text-amber-700"
                : "border-foreground/10 text-foreground/60 hover:bg-foreground/5"
            }`}
          >
            <Bookmark size={16} />
            {t.is_featured ? "注目から解除" : "注目に設定"}
          </button>
        </div>

        {/* Tags */}
        <div className="border-t border-foreground/10 pt-6">
          <h3 className="text-sm font-medium text-foreground/70 mb-3 flex items-center gap-2">
            <Tag size={16} />
            タグ
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {t.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-3 py-1 bg-foreground/5 text-foreground/70 text-sm rounded-full"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="text-foreground/40 hover:text-foreground/60 cursor-pointer"
                >
                  <X size={14} />
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
              className="px-3 py-2 text-sm border border-foreground/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={addTag}
              className="flex items-center gap-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
            >
              <Plus size={14} />
              追加
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-foreground mb-2">
              削除の確認
            </h3>
            <p className="text-sm text-foreground/60 mb-6">
              このお客様の声を削除しますか？この操作は取り消せません。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-foreground/70 border border-foreground/10 rounded-lg hover:bg-foreground/5 cursor-pointer"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {deleting ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
