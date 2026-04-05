"use client";

import { useState, useRef } from "react";
import {
  Plus,
  Copy,
  Pencil,
  Check,
  X,
  Trash,
  QrCode,
  Download,
} from "lucide-react";
import { useCopy } from "@/hooks/use-copy";
import QRCode from "react-qr-code";
import { createClient } from "@/lib/supabase/client";
import { WorkspaceRow, FormRow, FormQuestion, PLAN_LIMITS } from "@/types/database";
import { generateSlug, getBaseUrl, formatDate } from "@/lib/utils";
import { FORM_TEMPLATES } from "@/lib/default-questions";
import { DEFAULT_BRAND_COLOR } from "@/lib/constants";
import QuestionEditor from "@/app/components/question-editor";

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
    brand_color: DEFAULT_BRAND_COLOR,
    thank_you_message: "",
  });
  const { copiedKey: copiedId, copy } = useCopy();
  const [editQuestions, setEditQuestions] = useState<FormQuestion[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("coaching");
  const [qrForm, setQrForm] = useState<{ slug: string; title: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

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
        brand_color: DEFAULT_BRAND_COLOR,
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
    copy(`${getBaseUrl()}/form/${slug}`, id);
  }

  function downloadQr() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const size = 400;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const a = document.createElement("a");
      a.download = `qrcode-${qrForm?.slug ?? "form"}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">フォーム管理</h2>
        <button
          onClick={() => {
            setSelectedTemplate("coaching");
            setShowCreateModal(true);
          }}
          disabled={!canCreate || creating}
          className="flex items-center justify-center gap-2 p-2 sm:px-4 sm:py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
        >
          <Plus size={16} />
          <span className="sm:hidden">{creating ? "..." : "追加"}</span>
          <span className="hidden sm:inline">{creating ? "作成中..." : "新しいフォーム"}</span>
        </button>
      </div>

      {/* Template picker modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full max-w-lg sm:mx-4 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
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
              className="bg-white rounded-lg border border-foreground/10 shadow-sm p-4 sm:p-6"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      ドラッグで順番を変更できます。
                    </p>
                    <QuestionEditor
                      questions={editQuestions}
                      onChange={setEditQuestions}
                    />
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
                        onClick={() => {
                          setDeleteFormId(form.id);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-2 text-foreground/40 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="削除"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-3 sm:mt-4 text-xs sm:text-sm text-foreground/50">
                    <span>回答数: {submissionCounts[form.id] ?? 0}件</span>
                    <span>作成日: {formatDate(form.created_at)}</span>
                    <div
                      className="w-4 h-4 rounded-full border border-foreground/10"
                      style={{ backgroundColor: form.brand_color }}
                      title={form.brand_color}
                    />
                  </div>
                  <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
                    <button
                      onClick={() => startEdit(form)}
                      className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm border border-foreground/10 rounded-lg bg-white hover:bg-foreground/5 cursor-pointer"
                    >
                      質問内容を確認
                    </button>
                    <button
                      onClick={() => copyUrl(form.slug, form.id)}
                      className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm border border-foreground/10 rounded-lg bg-white hover:bg-foreground/5 cursor-pointer"
                    >
                      <Copy size={14} />
                      {copiedId === form.id
                        ? "コピーしました"
                        : "URLをコピー"}
                    </button>
                    <button
                      onClick={() => setQrForm({ slug: form.slug, title: form.title })}
                      className="flex items-center gap-2 px-3 py-2 text-xs sm:text-sm border border-foreground/10 rounded-lg bg-white hover:bg-foreground/5 cursor-pointer"
                    >
                      <QrCode size={14} />
                      QRコード
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && deleteFormId && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full max-w-sm sm:mx-4 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
              フォームの削除
            </h3>
            <p className="text-sm text-foreground/60 mb-4">
              このフォームを削除しますか？関連する回答は残ります。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteFormId(null);
                }}
                className="flex-1 px-4 py-2 text-sm border border-foreground/10 rounded-lg hover:bg-foreground/5 cursor-pointer"
              >
                キャンセル
              </button>
              <button
                onClick={async () => {
                  setDeleting(true);
                  const { error } = await supabase.from("forms").delete().eq("id", deleteFormId);
                  setDeleting(false);
                  if (error) {
                    alert("削除に失敗しました");
                    return;
                  }
                  setForms((prev) => prev.filter((f) => f.id !== deleteFormId));
                  setShowDeleteConfirm(false);
                  setDeleteFormId(null);
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-sm text-red-500 border border-foreground/10 rounded-lg hover:bg-foreground/5 disabled:opacity-30 cursor-pointer"
              >
                {deleting ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Code modal */}
      {qrForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full max-w-sm sm:mx-4 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">QRコード</h3>
              <button
                onClick={() => setQrForm(null)}
                className="p-1 text-foreground/40 hover:text-foreground/60 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-foreground/50 mb-4 truncate">{qrForm.title}</p>
            <div ref={qrRef} className="flex justify-center p-4 bg-white border border-foreground/10 rounded-lg">
              <QRCode
                value={`${getBaseUrl()}/form/${qrForm.slug}`}
                size={200}
              />
            </div>
            <p className="text-xs text-foreground/40 text-center mt-3 break-all">
              {getBaseUrl()}/form/{qrForm.slug}
            </p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={downloadQr}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
              >
                <Download size={14} />
                PNG保存
              </button>
              <button
                onClick={() => setQrForm(null)}
                className="px-4 py-2 text-sm border border-foreground/10 rounded-lg hover:bg-foreground/5 cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

