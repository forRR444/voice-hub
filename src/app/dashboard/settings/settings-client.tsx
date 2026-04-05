"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Crown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validatePassword, validatePasswordMatch } from "@/lib/validation";
import { WorkspaceRow, PLAN_LIMITS } from "@/types/database";

export default function SettingsClient({
  workspace,
  subscriptionStatus,
  hasPassword,
  usage,
}: {
  workspace: WorkspaceRow;
  subscriptionStatus: string;
  hasPassword: boolean;
  usage: { testimonials: number; forms: number; widgets: number };
}) {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState(workspace.name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const plan = subscriptionStatus === "pro" ? "pro" : "free";
  const limits = PLAN_LIMITS[plan];

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
      <section className="bg-white rounded-lg border border-foreground/10 shadow-sm p-6 mb-6">
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
      <section className="bg-white rounded-lg border border-foreground/10 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">利用状況</h3>
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 inline-flex items-center gap-1.5">
            <Crown size={14} />
            初期サポーター
          </span>
        </div>
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3 mb-4">
          <p className="text-sm font-medium text-indigo-700">
            先着10名の初期サポーター特典が適用されています
          </p>
          <p className="text-xs text-indigo-500 mt-1">
            正式リリース後も、すべての機能をずっと無料でご利用いただけます。
          </p>
        </div>

        {/* Usage stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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
      </section>

      {/* Password change (email users only) */}
      {hasPassword && (
        <section className="bg-white rounded-lg border border-foreground/10 shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
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
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1">
                新しいパスワード
              </label>
              <input
                type="password"
                placeholder="8文字以上"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1">
                新しいパスワード（確認）
              </label>
              <input
                type="password"
                placeholder="もう一度入力"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {passwordError && (
              <p className="text-xs text-red-500">{passwordError}</p>
            )}
            <button
              type="submit"
              disabled={passwordSaving || !newPassword}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              {passwordSaved ? (
                <>
                  <Check size={14} />
                  変更しました
                </>
              ) : passwordSaving ? (
                "変更中..."
              ) : (
                "パスワードを変更"
              )}
            </button>
          </form>
        </section>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              アカウントの削除
            </h3>
            <p className="text-sm text-foreground/60 mb-4">
              すべてのデータが完全に削除されます。この操作は取り消せません。
            </p>
            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteConfirmed}
                onChange={(e) => setDeleteConfirmed(e.target.checked)}
                className="w-4 h-4 accent-red-500 cursor-pointer"
              />
              <span className="text-sm text-foreground/70">理解した上で削除します</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmed(false);
                }}
                className="flex-1 px-4 py-2 text-sm border border-foreground/10 rounded-lg hover:bg-foreground/5 cursor-pointer"
              >
                キャンセル
              </button>
              <button
                onClick={async () => {
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
                disabled={!deleteConfirmed || deleting}
                className="flex-1 px-4 py-2 text-sm text-red-500 border border-foreground/10 rounded-lg hover:bg-foreground/5 disabled:opacity-30 cursor-pointer"
              >
                {deleting ? "削除中..." : "削除する"}
              </button>
            </div>
          </div>
        </div>
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
