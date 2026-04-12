"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown, ExternalLink } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validatePassword, validatePasswordMatch } from "@/lib/validation";
import { WorkspaceRow, SubscriptionStatus } from "@/types/database";
import { getPlanLimits, getEffectivePlan, IS_BETA } from "@/lib/plan";
import { FREE_FEATURE_LIST, PRO_FEATURE_LIST } from "@/lib/plan-features";
import PlanCard from "@/app/components/plan-card";
import PageTitle from "@/app/components/page-title";
import DeleteConfirmModal from "@/app/components/delete-confirm-modal";
import Button from "@/app/components/ui/button";
import Card from "@/app/components/ui/card";
import FormField, { inputClass } from "@/app/components/ui/form-field";

export default function SettingsClient({
  workspace,
  subscriptionStatus,
  hasPassword,
  usage,
}: {
  workspace: WorkspaceRow;
  subscriptionStatus: SubscriptionStatus;
  hasPassword: boolean;
  usage: { testimonials: number; forms: number; widgets: number };
}) {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState(workspace.name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [portalLoading, setPortalLoading] = useState(false);
  const plan = getEffectivePlan(subscriptionStatus);
  const limits = getPlanLimits(subscriptionStatus);

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
      <div className="mb-6 sm:mb-8"><PageTitle>設定</PageTitle></div>

      {/* Workspace name */}
      <Card className="mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
          ワークスペース
        </h3>
        <FormField label="ワークスペース名">
          <div className="flex gap-2 sm:gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`flex-1 ${inputClass}`}
            />
            <Button onClick={saveName} disabled={saving || !name.trim()}>
              {saved ? (<><Check size={14} />保存しました</>) : saving ? "保存中..." : "保存"}
            </Button>
          </div>
        </FormField>
      </Card>

      {/* Plan info */}
      <Card className="mb-4 sm:mb-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">利用状況</h3>
          {IS_BETA ? (
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 inline-flex items-center gap-1.5">
              <Crown size={14} />
              初期サポーター
            </span>
          ) : (
            <span className={`px-3 py-1 text-sm font-medium rounded-full inline-flex items-center gap-1.5 ${
              plan === "pro"
                ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                : "bg-foreground/5 text-foreground/60 border border-foreground/10"
            }`}>
              {plan === "pro" && <Crown size={14} />}
              {plan === "pro" ? "Proプラン" : "Freeプラン"}
            </span>
          )}
        </div>

        {IS_BETA ? (
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm font-medium text-indigo-700">
              初期サポーター特典が適用されています
            </p>
            <p className="text-[10px] sm:text-xs text-indigo-500 mt-1">
              正式リリース後も特別価格でご利用いただけます。
            </p>
          </div>
        ) : plan === "free" ? (
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 mb-3 sm:mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-indigo-700">
                Proプランでもっと活用しましょう
              </p>
              <p className="text-[10px] sm:text-xs text-indigo-500 mt-1">
                口コミの全件表示、ダッシュボード無制限閲覧、バッジ非表示
              </p>
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-upgrade-modal"))}
              className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap ml-3"
            >
              アップグレード
            </button>
          </div>
        ) : (
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2.5 sm:px-4 sm:py-3 mb-3 sm:mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-indigo-700">
                Proプランをご利用中です
              </p>
              <p className="text-[10px] sm:text-xs text-indigo-500 mt-1">
                すべての機能を制限なくご利用いただけます。
              </p>
            </div>
            <button
              onClick={async () => {
                setPortalLoading(true);
                try {
                  const res = await fetch("/api/stripe/portal", { method: "POST" });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                  else { alert("エラーが発生しました。"); setPortalLoading(false); }
                } catch {
                  alert("ネットワークエラーが発生しました。");
                  setPortalLoading(false);
                }
              }}
              disabled={portalLoading}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-indigo-600 border border-indigo-200 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap ml-3 inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <ExternalLink size={14} />
              {portalLoading ? "読み込み中..." : "プランを管理"}
            </button>
          </div>
        )}

        {/* Usage stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
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
      </Card>

      {/* Pro plan preview (beta only) */}
      {IS_BETA && (
        <Card className="mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
            正式リリース後のプラン
          </h3>
          <p className="text-xs sm:text-sm text-foreground/60 mb-4 sm:mb-5">
            現在ベータ版につき、全機能を無料でご利用いただけます。
            正式リリース後は以下のプランをご用意しています。初期サポーターの方には特別価格が適用されます。
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-5">
            <PlanCard plan="free" features={FREE_FEATURE_LIST} compact />
            <PlanCard plan="pro" features={PRO_FEATURE_LIST} compact />
          </div>
          <Button disabled className="w-full sm:w-auto">
            正式リリース後に利用可能
          </Button>
        </Card>
      )}

      {/* Password change (email users only) */}
      {hasPassword && (
        <Card className="mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
            パスワード変更
          </h3>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const passErr = validatePassword(newPassword);
              if (passErr) { setPasswordError(passErr); return; }
              const matchErr = validatePasswordMatch(newPassword, confirmNewPassword);
              if (matchErr) { setPasswordError(matchErr); return; }

              setPasswordSaving(true);
              setPasswordError(null);
              const { error } = await supabase.auth.updateUser({ password: newPassword });
              setPasswordSaving(false);
              if (error) {
                setPasswordError(error.message);
              } else {
                setPasswordSaved(true);
                setNewPassword("");
                setConfirmNewPassword("");
                setTimeout(() => setPasswordSaved(false), 2000);
              }
            }}
            className="space-y-3"
          >
            <FormField label="新しいパスワード">
              <input type="password" placeholder="8文字以上" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
            </FormField>
            <FormField label="新しいパスワード（確認）">
              <input type="password" placeholder="もう一度入力" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className={inputClass} />
            </FormField>
            {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
            <Button type="submit" disabled={passwordSaving || !newPassword}>
              {passwordSaved ? (<><Check size={14} />変更しました</>) : passwordSaving ? "変更中..." : "パスワードを変更"}
            </Button>
          </form>
        </Card>
      )}

      {/* Delete account */}
      <div className="mt-8 text-center">
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="text-xs text-red-500 hover:text-red-600 cursor-pointer"
        >
          アカウントを削除する
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          title="アカウントの削除"
          message="すべてのデータが完全に削除されます。この操作は取り消せません。"
          isDeleting={deleting}
          requiresCheckbox
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={async () => {
            setDeleting(true);
            try {
              const res = await fetch("/api/account", { method: "DELETE" });
              if (res.ok) {
                router.push("/");
              } else {
                alert("削除に失敗しました。もう一度お試しください。");
                setDeleting(false);
              }
            } catch {
              alert("ネットワークエラーが発生しました。もう一度お試しください。");
              setDeleting(false);
            }
          }}
        />
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
    <div className="bg-foreground/5 rounded-lg p-3 sm:p-4">
      <p className="text-xs sm:text-sm text-foreground/50 mb-1">{label}</p>
      <p className="text-base sm:text-xl font-bold text-foreground">
        {used}
        <span className="text-[10px] sm:text-sm font-normal text-foreground/40">
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
