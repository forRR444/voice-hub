"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TestimonialWithTags } from "@/types/database";
import Modal from "@/app/components/modal";

export default function AddTestimonialModal({
  workspaceId,
  onClose,
  onAdded,
}: {
  workspaceId: string;
  onClose: () => void;
  onAdded: (t: TestimonialWithTags) => void;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    content: "",
    rating: 5,
    title: "",
    company: "",
    status: "approved" as "pending" | "approved" | "rejected",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.content.trim()) {
      setError("名前と内容は必須です");
      return;
    }
    setLoading(true);
    setError("");

    const { data, error: insertError } = await supabase
      .from("testimonials")
      .insert({
        workspace_id: workspaceId,
        name: form.name,
        content: form.content,
        rating: form.rating,
        title: form.title || null,
        company: form.company || null,
        status: form.status,
        source: "manual",
        is_featured: false,
        permission_granted: true,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    if (data) {
      onAdded({ ...data, tags: [] });
    }
  }

  return (
    <Modal title="お客様の声を手動で追加" onClose={onClose} rounded="rounded-lg">
      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">
            お名前 *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="山田 太郎"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">
            評価
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setForm({ ...form, rating: n })}
                className="cursor-pointer"
              >
                <Star
                  size={24}
                  className={
                    n <= form.rating
                      ? "fill-amber-400 text-amber-400"
                      : "text-foreground/20"
                  }
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">
            内容 *
          </label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="お客様の声の内容を入力してください"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">
              肩書き
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="CEO"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">
              会社名
            </label>
            <input
              type="text"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="株式会社〇〇"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">
            ステータス
          </label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value as "pending" | "approved" | "rejected",
              })
            }
            className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="approved">承認済み</option>
            <option value="pending">未承認</option>
            <option value="rejected">非承認</option>
          </select>
        </div>

        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-foreground/70 border border-foreground/10 rounded-lg hover:bg-foreground/5 cursor-pointer"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "追加中..." : "追加する"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
