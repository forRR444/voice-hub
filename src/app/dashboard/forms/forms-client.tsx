"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Copy,
  Pencil,
  Check,
  X,
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
        <div className="mb-6 p-4 bg-foreground/5 border border-foreground/10 rounded-lg text-sm text-foreground/60">
          ベータ版ではフォームは1つのみ登録できます。
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
                  {/* Question Editor - Toggle Style */}
                  <div className="border-t border-foreground/10 pt-4">
                    <h4 className="text-sm font-semibold text-foreground mb-1">
                      フォームに含める質問
                    </h4>
                    <p className="text-xs text-foreground/40 mb-4">
                      必要な質問をON/OFFで選べます。必須の質問は外せません。
                    </p>
                    <div className="flex flex-col gap-2">
                      {(() => {
                        const AVAILABLE_QUESTIONS: { id: string; label: string; type: FormQuestion["type"]; required?: boolean; placeholder?: string; alwaysOn?: boolean }[] = [
                          { id: "rating", label: "総合評価（星）", type: "star_rating", required: true },
                          { id: "before_story", label: "利用前の悩み（Before）", type: "textarea", required: true, placeholder: "例：集客がうまくいかず、毎月の売上が安定しませんでした..." },
                          { id: "content", label: "感想・レビュー", type: "textarea", required: true },
                          { id: "name", label: "お名前", type: "text", required: true, placeholder: "山田 太郎" },
                          { id: "title", label: "職業・肩書き", type: "text", required: false, placeholder: "例：ライフコーチ" },
                          { id: "avatar", label: "写真", type: "image", required: false },
                          { id: "permission", label: "掲載許可", type: "checkbox", required: true, alwaysOn: true },
                        ];

                        return AVAILABLE_QUESTIONS.map((aq) => {
                          const isOn = editQuestions.some((q) => q.id === aq.id);
                          const isAlwaysOn = aq.alwaysOn === true;

                          function toggle() {
                            if (isAlwaysOn) return;
                            if (isOn) {
                              setEditQuestions((prev) => prev.filter((q) => q.id !== aq.id));
                            } else {
                              const newQ: FormQuestion = {
                                id: aq.id,
                                label: aq.label.replace(/（.*）/, ""),
                                type: aq.type,
                                required: aq.required ?? false,
                                ...(aq.placeholder ? { placeholder: aq.placeholder } : {}),
                              };
                              // Insert in correct order
                              const ORDER = ["rating", "before_story", "content", "name", "title", "avatar", "permission"];
                              setEditQuestions((prev) => {
                                const next = [...prev, newQ];
                                next.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));
                                return next;
                              });
                            }
                          }

                          return (
                            <div
                              key={aq.id}
                              onClick={() => toggle()}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                                isOn
                                  ? "border-indigo-200 bg-indigo-50/50"
                                  : "border-foreground/10 bg-white"
                              } ${isAlwaysOn ? "opacity-80" : "cursor-pointer hover:border-foreground/20"}`}
                            >
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                                isOn ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
                              } ${isAlwaysOn ? "opacity-50" : ""}`}>
                                {isOn && (
                                  <Check size={14} className="text-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-foreground">{aq.label}</span>
                                {isAlwaysOn && <span className="ml-1 text-red-500">*</span>}
                              </div>
                            </div>
                          );
                        });
                      })()}
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
