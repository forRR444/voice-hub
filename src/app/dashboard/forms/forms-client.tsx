"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Copy,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WorkspaceRow, FormRow, PLAN_LIMITS } from "@/types/database";
import { generateSlug, getBaseUrl, formatDate } from "@/lib/utils";
import { DEFAULT_FORM_QUESTIONS } from "@/lib/default-questions";

export default function FormsClient({
  workspace,
  forms: initialForms,
  submissionCounts,
  subscriptionStatus,
}: {
  workspace: WorkspaceRow;
  forms: FormRow[];
  submissionCounts: Record<string, number>;
  subscriptionStatus: string;
}) {
  const supabase = createClient();
  const [forms, setForms] = useState<FormRow[]>(initialForms);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    brand_color: "#6366f1",
    thank_you_message: "",
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const plan = subscriptionStatus === "pro" ? "pro" : "free";
  const limit = PLAN_LIMITS[plan].forms;
  const canCreate = forms.length < limit;

  async function createForm() {
    if (!canCreate) return;
    setCreating(true);

    const slug = generateSlug();
    const { data, error } = await supabase
      .from("forms")
      .insert({
        workspace_id: workspace.id,
        slug,
        title: "お客様の声フォーム",
        description: "ぜひご感想をお聞かせください",
        questions: DEFAULT_FORM_QUESTIONS,
        brand_color: "#6366f1",
        thank_you_message: "ご回答いただきありがとうございます！",
      })
      .select()
      .single();

    setCreating(false);
    if (!error && data) {
      setForms((prev) => [data, ...prev]);
    }
  }

  function startEdit(form: FormRow) {
    setEditingId(form.id);
    setEditForm({
      title: form.title,
      description: form.description ?? "",
      brand_color: form.brand_color,
      thank_you_message: form.thank_you_message,
    });
  }

  async function saveEdit(id: string) {
    const { error } = await supabase
      .from("forms")
      .update({
        title: editForm.title,
        description: editForm.description || null,
        brand_color: editForm.brand_color,
        thank_you_message: editForm.thank_you_message,
      })
      .eq("id", id);

    if (!error) {
      setForms((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                title: editForm.title,
                description: editForm.description || null,
                brand_color: editForm.brand_color,
                thank_you_message: editForm.thank_you_message,
              }
            : f
        )
      );
      setEditingId(null);
    }
  }

  function copyUrl(slug: string, id: string) {
    const url = `${getBaseUrl()}/form/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-foreground">フォーム管理</h2>
        <button
          onClick={createForm}
          disabled={!canCreate || creating}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
        >
          <Plus size={16} />
          {creating ? "作成中..." : "新しいフォーム"}
        </button>
      </div>

      {!canCreate && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          フリープランではフォームは{limit}つまでです。
          <Link href="/dashboard/settings" className="underline ml-1">
            アップグレード
          </Link>
          して制限を解除しましょう。
        </div>
      )}

      {forms.length === 0 ? (
        <div className="text-center py-16 text-foreground/50">
          フォームがまだありません。新しいフォームを作成してください。
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-white rounded-lg border border-foreground/10 shadow-sm p-6"
            >
              {editingId === form.id ? (
                /* Edit mode */
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-1">
                      タイトル
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-1">
                      説明
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-1">
                        ブランドカラー
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={editForm.brand_color}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              brand_color: e.target.value,
                            })
                          }
                          className="w-10 h-10 rounded border border-foreground/10 cursor-pointer"
                        />
                        <span className="text-sm text-foreground/50">
                          {editForm.brand_color}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-1">
                        サンクスメッセージ
                      </label>
                      <input
                        type="text"
                        value={editForm.thank_you_message}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            thank_you_message: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 px-3 py-2 text-sm text-foreground/60 border border-foreground/10 rounded-lg hover:bg-foreground/5 cursor-pointer"
                    >
                      <X size={14} />
                      キャンセル
                    </button>
                    <button
                      onClick={() => saveEdit(form.id)}
                      className="flex items-center gap-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
                    >
                      <Check size={14} />
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {form.title}
                      </h3>
                      {form.description && (
                        <p className="text-sm text-foreground/50 mt-1">
                          {form.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => startEdit(form)}
                      className="p-2 text-foreground/40 hover:text-foreground/60 hover:bg-foreground/5 rounded-lg cursor-pointer"
                      title="編集"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-6 mt-4 text-sm text-foreground/50">
                    <span>
                      スラッグ:{" "}
                      <code className="bg-foreground/5 px-2 py-0.5 rounded">
                        {form.slug}
                      </code>
                    </span>
                    <span>回答数: {submissionCounts[form.id] ?? 0}件</span>
                    <span>作成日: {formatDate(form.created_at)}</span>
                    <div
                      className="w-4 h-4 rounded-full border border-foreground/10"
                      style={{ backgroundColor: form.brand_color }}
                      title={form.brand_color}
                    />
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => copyUrl(form.slug, form.id)}
                      className="flex items-center gap-2 px-3 py-2 text-sm border border-foreground/10 rounded-lg bg-white hover:bg-foreground/5 cursor-pointer"
                    >
                      <Copy size={14} />
                      {copiedId === form.id
                        ? "コピーしました"
                        : "フォームURLをコピー"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
