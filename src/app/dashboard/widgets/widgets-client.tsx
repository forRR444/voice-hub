"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Copy,
  Code,
  ExternalLink,
  Check,
  X,
  Pencil,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  WorkspaceRow,
  WidgetRow,
  WidgetTheme,
  PLAN_LIMITS,
} from "@/types/database";
import { getBaseUrl, formatDate } from "@/lib/utils";

const WIDGET_TYPES = [
  { id: "carousel", label: "カルーセル", desc: "横スクロールで切り替え" },
  { id: "grid", label: "グリッド", desc: "カード一覧" },
  { id: "marquee", label: "マーキー", desc: "横に流れ続ける" },
  { id: "wall", label: "Wall of Love", desc: "Masonry風の大量表示" },
  { id: "list", label: "リスト", desc: "縦に並ぶシンプル表示" },
  { id: "single", label: "シングル", desc: "1件を大きく表示" },
  { id: "badge", label: "バッジ", desc: "評価サマリー表示" },
] as const;

function WidgetPreviewIcon({ type, selected }: { type: string; selected: boolean }) {
  const bg = selected ? "bg-indigo-100" : "bg-foreground/5";
  const bar = selected ? "bg-indigo-300" : "bg-foreground/20";
  const block = selected ? "bg-indigo-200" : "bg-foreground/10";

  switch (type) {
    case "carousel":
      return (
        <div className={`w-full h-16 ${bg} rounded flex items-center justify-center gap-1 px-2`}>
          <div className={`w-1 h-8 ${bar} rounded-sm shrink-0`} />
          <div className={`w-10 h-10 ${block} rounded`} />
          <div className={`w-10 h-10 ${block} rounded`} />
          <div className={`w-10 h-10 ${block} rounded`} />
          <div className={`w-1 h-8 ${bar} rounded-sm shrink-0`} />
        </div>
      );
    case "grid":
      return (
        <div className={`w-full h-16 ${bg} rounded p-2`}>
          <div className="grid grid-cols-3 gap-1 h-full">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`${block} rounded-sm`} />
            ))}
          </div>
        </div>
      );
    case "marquee":
      return (
        <div className={`w-full h-16 ${bg} rounded flex items-center gap-1 px-2 overflow-hidden`}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`w-12 h-10 ${block} rounded shrink-0`} />
          ))}
        </div>
      );
    case "wall":
      return (
        <div className={`w-full h-16 ${bg} rounded p-2`}>
          <div className="grid grid-cols-3 gap-1 h-full">
            <div className={`${block} rounded-sm row-span-2`} />
            <div className={`${block} rounded-sm`} />
            <div className={`${block} rounded-sm row-span-2`} />
            <div className={`${block} rounded-sm`} />
          </div>
        </div>
      );
    case "list":
      return (
        <div className={`w-full h-16 ${bg} rounded p-2 flex flex-col gap-1`}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`w-full flex-1 ${block} rounded-sm border-l-2 ${selected ? "border-indigo-400" : "border-foreground/30"}`} />
          ))}
        </div>
      );
    case "single":
      return (
        <div className={`w-full h-16 ${bg} rounded flex items-center justify-center p-2`}>
          <div className={`w-20 h-12 ${block} rounded`} />
        </div>
      );
    case "badge":
      return (
        <div className={`w-full h-16 ${bg} rounded flex items-center justify-center`}>
          <div className={`${block} rounded-full px-4 py-2 flex items-center gap-2`}>
            <div className={`w-5 h-5 ${bar} rounded-sm`} />
            <div className={`w-12 h-2 ${bar} rounded`} />
          </div>
        </div>
      );
    default:
      return null;
  }
}

type WidgetType = "carousel" | "grid" | "marquee" | "list" | "single" | "wall" | "badge";

const DEFAULT_THEME: WidgetTheme = {
  mode: "light",
  brandColor: "#635BFF",
  showRating: true,
  showAvatar: true,
  showDate: false,
  maxItems: 10,
  autoplay: true,
};

export default function WidgetsClient({
  workspace,
  widgets: initialWidgets,
  subscriptionStatus,
}: {
  workspace: WorkspaceRow;
  widgets: WidgetRow[];
  subscriptionStatus: string;
}) {
  const supabase = createClient();
  const [widgets, setWidgets] = useState<WidgetRow[]>(initialWidgets);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    type: "carousel" as WidgetType,
    theme: { ...DEFAULT_THEME },
    filter_min_rating: 1,
    only_featured: false,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [newWidget, setNewWidget] = useState({
    name: "",
    type: "carousel" as WidgetType,
    theme: { ...DEFAULT_THEME },
    filter_min_rating: 1,
    only_featured: false,
  });

  const plan = subscriptionStatus === "pro" ? "pro" : "free";
  const limit = PLAN_LIMITS[plan].widgets;
  const canCreate = widgets.length < limit;
  const baseUrl = getBaseUrl();

  async function handleCreate() {
    if (!newWidget.name.trim()) return;
    setCreating(true);

    const { data, error } = await supabase
      .from("widgets")
      .insert({
        workspace_id: workspace.id,
        name: newWidget.name,
        type: newWidget.type,
        theme: newWidget.theme,
        filter_min_rating: newWidget.filter_min_rating,
        only_featured: newWidget.only_featured,
      })
      .select()
      .single();

    setCreating(false);
    if (!error && data) {
      setWidgets((prev) => [data, ...prev]);
      setShowCreate(false);
      setNewWidget({
        name: "",
        type: "carousel",
        theme: { ...DEFAULT_THEME },
        filter_min_rating: 1,
        only_featured: false,
      });
    }
  }

  function getScriptEmbed(id: string) {
    return `<script src="${baseUrl}/widget/v1/embed.js" defer></script>\n<div data-testimonial-widget="${id}" data-theme="light"></div>`;
  }

  function getIframeEmbed(id: string) {
    return `<iframe src="${baseUrl}/preview/${id}" width="100%" height="400" frameborder="0"></iframe>`;
  }

  function startEdit(w: WidgetRow) {
    const theme = w.theme as WidgetTheme;
    setEditingId(w.id);
    setEditForm({
      name: w.name,
      type: w.type as WidgetType,
      theme: { ...DEFAULT_THEME, ...theme },
      filter_min_rating: w.filter_min_rating,
      only_featured: w.only_featured,
    });
  }

  async function saveEdit(id: string) {
    const { error } = await supabase
      .from("widgets")
      .update({
        name: editForm.name,
        type: editForm.type,
        theme: editForm.theme,
        filter_min_rating: editForm.filter_min_rating,
        only_featured: editForm.only_featured,
      })
      .eq("id", id);

    if (!error) {
      setWidgets((prev) =>
        prev.map((w) =>
          w.id === id
            ? {
                ...w,
                name: editForm.name,
                type: editForm.type,
                theme: editForm.theme,
                filter_min_rating: editForm.filter_min_rating,
                only_featured: editForm.only_featured,
              }
            : w
        )
      );
      setEditingId(null);
    }
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("widgets").delete().eq("id", id);
    if (!error) {
      setWidgets((prev) => prev.filter((w) => w.id !== id));
      setDeletingId(null);
    }
  }

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-foreground">ウィジェット管理</h2>
        <button
          onClick={() => setShowCreate(true)}
          disabled={!canCreate}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
        >
          <Plus size={16} />
          新しいウィジェット
        </button>
      </div>

      {!canCreate && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          フリープランではウィジェットは{limit}つまでです。
          <Link href="/dashboard/settings" className="underline ml-1">
            アップグレード
          </Link>
          して制限を解除しましょう。
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-sm w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">
                新しいウィジェット作成
              </h3>
              <button
                onClick={() => setShowCreate(false)}
                className="p-1 text-foreground/40 hover:text-foreground/60 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1">
                  ウィジェット名 *
                </label>
                <input
                  type="text"
                  value={newWidget.name}
                  onChange={(e) =>
                    setNewWidget({ ...newWidget, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="メインページ用"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1">
                  タイプ
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {WIDGET_TYPES.map((wt) => (
                    <button
                      key={wt.id}
                      type="button"
                      onClick={() => setNewWidget({ ...newWidget, type: wt.id })}
                      className={`p-2 text-left rounded-lg border-2 transition-colors cursor-pointer ${
                        newWidget.type === wt.id
                          ? "border-indigo-600 bg-white"
                          : "border-foreground/10 bg-white hover:border-foreground/30"
                      }`}
                    >
                      <WidgetPreviewIcon type={wt.id} selected={newWidget.type === wt.id} />
                      <div className={`text-sm font-medium mt-2 ${newWidget.type === wt.id ? "text-indigo-600" : "text-foreground/70"}`}>{wt.label}</div>
                      <div className="text-xs text-foreground/40">{wt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-foreground/10 pt-4">
                <h4 className="text-sm font-medium text-foreground/70 mb-3">
                  テーマ設定
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-foreground/50 mb-1">
                      モード
                    </label>
                    <select
                      value={newWidget.theme.mode}
                      onChange={(e) =>
                        setNewWidget({
                          ...newWidget,
                          theme: {
                            ...newWidget.theme,
                            mode: e.target.value as "light" | "dark",
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm"
                    >
                      <option value="light">ライト</option>
                      <option value="dark">ダーク</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-foreground/50 mb-1">
                      ブランドカラー
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newWidget.theme.brandColor}
                        onChange={(e) =>
                          setNewWidget({
                            ...newWidget,
                            theme: {
                              ...newWidget.theme,
                              brandColor: e.target.value,
                            },
                          })
                        }
                        className="w-10 h-10 rounded border border-foreground/10 cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-foreground/50 mb-1">
                      最大表示数
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={newWidget.theme.maxItems}
                      onChange={(e) =>
                        setNewWidget({
                          ...newWidget,
                          theme: {
                            ...newWidget.theme,
                            maxItems: parseInt(e.target.value) || 10,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-foreground/50 mb-1">
                      最低評価
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={newWidget.filter_min_rating}
                      onChange={(e) =>
                        setNewWidget({
                          ...newWidget,
                          filter_min_rating: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  {[
                    { key: "showRating" as const, label: "評価を表示" },
                    { key: "showAvatar" as const, label: "アバターを表示" },
                    { key: "showDate" as const, label: "日付を表示" },
                    { key: "autoplay" as const, label: "自動再生" },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 text-sm text-foreground/60"
                    >
                      <input
                        type="checkbox"
                        checked={newWidget.theme[key]}
                        onChange={(e) =>
                          setNewWidget({
                            ...newWidget,
                            theme: {
                              ...newWidget.theme,
                              [key]: e.target.checked,
                            },
                          })
                        }
                        className="rounded border-foreground/20"
                      />
                      {label}
                    </label>
                  ))}
                  <label className="flex items-center gap-2 text-sm text-foreground/60">
                    <input
                      type="checkbox"
                      checked={newWidget.only_featured}
                      onChange={(e) =>
                        setNewWidget({
                          ...newWidget,
                          only_featured: e.target.checked,
                        })
                      }
                      className="rounded border-foreground/20"
                    />
                    注目のみ表示
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm text-foreground/70 border border-foreground/10 rounded-lg hover:bg-foreground/5 cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !newWidget.name.trim()}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                >
                  {creating ? "作成中..." : "作成する"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Widget list */}
      {widgets.length === 0 ? (
        <div className="text-center py-16 text-foreground/50">
          ウィジェットがまだありません。新しいウィジェットを作成してください。
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {widgets.map((w) => (
            <div
              key={w.id}
              className="bg-white rounded-lg border border-foreground/10 shadow-sm p-6"
            >
              {editingId === w.id ? (
                /* Edit mode */
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-1">
                      ウィジェット名
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-1">
                      タイプ
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {WIDGET_TYPES.map((wt) => (
                        <button
                          key={wt.id}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, type: wt.id })}
                          className={`p-2 text-left rounded-lg border-2 transition-colors cursor-pointer ${
                            editForm.type === wt.id
                              ? "border-indigo-600 bg-white"
                              : "border-foreground/10 bg-white hover:border-foreground/30"
                          }`}
                        >
                          <WidgetPreviewIcon type={wt.id} selected={editForm.type === wt.id} />
                          <div className={`text-sm font-medium mt-2 ${editForm.type === wt.id ? "text-indigo-600" : "text-foreground/70"}`}>{wt.label}</div>
                          <div className="text-xs text-foreground/40">{wt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-foreground/50 mb-1">モード</label>
                      <select
                        value={editForm.theme.mode}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            theme: { ...editForm.theme, mode: e.target.value as "light" | "dark" },
                          })
                        }
                        className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm bg-white"
                      >
                        <option value="light">ライト</option>
                        <option value="dark">ダーク</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-foreground/50 mb-1">ブランドカラー</label>
                      <input
                        type="color"
                        value={editForm.theme.brandColor}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            theme: { ...editForm.theme, brandColor: e.target.value },
                          })
                        }
                        className="w-10 h-10 rounded border border-foreground/10 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-foreground/50 mb-1">最大表示数</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={editForm.theme.maxItems}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            theme: { ...editForm.theme, maxItems: parseInt(e.target.value) || 10 },
                          })
                        }
                        className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-foreground/50 mb-1">最低評価</label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        value={editForm.filter_min_rating}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            filter_min_rating: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {[
                      { key: "showRating" as const, label: "評価を表示" },
                      { key: "showAvatar" as const, label: "アバターを表示" },
                      { key: "showDate" as const, label: "日付を表示" },
                      { key: "autoplay" as const, label: "自動再生" },
                    ].map(({ key, label }) => (
                      <label key={key} className="flex items-center gap-2 text-sm text-foreground/60">
                        <input
                          type="checkbox"
                          checked={editForm.theme[key]}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              theme: { ...editForm.theme, [key]: e.target.checked },
                            })
                          }
                          className="rounded border-foreground/20"
                        />
                        {label}
                      </label>
                    ))}
                    <label className="flex items-center gap-2 text-sm text-foreground/60">
                      <input
                        type="checkbox"
                        checked={editForm.only_featured}
                        onChange={(e) =>
                          setEditForm({ ...editForm, only_featured: e.target.checked })
                        }
                        className="rounded border-foreground/20"
                      />
                      注目のみ表示
                    </label>
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
                      onClick={() => saveEdit(w.id)}
                      className="flex items-center gap-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
                    >
                      <Check size={14} />
                      保存
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {w.name}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-foreground/50">
                    <span className="flex items-center gap-1">
                      タイプ:
                      <select
                        value={w.type}
                        onChange={async (e) => {
                          const newType = e.target.value as WidgetType;
                          const { error } = await supabase
                            .from("widgets")
                            .update({ type: newType })
                            .eq("id", w.id);
                          if (!error) {
                            setWidgets((prev) =>
                              prev.map((widget) =>
                                widget.id === w.id ? { ...widget, type: newType } : widget
                              )
                            );
                          }
                        }}
                        className="text-sm text-indigo-600 bg-transparent border-none cursor-pointer focus:outline-none font-medium"
                      >
                        {WIDGET_TYPES.map((wt) => (
                          <option key={wt.id} value={wt.id}>{wt.label}</option>
                        ))}
                      </select>
                    </span>
                    <span>
                      モード:{" "}
                      {(w.theme as WidgetTheme).mode === "light"
                        ? "ライト"
                        : "ダーク"}
                    </span>
                    <span>作成日: {formatDate(w.created_at)}</span>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === w.id ? null : w.id)}
                    className="p-2 text-foreground/40 hover:text-foreground/60 hover:bg-foreground/5 rounded-lg cursor-pointer"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {openMenuId === w.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setOpenMenuId(null)}
                      />
                      <div className="absolute right-0 top-10 z-20 w-44 bg-white rounded-lg border border-foreground/10 shadow-lg py-1">
                        <a
                          href={`${baseUrl}/preview/${w.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-foreground/70 hover:bg-foreground/5"
                          onClick={() => setOpenMenuId(null)}
                        >
                          <ExternalLink size={14} />
                          プレビュー
                        </a>
                        <button
                          onClick={() => { startEdit(w); setOpenMenuId(null); }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground/70 hover:bg-foreground/5 cursor-pointer"
                        >
                          <Pencil size={14} />
                          編集
                        </button>
                        <div className="border-t border-foreground/10 my-1" />
                        <button
                          onClick={() => { setDeletingId(w.id); setOpenMenuId(null); }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 size={14} />
                          削除
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() =>
                    setExpandedId(expandedId === w.id ? null : w.id)
                  }
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 cursor-pointer"
                >
                  <Code size={14} />
                  埋め込みコードを表示
                </button>
              </div>

                {expandedId === w.id && (
                  <div className="mt-4 flex flex-col gap-4">
                    {/* Script embed */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground/50">
                          スクリプト埋め込み<span className="font-normal text-foreground/30 ml-2">おすすめ・デザインが自然に馴染む</span>
                        </span>
                        <button
                          onClick={() =>
                            copyText(getScriptEmbed(w.id), `script-${w.id}`)
                          }
                          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer"
                        >
                          {copiedField === `script-${w.id}` ? (
                            <>
                              <Check size={12} />
                              コピーしました
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              コピー
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="bg-foreground/5 text-foreground/70 text-xs p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                        {getScriptEmbed(w.id)}
                      </pre>
                    </div>

                    {/* iFrame embed */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground/50">
                          iFrame埋め込み<span className="font-normal text-foreground/30 ml-2">ペライチ・Wixなどスクリプトが使えない場合</span>
                        </span>
                        <button
                          onClick={() =>
                            copyText(getIframeEmbed(w.id), `iframe-${w.id}`)
                          }
                          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer"
                        >
                          {copiedField === `iframe-${w.id}` ? (
                            <>
                              <Check size={12} />
                              コピーしました
                            </>
                          ) : (
                            <>
                              <Copy size={12} />
                              コピー
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="bg-foreground/5 text-foreground/70 text-xs p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                        {getIframeEmbed(w.id)}
                      </pre>
                    </div>
                  </div>
                )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-sm p-6 max-w-sm mx-4">
            <h3 className="text-lg font-bold text-foreground mb-2">
              削除の確認
            </h3>
            <p className="text-sm text-foreground/60 mb-6">
              このウィジェットを削除しますか？埋め込み先でも表示されなくなります。
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 text-sm text-foreground/70 border border-foreground/10 rounded-lg hover:bg-foreground/5 cursor-pointer"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 cursor-pointer"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
