"use client";

import { useState, useEffect } from "react";
import { X, Crown } from "lucide-react";
import { IS_BETA } from "@/lib/plan";
import { FREE_FEATURE_LIST, PRO_FEATURE_LIST } from "@/lib/plan-features";
import PlanCard from "@/app/components/plan-card";

export default function UpgradeModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleOpen() { setOpen(true); }
    window.addEventListener("open-upgrade-modal", handleOpen);
    return () => window.removeEventListener("open-upgrade-modal", handleOpen);
  }, []);

  if (!open || IS_BETA) return null;

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("エラーが発生しました。もう一度お試しください。");
        setLoading(false);
      }
    } catch {
      alert("ネットワークエラーが発生しました。");
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setOpen(false)}>
      <div className="bg-[var(--plate)] rounded-t-xl sm:rounded-xl shadow-sm w-full max-w-2xl sm:mx-4 p-4 sm:p-8" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Crown size={20} className="text-[var(--brand)]" />
            <h3 className="text-lg font-bold text-[var(--ink)]">プランを選択</h3>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 text-[var(--muted)] hover:text-[var(--slate)] cursor-pointer"
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </div>

        {/* Plan comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <PlanCard plan="free" features={FREE_FEATURE_LIST} compact />
          <PlanCard
            plan="pro"
            features={PRO_FEATURE_LIST}
            compact
            cta={{
              label: loading ? "処理中..." : "Proプランにアップグレード",
              onClick: handleUpgrade,
              disabled: loading,
            }}
          />
        </div>

        <p className="text-xs text-[var(--slate)] text-center mt-4">
          いつでもキャンセル可能です。
        </p>
      </div>
    </div>
  );
}
