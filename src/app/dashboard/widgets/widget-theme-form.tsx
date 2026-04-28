"use client";

import type { WidgetTheme } from "@/types/database";
import { WIDGET_TYPES } from "@/lib/constants";
import { WidgetPreviewIcon } from "./widget-preview-icon";
import FormField, { inputClass } from "@/app/components/ui/form-field";
import { Sun, Moon, Sparkles, Info } from "lucide-react";
import { brand, slate, muted, plate } from "@/lib/theme-tokens";

type WidgetType =
  | "carousel"
  | "grid"
  | "marquee"
  | "list"
  | "single"
  | "wall"
  | "dual-marquee"
  | "badge";

export type WidgetFormState = {
  name: string;
  type: WidgetType;
  theme: WidgetTheme;
  filter_min_rating: number;
  only_featured: boolean;
};

/**
 * ウィジェットのテーマ設定フォーム（作成・編集で共通利用）
 */
export function WidgetThemeForm({
  form,
  onChange,
}: {
  form: WidgetFormState;
  onChange: (form: WidgetFormState) => void;
}) {
  return (
    <>
      <FormField label="ウィジェット名" required>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          className={inputClass}
          placeholder="メインページ用"
        />
      </FormField>

      <FormField label="タイプ">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {WIDGET_TYPES.map((wt) => (
            <button
              key={wt.id}
              type="button"
              onClick={() => onChange({ ...form, type: wt.id })}
              className={`p-2 text-left rounded-lg border-2 transition-colors cursor-pointer ${
                form.type === wt.id
                  ? "border-indigo-600 bg-white"
                  : "border-foreground/10 bg-white hover:border-foreground/30"
              }`}
            >
              <WidgetPreviewIcon type={wt.id} selected={form.type === wt.id} />
              <div
                className={`text-sm font-medium mt-2 ${
                  form.type === wt.id ? "text-indigo-600" : "text-foreground/70"
                }`}
              >
                {wt.label}
              </div>
              <div className="text-xs text-foreground/40">{wt.desc}</div>
            </button>
          ))}
        </div>
      </FormField>

      <div className="border-t border-foreground/10 pt-4">
        <h4 className="text-sm font-medium text-foreground/70 mb-3">テーマ設定</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs text-foreground/50 mb-1">モード</label>
            <div className="grid grid-cols-3 gap-3">
              {(
                [
                  { value: "light", label: "ライト", icon: Sun },
                  { value: "dark", label: "ダーク", icon: Moon },
                  { value: "auto", label: "自動適応", icon: Sparkles, sub: "HPの色に馴染む" },
                ] as const
              ).map((opt) => {
                const Icon = opt.icon;
                const selected = form.theme.mode === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      const mode = opt.value;
                      if (mode === "light" || mode === "dark" || mode === "auto") {
                        onChange({ ...form, theme: { ...form.theme, mode } });
                      }
                    }}
                    className="p-3 rounded-lg cursor-pointer transition-all duration-150 text-left"
                    style={{
                      border: selected ? "2px solid " + brand : "2px solid transparent",
                      background: selected ? undefined : plate,
                    }}
                  >
                    <Icon size={18} style={{ color: selected ? brand : muted }} />
                    <div
                      className="text-sm font-medium mt-1"
                      style={{ color: selected ? brand : slate }}
                    >
                      {opt.label}
                    </div>
                    {"sub" in opt && opt.sub && (
                      <div className="text-xs" style={{ color: muted }}>
                        {opt.sub}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            {form.theme.mode === "auto" && (
              <div
                className="flex items-start gap-2.5 p-3 rounded-lg mt-3"
                style={{ background: "rgba(99,91,255,0.06)" }}
              >
                <Info size={16} className="shrink-0 mt-0.5" style={{ color: brand }} />
                <div>
                  <p className="text-[13px]" style={{ color: slate }}>
                    埋め込み先ページの背景色・アクセントカラーを自動検出し、ウィジェットが自然に馴染みます。
                  </p>
                  <p className="text-xs mt-1" style={{ color: muted }}>
                    検出できない場合は、下のフォールバックカラーが使われます。
                  </p>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-foreground/50 mb-1">
              {form.theme.mode === "auto" ? "フォールバックカラー" : "ブランドカラー"}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.theme.brandColor}
                onChange={(e) =>
                  onChange({
                    ...form,
                    theme: { ...form.theme, brandColor: e.target.value },
                  })
                }
                className="w-10 h-10 rounded border border-foreground/10 cursor-pointer"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-foreground/50 mb-1">最大表示数</label>
            <input
              type="number"
              min={1}
              max={50}
              value={form.theme.maxItems}
              onChange={(e) =>
                onChange({
                  ...form,
                  theme: {
                    ...form.theme,
                    maxItems: parseInt(e.target.value) || 10,
                  },
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
              value={form.filter_min_rating}
              onChange={(e) =>
                onChange({
                  ...form,
                  filter_min_rating: parseInt(e.target.value) || 1,
                })
              }
              className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm bg-white"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          {(
            [
              { key: "showRating" as const, label: "評価を表示" },
              { key: "showAvatar" as const, label: "アバターを表示" },
              { key: "showDate" as const, label: "日付を表示" },
              { key: "autoplay" as const, label: "自動再生" },
            ] as const
          ).map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm text-foreground/60">
              <input
                type="checkbox"
                checked={form.theme[key]}
                onChange={(e) =>
                  onChange({
                    ...form,
                    theme: { ...form.theme, [key]: e.target.checked },
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
              checked={form.only_featured}
              onChange={(e) => onChange({ ...form, only_featured: e.target.checked })}
              className="rounded border-foreground/20"
            />
            注目のみ表示
          </label>
        </div>
      </div>
    </>
  );
}
