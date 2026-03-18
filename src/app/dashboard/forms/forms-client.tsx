"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Copy,
  Pencil,
  Check,
  X,
  ChevronUp,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WorkspaceRow, FormRow, FormQuestion, PLAN_LIMITS } from "@/types/database";
import { generateSlug, getBaseUrl, formatDate } from "@/lib/utils";
import { CORE_QUESTION_IDS, FORM_TEMPLATES } from "@/lib/default-questions";

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
    brand_color: "#635BFF",
    thank_you_message: "",
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editQuestions, setEditQuestions] = useState<FormQuestion[]>([]);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("coaching");

  const plan = subscriptionStatus === "pro" ? "pro" : "free";
  const limit = PLAN_LIMITS[plan].forms;
  const canCreate = forms.length < limit;

  async function createForm() {
    if (!canCreate) return;
    setCreating(true);

    const template = FORM_TEMPLATES.find(t => t.id === selectedTemplate) || FORM_TEMPLATES[0];
    const slug = generateSlug();
    const { data, error } = await supabase
      .from("forms")
      .insert({
        workspace_id: workspace.id,
        slug,
        title: "お客様の声フォーム",
        description: "ぜひご感想をお聞かせください",
        questions: template.questions,
        brand_color: "#635BFF",
        thank_you_message: "ご回答いただきありがとうございます！",
      })
      .select()
      .single();

    setCreating(false);
    setShowCreateModal(false);
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
    setEditQuestions(form.questions.map((q) => ({ ...q })));
    setShowTypePicker(false);
  }

  async function saveEdit(id: string) {
    const { error } = await supabase
      .from("forms")
      .update({
        title: editForm.title,
        description: editForm.description || null,
        brand_color: editForm.brand_color,
        thank_you_message: editForm.thank_you_message,
        questions: editQuestions,
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
                questions: editQuestions,
              }
            : f
        )
      );
      setEditingId(null);
    }
  }

  const QUESTION_TYPE_LABELS: Record<FormQuestion["type"], string> = {
    star_rating: "星評価",
    text: "テキスト",
    textarea: "テキストエリア",
    checkbox: "チェックボックス",
    image: "画像",
  };

  function updateQuestion(index: number, updates: Partial<FormQuestion>) {
    setEditQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...updates } : q))
    );
  }

  function moveQuestion(index: number, direction: "up" | "down") {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= editQuestions.length) return;
    setEditQuestions((prev) => {
      const next = [...prev];
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  }

  function deleteQuestion(index: number) {
    setEditQuestions((prev) => prev.filter((_, i) => i !== index));
  }

  function addQuestion(type: FormQuestion["type"]) {
    const newQuestion: FormQuestion = {
      id: crypto.randomUUID(),
      label: "",
      type,
      required: false,
    };
    setEditQuestions((prev) => [...prev, newQuestion]);
    setShowTypePicker(false);
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
          onClick={() => {
            setSelectedTemplate("coaching");
            setShowCreateModal(true);
          }}
          disabled={!canCreate || creating}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
        >
          <Plus size={16} />
          {creating ? "作成中..." : "新しいフォーム"}
        </button>
      </div>

      {/* Template picker modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              テンプレートを選択
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {FORM_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`text-left p-4 rounded-lg border-2 transition-colors cursor-pointer ${
                    selectedTemplate === tpl.id
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-foreground/10 bg-white hover:border-foreground/30"
                  }`}
                >
                  <span className="block text-sm font-bold text-foreground">
                    {tpl.label}
                  </span>
                  <span className="block text-xs text-foreground/50 mt-1">
                    {tpl.description}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm text-foreground/60 border border-foreground/10 rounded-lg hover:bg-foreground/5 cursor-pointer"
              >
                キャンセル
              </button>
              <button
                onClick={createForm}
                disabled={creating}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
              >
                {creating ? "作成中..." : "作成"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  {/* Question Editor */}
                  <div className="border-t border-foreground/10 pt-4">
                    <h4 className="text-sm font-semibold text-foreground mb-3">
                      質問の編集
                    </h4>
                    <div className="flex flex-col gap-3">
                      {editQuestions.map((q, index) => {
                        const isCore = CORE_QUESTION_IDS.includes(q.id);
                        const showPlaceholder =
                          q.type === "text" || q.type === "textarea";
                        return (
                          <div
                            key={q.id}
                            className="border border-foreground/10 rounded-lg p-3"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-foreground/5 text-foreground/60">
                                {QUESTION_TYPE_LABELS[q.type]}
                              </span>
                              {isCore && (
                                <span className="text-xs text-foreground/40">
                                  コア
                                </span>
                              )}
                              <div className="ml-auto flex items-center gap-1">
                                <button
                                  onClick={() => moveQuestion(index, "up")}
                                  disabled={index === 0}
                                  className="p-1 text-foreground/40 hover:text-foreground/70 disabled:opacity-30 cursor-pointer"
                                  title="上に移動"
                                >
                                  <ChevronUp size={16} />
                                </button>
                                <button
                                  onClick={() => moveQuestion(index, "down")}
                                  disabled={
                                    index === editQuestions.length - 1
                                  }
                                  className="p-1 text-foreground/40 hover:text-foreground/70 disabled:opacity-30 cursor-pointer"
                                  title="下に移動"
                                >
                                  <ChevronDown size={16} />
                                </button>
                                <button
                                  onClick={() => deleteQuestion(index)}
                                  disabled={isCore}
                                  className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                  title={
                                    isCore
                                      ? "コア質問は削除できません"
                                      : "削除"
                                  }
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                value={q.label}
                                onChange={(e) =>
                                  updateQuestion(index, {
                                    label: e.target.value,
                                  })
                                }
                                placeholder="質問ラベル"
                                className="w-full px-3 py-1.5 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              {showPlaceholder && (
                                <input
                                  type="text"
                                  value={q.placeholder ?? ""}
                                  onChange={(e) =>
                                    updateQuestion(index, {
                                      placeholder: e.target.value || undefined,
                                    })
                                  }
                                  placeholder="プレースホルダー"
                                  className="w-full px-3 py-1.5 border border-foreground/10 rounded-lg text-sm text-foreground/60 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                              )}
                              <label className="flex items-center gap-2 text-sm text-foreground/60">
                                <input
                                  type="checkbox"
                                  checked={q.required}
                                  onChange={(e) =>
                                    updateQuestion(index, {
                                      required: e.target.checked,
                                    })
                                  }
                                  className="rounded border-foreground/20"
                                />
                                必須
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add question */}
                    <div className="mt-3 relative">
                      <button
                        onClick={() => setShowTypePicker(!showTypePicker)}
                        className="flex items-center gap-1 px-3 py-2 text-sm text-foreground/60 border border-dashed border-foreground/20 rounded-lg hover:bg-foreground/5 w-full justify-center cursor-pointer"
                      >
                        <Plus size={14} />
                        質問を追加
                      </button>
                      {showTypePicker && (
                        <div className="absolute left-0 right-0 mt-1 bg-white border border-foreground/10 rounded-lg shadow-lg z-10 py-1">
                          {(
                            [
                              ["text", "テキスト"],
                              ["textarea", "テキストエリア"],
                              ["star_rating", "星評価"],
                              ["checkbox", "チェックボックス"],
                            ] as const
                          ).map(([type, label]) => (
                            <button
                              key={type}
                              onClick={() =>
                                addQuestion(type as FormQuestion["type"])
                              }
                              className="block w-full text-left px-4 py-2 text-sm text-foreground/70 hover:bg-foreground/5 cursor-pointer"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
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
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => startEdit(form)}
                        className="p-2 text-foreground/40 hover:text-foreground/60 hover:bg-foreground/5 rounded-lg cursor-pointer"
                        title="編集"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={async () => {
                          if (!window.confirm("このフォームを削除しますか？関連する回答は残ります。")) return;
                          const { error } = await supabase.from("forms").delete().eq("id", form.id);
                          if (error) { window.alert("削除に失敗しました"); return; }
                          setForms((prev) => prev.filter((f) => f.id !== form.id));
                        }}
                        className="p-2 text-foreground/40 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="削除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 mt-4 text-sm text-foreground/50">
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
