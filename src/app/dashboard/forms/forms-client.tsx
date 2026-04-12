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
import { WorkspaceRow, FormRow, FormQuestion, SubscriptionStatus } from "@/types/database";
import { getPlanLimits } from "@/lib/plan";
import { generateSlug, getBaseUrl, formatDate } from "@/lib/utils";
import { FORM_TEMPLATES } from "@/lib/default-questions";
import { DEFAULT_BRAND_COLOR } from "@/lib/constants";
import QuestionEditor from "@/app/components/question-editor";
import PageTitle from "@/app/components/page-title";
import Modal from "@/app/components/modal";
import DeleteConfirmModal from "@/app/components/delete-confirm-modal";
import Button from "@/app/components/ui/button";
import Card from "@/app/components/ui/card";
import EmptyState from "@/app/components/ui/empty-state";
import FormField, { inputClass } from "@/app/components/ui/form-field";

export default function FormsClient({
  workspace,
  forms: initialForms,
  submissionCounts,
  subscriptionStatus,
}: {
  workspace: WorkspaceRow;
  forms: FormRow[];
  submissionCounts: Record<string, number>;
  subscriptionStatus: SubscriptionStatus;
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

  const limits = getPlanLimits(subscriptionStatus);
  const canCreate = forms.length < limits.forms;

  async function createForm() {
    if (!canCreate) return;
    setCreating(true);

    const template = FORM_TEMPLATES.find(t => t.id === selectedTemplate) || FORM_TEMPLATES[0];
    const slug = generateSlug();

    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title: "お客様の声フォーム",
          description: "ぜひご感想をお聞かせください",
          questions: template.questions,
          brand_color: DEFAULT_BRAND_COLOR,
          thank_you_message: "ご回答いただきありがとうございます！",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setForms((prev) => [data, ...prev]);
      }
    } catch {
      // noop
    }

    setCreating(false);
    setShowCreateModal(false);
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
        <PageTitle>フォーム管理</PageTitle>
        <Button
          onClick={() => {
            setSelectedTemplate("coaching");
            setShowCreateModal(true);
          }}
          disabled={!canCreate || creating}
          className="p-2 sm:px-4 sm:py-2"
        >
          <Plus size={16} />
          <span className="sm:hidden">{creating ? "..." : "追加"}</span>
          <span className="hidden sm:inline">{creating ? "作成中..." : "新しいフォーム"}</span>
        </Button>
      </div>

      {/* Template picker modal */}
      {showCreateModal && (
        <Modal title="テンプレートを選択" onClose={() => setShowCreateModal(false)}>
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
                <span className="block text-sm font-bold text-foreground">{tpl.label}</span>
                <span className="block text-xs text-foreground/50 mt-1">{tpl.description}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              キャンセル
            </Button>
            <Button onClick={createForm} disabled={creating}>
              {creating ? "作成中..." : "作成"}
            </Button>
          </div>
        </Modal>
      )}


      {forms.length === 0 ? (
        <EmptyState message="フォームがまだありません。新しいフォームを作成してください。" />
      ) : (
        <div className="flex flex-col gap-4">
          {forms.map((form) => (
            <Card key={form.id}>
              {editingId === form.id ? (
                /* Edit mode */
                <div className="flex flex-col gap-4">
                  <FormField label="タイトル">
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm({ ...editForm, title: e.target.value })
                      }
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="説明">
                    <textarea
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          description: e.target.value,
                        })
                      }
                      rows={2}
                      className={inputClass}
                    />
                  </FormField>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField label="ブランドカラー">
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
                    </FormField>
                    <FormField label="サンクスメッセージ">
                      <input
                        type="text"
                        value={editForm.thank_you_message}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            thank_you_message: e.target.value,
                          })
                        }
                        className={inputClass}
                      />
                    </FormField>
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
                    <Button variant="secondary" size="sm" onClick={() => setEditingId(null)} className="px-3 py-2">
                      <X size={14} />
                      キャンセル
                    </Button>
                    <Button size="sm" onClick={() => saveEdit(form.id)} className="px-3 py-2">
                      <Check size={14} />
                      保存
                    </Button>
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
                    <Button variant="secondary" size="sm" onClick={() => startEdit(form)} className="px-3 py-2 text-xs sm:text-sm">
                      質問内容を確認
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => copyUrl(form.slug, form.id)} className="px-3 py-2 text-xs sm:text-sm">
                      <Copy size={14} />
                      {copiedId === form.id
                        ? "コピーしました"
                        : "URLをコピー"}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setQrForm({ slug: form.slug, title: form.title })} className="px-3 py-2 text-xs sm:text-sm">
                      <QrCode size={14} />
                      QRコード
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && deleteFormId && (
        <DeleteConfirmModal
          title="フォームの削除"
          message="このフォームを削除しますか？関連する回答は残ります。"
          isDeleting={deleting}
          onCancel={() => { setShowDeleteConfirm(false); setDeleteFormId(null); }}
          onConfirm={async () => {
            setDeleting(true);
            const { error } = await supabase.from("forms").delete().eq("id", deleteFormId);
            setDeleting(false);
            if (error) { alert("削除に失敗しました"); return; }
            setForms((prev) => prev.filter((f) => f.id !== deleteFormId));
            setShowDeleteConfirm(false);
            setDeleteFormId(null);
          }}
        />
      )}

      {/* QR Code modal */}
      {qrForm && (
        <Modal title="QRコード" onClose={() => setQrForm(null)} maxWidth="max-w-sm">
          <p className="text-sm text-foreground/50 mb-4 truncate">{qrForm.title}</p>
          <div ref={qrRef} className="flex justify-center p-4 bg-white border border-foreground/10 rounded-lg">
            <QRCode value={`${getBaseUrl()}/form/${qrForm.slug}`} size={200} />
          </div>
          <p className="text-xs text-foreground/40 text-center mt-3 break-all">
            {getBaseUrl()}/form/{qrForm.slug}
          </p>
          <div className="flex gap-2 mt-4">
            <Button onClick={downloadQr} className="flex-1">
              <Download size={14} />
              PNG保存
            </Button>
            <Button variant="secondary" onClick={() => setQrForm(null)}>
              閉じる
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
