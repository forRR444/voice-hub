"use client";

import BulletItem from "@/app/components/ui/bullet-item";

type PlanCardProps = {
  plan: "free" | "pro";
  features: string[];
  cta?: {
    label: string;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
  };
  note?: string;
  compact?: boolean;
};

export default function PlanCard({ plan, features, cta, note, compact }: PlanCardProps) {
  const isFree = plan === "free";
  const p = compact ? "p-4 sm:p-6" : "p-4 sm:p-8";
  const priceSize = compact ? "text-xl sm:text-3xl" : "text-2xl sm:text-4xl";
  const descMargin = compact ? "mt-1 mb-3 sm:mb-4" : "mt-1 mb-4 sm:mb-6";
  const ctaMargin = compact ? "mt-4 sm:mt-6" : "mt-6 sm:mt-8";

  return (
    <div
      className={`bg-white rounded-xl ${p} text-left relative ${
        isFree
          ? "border border-[var(--foreground)]/10 shadow-sm"
          : "border-2 border-[var(--brand)] shadow-ambient"
      }`}
    >
      {!isFree && (
        <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 bg-[var(--brand)] text-white text-[10px] sm:text-xs font-semibold rounded-full">
          おすすめ
        </span>
      )}
      <p
        className={`text-sm font-semibold mb-1 ${isFree ? "text-[var(--slate)]" : "text-[var(--brand)]"}`}
      >
        {isFree ? "Freeプラン" : "Proプラン"}
      </p>
      <p className={`${priceSize} font-bold text-[var(--ink)] tabular-nums`}>
        {isFree ? "¥0" : "¥1,980"}
        <span className="text-sm font-normal text-[var(--slate)]">/月{!isFree && "（税込）"}</span>
      </p>
      <p className={`text-xs sm:text-sm text-[var(--slate)] ${descMargin}`}>
        {isFree ? "まずはお試しください" : "本格運用に"}
      </p>
      <ul className="space-y-2 sm:space-y-3">
        {features.map((item, i) => (
          <BulletItem key={i} className="text-xs sm:text-sm text-[var(--ink)]">
            {item}
          </BulletItem>
        ))}
      </ul>
      {cta && (
        <>
          {cta.href ? (
            <a
              href={cta.href}
              className={`${ctaMargin} block w-full text-center inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition px-6 py-3 sm:py-3.5 text-xs sm:text-base ${"bg-[var(--brand)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:brightness-110"} ${cta.disabled ? "opacity-50 pointer-events-none" : ""}`}
            >
              {cta.label}
            </a>
          ) : (
            <button
              onClick={cta.onClick}
              disabled={cta.disabled}
              className={`${ctaMargin} block w-full text-center font-semibold rounded-lg transition px-6 py-3 sm:py-3.5 text-xs sm:text-base cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${"bg-[var(--brand)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:brightness-110"}`}
            >
              {cta.label}
            </button>
          )}
          {note && <p className="mt-3 text-xs text-[var(--slate)] text-center">{note}</p>}
        </>
      )}
    </div>
  );
}
