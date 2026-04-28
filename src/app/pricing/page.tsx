import type { Metadata } from "next";
import PublicHeader from "@/app/components/public-header";
import PlanCard from "@/app/components/plan-card";
import { FREE_FEATURE_LIST, PRO_FEATURE_LIST } from "@/lib/plan-features";
import { IS_BETA } from "@/lib/plan";

export const metadata: Metadata = {
  title: "料金プラン | VoiceHub",
  description: "VoiceHubの料金プラン。FreeプランとProプランの比較。",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--canvas)]">
      <PublicHeader />

      <main className="max-w-4xl mx-auto px-6 py-16 sm:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <h1
            className="text-2xl sm:text-4xl font-bold text-[var(--ink)] mb-4"
            style={{ letterSpacing: "-0.022em" }}
          >
            シンプルな料金プラン
          </h1>
          {IS_BETA ? (
            <>
              <p className="text-sm sm:text-lg text-[var(--slate)]">
                現在ベータ版につき、全機能を無料で使えます。
              </p>
              <p className="text-sm font-medium text-[var(--brand)] mt-2">
                ベータユーザーには正式リリース後も特別価格を適用します。
              </p>
            </>
          ) : (
            <p className="text-sm sm:text-lg text-[var(--slate)]">
              あなたのビジネスに合ったプランをお選びください。
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
          <PlanCard
            plan="free"
            features={FREE_FEATURE_LIST}
            cta={{ label: "無料で始める", href: "/try" }}
            note="クレジットカード不要"
          />
          <PlanCard
            plan="pro"
            features={PRO_FEATURE_LIST}
            cta={
              IS_BETA
                ? { label: "無料で始める", href: "/try" }
                : { label: "Proプランを始める", href: "/signup" }
            }
            note={IS_BETA ? "ベータ中は全機能無料" : "いつでもキャンセル可能"}
          />
        </div>

        <div className="text-center mt-12 text-sm text-[var(--slate)]">
          {IS_BETA ? (
            <p>いつでもキャンセル可能 · ベータ期間中は全機能無料でご利用いただけます</p>
          ) : (
            <p>いつでもキャンセル可能</p>
          )}
        </div>
      </main>
    </div>
  );
}
