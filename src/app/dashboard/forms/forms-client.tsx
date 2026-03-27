"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Copy,
  Pencil,
  Check,
  X,
  Trash2,
  QrCode,
  Download,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import QRCode from "react-qr-code";
import { createClient } from "@/lib/supabase/client";
import { WorkspaceRow, FormRow, FormQuestion, PLAN_LIMITS } from "@/types/database";
import { generateSlug, getBaseUrl, formatDate } from "@/lib/utils";
import { CORE_QUESTION_IDS, FORM_TEMPLATES } from "@/lib/default-questions";
import { DEFAULT_BRAND_COLOR } from "@/lib/constants";

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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editQuestions, setEditQuestions] = useState<FormQuestion[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("coaching");
  const [qrForm, setQrForm] = useState<{ slug: string; title: string } | null>(null);
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
    const url = `${getBaseUrl()}/form/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => startEdit(form)}
                      className="flex items-center gap-2 px-3 py-2 text-sm border border-foreground/10 rounded-lg bg-white hover:bg-foreground/5 cursor-pointer"
                    >
                      質問内容を確認
                    </button>
                    <button
                      onClick={() => copyUrl(form.slug, form.id)}
                      className="flex items-center gap-2 px-3 py-2 text-sm border border-foreground/10 rounded-lg bg-white hover:bg-foreground/5 cursor-pointer"
                    >
                      <Copy size={14} />
                      {copiedId === form.id
                        ? "コピーしました"
                        : "フォームURLをコピー"}
                    </button>
                    <button
                      onClick={() => setQrForm({ slug: form.slug, title: form.title })}
                      className="flex items-center gap-2 px-3 py-2 text-sm border border-foreground/10 rounded-lg bg-white hover:bg-foreground/5 cursor-pointer"
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

      {/* QR Code modal */}
      {qrForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">QRコード</h3>
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

const CUSTOM_TYPES: { value: FormQuestion["type"]; label: string }[] = [
  { value: "text", label: "テキスト" },
  { value: "textarea", label: "テキスト（長文）" },
  { value: "star_rating", label: "星評価" },
  { value: "select", label: "選択肢" },
];

function AddCustomQuestion({ onAdd }: { onAdd: (q: FormQuestion) => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [type, setType] = useState<FormQuestion["type"]>("text");
  const [options, setOptions] = useState("");

  function handleAdd() {
    if (!label.trim()) return;
    const id = `custom_${Date.now()}`;
    const q: FormQuestion = {
      id,
      label: label.trim(),
      type,
      required: false,
      ...(type === "select" ? { options: options.split("\n").map((o) => o.trim()).filter(Boolean) } : {}),
    };
    onAdd(q);
    setLabel("");
    setType("text");
    setOptions("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-foreground/20 text-sm text-foreground/50 hover:border-foreground/30 hover:text-foreground/70 cursor-pointer w-full"
      >
        <Plus size={14} />
        質問を追加
      </button>
    );
  }

  return (
    <div className="p-3 rounded-lg border border-foreground/10 bg-foreground/5 space-y-3">
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="質問文を入力"
        className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as FormQuestion["type"])}
        className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {CUSTOM_TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      {type === "select" && (
        <textarea
          value={options}
          onChange={(e) => setOptions(e.target.value)}
          placeholder={"選択肢を1行ずつ入力\n例:\nとても満足\nやや満足\n普通"}
          rows={4}
          className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      )}
      <div className="flex gap-2">
        <button
          onClick={handleAdd}
          disabled={!label.trim() || (type === "select" && !options.trim())}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
        >
          追加
        </button>
        <button
          onClick={() => { setOpen(false); setLabel(""); setType("text"); setOptions(""); }}
          className="px-4 py-2 text-sm border border-foreground/10 rounded-lg hover:bg-foreground/5 cursor-pointer"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

const PRESET_QUESTIONS: { id: string; label: string; type: FormQuestion["type"]; required?: boolean; placeholder?: string; alwaysOn?: boolean }[] = [
  { id: "rating", label: "総合評価（星）", type: "star_rating", required: true },
  { id: "before_story", label: "利用前の悩み（Before）", type: "textarea", required: false, placeholder: "例：集客がうまくいかず、毎月の売上が安定しませんでした..." },
  { id: "content", label: "感想・レビュー", type: "textarea", required: true },
  { id: "name", label: "お名前", type: "text", required: false, placeholder: "山田 太郎" },
  { id: "title", label: "職業・肩書き", type: "text", required: false, placeholder: "例：ライフコーチ" },
  { id: "avatar", label: "写真", type: "image", required: false },
  { id: "permission", label: "掲載許可", type: "checkbox", required: true, alwaysOn: true },
];

function SortableQuestionItem({
  question,
  onToggle,
  onRemove,
  alwaysOn,
}: {
  question: FormQuestion;
  onToggle?: () => void;
  onRemove?: () => void;
  alwaysOn?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isEnabled = question.enabled !== false;
  const preset = PRESET_QUESTIONS.find((p) => p.id === question.id);
  const displayLabel = preset ? preset.label : question.label;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-2 p-2.5 rounded-lg border bg-white touch-none cursor-grab active:cursor-grabbing ${
        isDragging ? "border-indigo-300 shadow-sm opacity-80" : "border-foreground/10"
      } ${!isEnabled ? "opacity-40" : ""}`}
    >
      {onToggle ? (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 cursor-pointer ${
            isEnabled ? "bg-indigo-600 border-indigo-600" : "border-gray-300"
          }`}
        >
          {isEnabled && <Check size={10} className="text-white" />}
        </button>
      ) : (
        <div className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 bg-indigo-600 border-indigo-600 opacity-50">
          <Check size={10} className="text-white" />
        </div>
      )}
      <span className="text-sm text-foreground flex-1">
        {displayLabel}
        {alwaysOn && <span className="text-red-500 text-lg font-bold ml-0.5 leading-none">*</span>}
      </span>
      {!preset && (
        <span className="text-xs text-foreground/40">
          {question.type === "star_rating" ? "星評価" : question.type === "select" ? "選択肢" : question.type}
        </span>
      )}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="p-1 text-foreground/30 hover:text-red-500 cursor-pointer"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function QuestionEditor({
  questions,
  onChange,
}: {
  questions: FormQuestion[];
  onChange: (qs: FormQuestion[]) => void;
}) {
  const [showPresetPicker, setShowPresetPicker] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    onChange(arrayMove(questions, oldIndex, newIndex));
  }

  const unusedPresets = PRESET_QUESTIONS.filter(
    (p) => !p.alwaysOn && !questions.some((q) => q.id === p.id)
  );

  function addPreset(presetId: string) {
    const preset = PRESET_QUESTIONS.find((p) => p.id === presetId);
    if (!preset) return;
    const newQ: FormQuestion = {
      id: preset.id,
      label: preset.label.replace(/（.*）/, ""),
      type: preset.type,
      required: preset.required ?? false,
      ...(preset.placeholder ? { placeholder: preset.placeholder } : {}),
    };
    onChange([...questions, newQ]);
  }

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5">
            {questions.map((q) => {
              const preset = PRESET_QUESTIONS.find((p) => p.id === q.id);
              const isAlwaysOn = preset?.alwaysOn === true;
              const isCustom = !preset;
              return (
                <SortableQuestionItem
                  key={q.id}
                  question={q}
                  alwaysOn={isAlwaysOn}
                  onToggle={isAlwaysOn ? undefined : () => {
                    onChange(questions.map((eq) =>
                      eq.id === q.id ? { ...eq, enabled: eq.enabled === false ? true : false } : eq
                    ));
                  }}
                  onRemove={isCustom ? () => onChange(questions.filter((eq) => eq.id !== q.id)) : undefined}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {/* 質問追加 */}
      {showPresetPicker ? (
        <div className="p-3 rounded-lg border border-foreground/10 bg-foreground/5 space-y-2">
          {unusedPresets.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {unusedPresets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { addPreset(p.id); setShowPresetPicker(false); }}
                  className="px-3 py-1.5 text-xs border border-foreground/10 rounded-lg bg-white hover:bg-foreground/5 cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
          <AddCustomQuestion onAdd={(q) => { onChange([...questions, q]); setShowPresetPicker(false); }} />
          <button
            onClick={() => setShowPresetPicker(false)}
            className="text-xs text-foreground/40 hover:text-foreground/60 cursor-pointer"
          >
            キャンセル
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowPresetPicker(true)}
          className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-foreground/20 text-sm text-foreground/50 hover:border-foreground/30 hover:text-foreground/70 cursor-pointer w-full"
        >
          <Plus size={14} />
          質問を追加
        </button>
      )}
    </div>
  );
}
