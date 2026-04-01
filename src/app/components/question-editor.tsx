"use client";

import { useState } from "react";
import { Plus, Check, X } from "@phosphor-icons/react";
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
import type { FormQuestion } from "@/types/database";

export const PRESET_QUESTIONS: { id: string; label: string; type: FormQuestion["type"]; required?: boolean; placeholder?: string; alwaysOn?: boolean }[] = [
  { id: "rating", label: "総合評価（星）", type: "star_rating", required: true },
  { id: "before_story", label: "利用前の悩み（Before）", type: "textarea", required: false, placeholder: "例：集客がうまくいかず、毎月の売上が安定しませんでした..." },
  { id: "content", label: "感想・レビュー", type: "textarea", required: true },
  { id: "name", label: "お名前", type: "text", required: false, placeholder: "山田 太郎" },
  { id: "title", label: "職業・肩書き", type: "text", required: false, placeholder: "例：ライフコーチ" },
  { id: "avatar", label: "写真", type: "image", required: false },
  { id: "permission", label: "掲載許可", type: "checkbox", required: true, alwaysOn: true },
];

const CUSTOM_TYPES: { value: FormQuestion["type"]; label: string }[] = [
  { value: "text", label: "テキスト" },
  { value: "textarea", label: "テキスト（長文）" },
  { value: "star_rating", label: "星評価" },
  { value: "select", label: "選択肢" },
];

function AddCustomQuestion({ onAdd, onCancel }: { onAdd: (q: FormQuestion) => void; onCancel: () => void }) {
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
  }

  return (
    <div className="space-y-3">
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
          onClick={() => { setLabel(""); setType("text"); setOptions(""); onCancel(); }}
          className="px-4 py-2 text-sm border border-foreground/10 rounded-lg hover:bg-foreground/5 cursor-pointer"
        >
          キャンセル
        </button>
        <button
          onClick={handleAdd}
          disabled={!label.trim() || (type === "select" && !options.trim())}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
        >
          追加
        </button>
      </div>
    </div>
  );
}

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

export default function QuestionEditor({
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
          <p className="text-xs text-foreground/50 pt-1">または自由に追加：</p>
          <AddCustomQuestion onAdd={(q) => { onChange([...questions, q]); setShowPresetPicker(false); }} onCancel={() => setShowPresetPicker(false)} />
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
