"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Code, ExternalLink, Check, X, Pencil, Trash, MoreHorizontal } from "lucide-react";
import { WorkspaceRow, WidgetRow, WidgetTheme, SubscriptionStatus } from "@/types/database";
import { getPlanLimits } from "@/lib/plan";
import { getBaseUrl, formatDate } from "@/lib/utils";
import { DEFAULT_BRAND_COLOR, WIDGET_TYPES } from "@/lib/constants";
import { WidgetThemeForm, type WidgetFormState } from "./widget-theme-form";
import Modal from "@/app/components/modal";
import CustomSelect from "@/app/components/custom-select";
import DeleteConfirmModal from "@/app/components/delete-confirm-modal";
import EmbedCodeBlock from "@/app/components/embed-code-block";
import PageTitle from "@/app/components/page-title";
import Button from "@/app/components/ui/button";
import Card from "@/app/components/ui/card";
import EmptyState from "@/app/components/ui/empty-state";
import { useCopy } from "@/hooks/use-copy";

type WidgetType =
  | "carousel"
  | "grid"
  | "marquee"
  | "list"
  | "single"
  | "wall"
  | "dual-marquee"
  | "badge";

const DEFAULT_THEME: WidgetTheme = {
  mode: "light",
  brandColor: DEFAULT_BRAND_COLOR,
  showRating: true,
  showAvatar: false,
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
  subscriptionStatus: SubscriptionStatus;
}) {
  const [widgets, setWidgets] = useState<WidgetRow[]>(initialWidgets);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { copiedKey: copiedField, copy: copyText } = useCopy();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<WidgetFormState>({
    name: "",
    type: "carousel",
    theme: { ...DEFAULT_THEME },
    filter_min_rating: 1,
    only_featured: false,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [newWidget, setNewWidget] = useState<WidgetFormState>({
    name: "",
    type: "carousel",
    theme: { ...DEFAULT_THEME },
    filter_min_rating: 1,
    only_featured: false,
  });

  const limits = getPlanLimits(subscriptionStatus);
  const canCreate = widgets.length < limits.widgets;
  const baseUrl = getBaseUrl();

  async function handleCreate() {
    if (!newWidget.name.trim()) return;
    setCreating(true);

    try {
      const res = await fetch("/api/widgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newWidget.name,
          type: newWidget.type,
          theme: newWidget.theme,
          filter_min_rating: newWidget.filter_min_rating,
          only_featured: newWidget.only_featured,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.ok) {
          setWidgets((prev) => [json.data, ...prev]);
          setShowCreate(false);
          setNewWidget({
            name: "",
            type: "carousel",
            theme: { ...DEFAULT_THEME },
            filter_min_rating: 1,
            only_featured: false,
          });
          setError(null);
        } else {
          setError("ウィジェットの作成に失敗しました");
        }
      } else {
        setError("ウィジェットの作成に失敗しました");
      }
    } catch {
      setError("ウィジェットの作成に失敗しました");
    }

    setCreating(false);
  }

  function getWidgetThemeMode(id: string): string {
    const w = widgets.find((widget) => widget.id === id);
    if (!w) return "light";
    const theme = w.theme;
    if (theme && typeof theme === "object" && "mode" in theme) {
      const m = (theme as { mode: string }).mode;
      if (m === "light" || m === "dark" || m === "auto") return m;
    }
    return "light";
  }

  function getScriptEmbed(id: string) {
    const themeMode = getWidgetThemeMode(id);
    return `<script src="${baseUrl}/widget/v1/embed.js" defer></script>\n<div data-testimonial-widget="${id}" data-theme="${themeMode}"></div>`;
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
    try {
      const res = await fetch("/api/widgets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: editForm.name,
          type: editForm.type,
          theme: editForm.theme,
          filter_min_rating: editForm.filter_min_rating,
          only_featured: editForm.only_featured,
        }),
      });

      if (res.ok) {
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
        setError(null);
      } else {
        setError("ウィジェットの保存に失敗しました");
      }
    } catch {
      setError("ウィジェットの保存に失敗しました");
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      const res = await fetch("/api/widgets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setWidgets((prev) => prev.filter((w) => w.id !== id));
        setDeletingId(null);
        setError(null);
      } else {
        setError("ウィジェットの削除に失敗しました");
        setDeletingId(null);
      }
    } catch {
      setError("ウィジェットの削除に失敗しました");
      setDeletingId(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <PageTitle>ウィジェット管理</PageTitle>
        <Button
          onClick={() => setShowCreate(true)}
          disabled={!canCreate}
          className="p-2 sm:px-4 sm:py-2"
        >
          <Plus size={16} />
          <span className="sm:hidden">追加</span>
          <span className="hidden sm:inline">新しいウィジェット</span>
        </Button>
      </div>

      {error && (
        <p className="text-sm mb-4" style={{ color: "#E25950" }}>
          {error}
        </p>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal
          title="新しいウィジェット作成"
          onClose={() => setShowCreate(false)}
          rounded="rounded-lg"
          className="max-h-[90vh] overflow-y-auto"
        >
          <div className="flex flex-col gap-4">
            <WidgetThemeForm form={newWidget} onChange={setNewWidget} />

            <div className="flex justify-end gap-3 mt-2">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>
                キャンセル
              </Button>
              <Button onClick={handleCreate} disabled={creating || !newWidget.name.trim()}>
                {creating ? "作成中..." : "作成する"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Widget list */}
      {widgets.length === 0 ? (
        <EmptyState message="ウィジェットがまだありません。新しいウィジェットを作成してください。" />
      ) : (
        <div className="flex flex-col gap-4">
          {widgets.map((w) => (
            <Card key={w.id}>
              {editingId === w.id ? (
                /* Edit mode */
                <div className="flex flex-col gap-4">
                  <WidgetThemeForm form={editForm} onChange={setEditForm} />
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setEditingId(null)}>
                      <X size={14} />
                      キャンセル
                    </Button>
                    <Button size="sm" onClick={() => saveEdit(w.id)}>
                      <Check size={14} />
                      保存
                    </Button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{w.name}</h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-foreground/50">
                        <span className="flex items-center gap-1">
                          タイプ:
                          <CustomSelect
                            value={w.type}
                            onChange={async (val) => {
                              const newType = val as WidgetType;
                              const previousType = w.type;
                              setWidgets((prev) =>
                                prev.map((widget) =>
                                  widget.id === w.id ? { ...widget, type: newType } : widget
                                )
                              );
                              try {
                                const res = await fetch("/api/widgets", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ id: w.id, type: newType }),
                                });
                                if (!res.ok) throw new Error();
                              } catch {
                                setWidgets((prev) =>
                                  prev.map((widget) =>
                                    widget.id === w.id ? { ...widget, type: previousType } : widget
                                  )
                                );
                                alert("タイプの変更に失敗しました。もう一度お試しください。");
                              }
                            }}
                            options={WIDGET_TYPES.map((wt) => ({ value: wt.id, label: wt.label }))}
                            className="inline-block w-auto"
                          />
                        </span>
                        <span>
                          モード:{" "}
                          {(w.theme as WidgetTheme).mode === "auto"
                            ? "自動"
                            : (w.theme as WidgetTheme).mode === "dark"
                              ? "ダーク"
                              : "ライト"}
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
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
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
                              onClick={() => {
                                startEdit(w);
                                setOpenMenuId(null);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-foreground/70 hover:bg-foreground/5 cursor-pointer"
                            >
                              <Pencil size={14} />
                              編集
                            </button>
                            <div className="border-t border-foreground/10 my-1" />
                            <button
                              onClick={() => {
                                setDeletingId(w.id);
                                setOpenMenuId(null);
                              }}
                              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 cursor-pointer"
                            >
                              <Trash size={14} />
                              削除
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}
                      className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      <Code size={14} />
                      埋め込みコードを表示
                    </button>
                  </div>

                  {expandedId === w.id && (
                    <div className="mt-4 flex flex-col gap-4">
                      <EmbedCodeBlock
                        label="スクリプト埋め込み"
                        description="おすすめ・デザインが自然に馴染む"
                        code={getScriptEmbed(w.id)}
                        copied={copiedField === `script-${w.id}`}
                        onCopy={() => copyText(getScriptEmbed(w.id), `script-${w.id}`)}
                      />
                      <EmbedCodeBlock
                        label="iFrame埋め込み"
                        description="ペライチ・Wixなどスクリプトが使えない場合"
                        code={getIframeEmbed(w.id)}
                        copied={copiedField === `iframe-${w.id}`}
                        onCopy={() => copyText(getIframeEmbed(w.id), `iframe-${w.id}`)}
                      />
                    </div>
                  )}
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {deletingId && (
        <DeleteConfirmModal
          title="削除の確認"
          message="このウィジェットを削除しますか？埋め込み先でも表示されなくなります。"
          isDeleting={deleting}
          onCancel={() => setDeletingId(null)}
          onConfirm={() => handleDelete(deletingId)}
        />
      )}
    </div>
  );
}
