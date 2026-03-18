"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  CreditCard,
  Zap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { WorkspaceRow, PLAN_LIMITS } from "@/types/database";

export default function SettingsClient({
  workspace,
  subscriptionStatus,
  usage,
}: {
  workspace: WorkspaceRow;
  subscriptionStatus: string;
  usage: { testimonials: number; forms: number; widgets: number };
}) {
  const supabase = createClient();
  const [name, setName] = useState(workspace.name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const plan = subscriptionStatus === "pro" ? "pro" : "free";
  const limits = PLAN_LIMITS[plan];
  const isPro = plan === "pro";

  async function saveName() {
    if (!name.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("workspaces")
      .update({ name: name.trim() })
      .eq("id", workspace.id);
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-foreground mb-8">設定</h2>

      {/* Workspace name */}
      <section className="bg-background rounded-xl border border-foreground/10 p-6 mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          ワークスペース
        </h3>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-1">
            ワークスペース名
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 px-3 py-2 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={saveName}
              disabled={saving || !name.trim()}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              {saved ? (
                <>
                  <Check size={14} />
                  保存しました
                </>
              ) : saving ? (
                "保存中..."
              ) : (
                "保存"
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Plan info */}
      <section className="bg-background rounded-xl border border-foreground/10 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">プラン情報</h3>
          <span
            className={`px-3 py-1 text-sm font-medium rounded-full ${
              isPro
                ? "bg-indigo-100 text-indigo-700"
                : "bg-foreground/5 text-foreground/70"
            }`}
          >
            {isPro ? "Pro" : "Free"}
          </span>
        </div>

        {/* Usage stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <UsageCard
            label="お客様の声"
            used={usage.testimonials}
            limit={limits.testimonials}
          />
          <UsageCard
            label="フォーム"
            used={usage.forms}
            limit={limits.forms}
          />
          <UsageCard
            label="ウィジェット"
            used={usage.widgets}
            limit={limits.widgets}
          />
        </div>

        {/* Actions */}
        {isPro ? (
          <a
            href="/api/stripe/portal"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-foreground/10 rounded-lg bg-background hover:bg-foreground/5"
          >
            <CreditCard size={16} />
            請求情報を管理
          </a>
        ) : (
          <a
            href="/api/stripe/checkout"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Zap size={16} />
            Proにアップグレード
          </a>
        )}
      </section>

      {/* Pro plan comparison */}
      {!isPro && (
        <section className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Proプランの特徴
          </h3>
          <ul className="flex flex-col gap-3">
            {[
              "お客様の声 - 無制限",
              "フォーム - 無制限",
              "ウィジェット - 無制限",
              "VoiceHubバッジ非表示",
              "優先サポート",
            ].map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <Check size={16} className="text-indigo-600 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
          <a
            href="/api/stripe/checkout"
            className="inline-flex items-center gap-2 mt-6 px-6 py-2.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            <Zap size={16} />
            今すぐアップグレード
          </a>
        </section>
      )}
    </div>
  );
}

function UsageCard({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number;
}) {
  const isUnlimited = limit === Infinity;
  const percentage = isUnlimited ? 0 : Math.min((used / limit) * 100, 100);
  const isNearLimit = !isUnlimited && percentage >= 80;

  return (
    <div className="bg-foreground/5 rounded-lg p-4">
      <p className="text-sm text-foreground/50 mb-1">{label}</p>
      <p className="text-xl font-bold text-foreground">
        {used}
        <span className="text-sm font-normal text-foreground/40">
          {" "}
          / {isUnlimited ? "無制限" : limit}
        </span>
      </p>
      {!isUnlimited && (
        <div className="mt-2 h-1.5 bg-foreground/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isNearLimit ? "bg-amber-500" : "bg-indigo-500"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
