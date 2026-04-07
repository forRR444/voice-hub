"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { TestimonialWithTags } from "@/types/database";
import Modal from "@/app/components/modal";
import CustomSelect from "@/app/components/custom-select";
import Button from "@/app/components/ui/button";
import FormField, { inputClass } from "@/app/components/ui/form-field";

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
        <FormField label="お名前" required>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
            placeholder="山田 太郎"
          />
        </FormField>

        <FormField label="評価">
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
                  fill={n <= form.rating ? "currentColor" : "none"}
                  className={n <= form.rating ? "text-amber-400" : "text-foreground/20"}
                />
              </button>
            ))}
          </div>
        </FormField>

        <FormField label="内容" required>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={4}
            className={inputClass}
            placeholder="お客様の声の内容を入力してください"
          />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="肩書き">
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
              placeholder="CEO"
            />
          </FormField>
          <FormField label="会社名">
            <input
              type="text"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className={inputClass}
              placeholder="株式会社〇〇"
            />
          </FormField>
        </div>

        <FormField label="ステータス">
          <CustomSelect
            value={form.status}
            onChange={(v) => setForm({ ...form, status: v as "pending" | "approved" | "rejected" })}
            options={[
              { value: "approved", label: "承認済み" },
              { value: "pending", label: "未承認" },
              { value: "rejected", label: "非承認" },
            ]}
          />
        </FormField>

        <div className="flex justify-end gap-3 mt-2">
          <Button variant="secondary" type="button" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "追加中..." : "追加する"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
