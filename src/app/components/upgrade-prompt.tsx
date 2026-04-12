"use client";

import { Crown } from "lucide-react";
import { IS_BETA } from "@/lib/plan";

export default function UpgradePrompt({
  message,
}: {
  message: string;
}) {
  if (IS_BETA) return null;

  return (
    <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-2">
        <Crown size={16} className="shrink-0" />
        <span>{message}</span>
      </div>
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("open-upgrade-modal"))}
        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 cursor-pointer whitespace-nowrap"
      >
        Proプランにアップグレード →
      </button>
    </div>
  );
}
