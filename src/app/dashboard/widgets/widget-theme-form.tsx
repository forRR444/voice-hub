"use client";

import type { WidgetTheme } from "@/types/database";
import { WIDGET_TYPES } from "@/lib/constants";
import { WidgetPreviewIcon } from "./widget-preview-icon";

type WidgetType = "carousel" | "grid" | "marquee" | "list" | "single" | "wall" | "dual-marquee" | "badge";

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
      <div>
        <label className="block text-sm font-medium text-foreground/70 mb-1">
          ウィジェット名 *
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
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
                  form.type === wt.id
                    ? "text-indigo-600"
                    : "text-foreground/70"
                }`}
              >
                {wt.label}
              </div>
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
              value={form.theme.mode}
              onChange={(e) =>
                onChange({
                  ...form,
                  theme: {
                    ...form.theme,
                    mode: e.target.value as "light" | "dark",
                  },
                })
              }
              className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm bg-white"
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
            <label className="block text-xs text-foreground/50 mb-1">
              最大表示数
            </label>
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
            <label className="block text-xs text-foreground/50 mb-1">
              最低評価
            </label>
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
            <label
              key={key}
              className="flex items-center gap-2 text-sm text-foreground/60"
            >
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
              onChange={(e) =>
                onChange({ ...form, only_featured: e.target.checked })
              }
              className="rounded border-foreground/20"
            />
            注目のみ表示
          </label>
        </div>
      </div>
    </>
  );
}
