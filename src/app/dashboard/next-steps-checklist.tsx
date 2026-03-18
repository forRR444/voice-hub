"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, Copy, X, ExternalLink } from "lucide-react";
import { getBaseUrl } from "@/lib/utils";

interface NextStepsChecklistProps {
  formSlug: string | null;
  hasRealTestimonials: boolean;
  hasApprovedTestimonials: boolean;
  widgetCount: number;
}

const DISMISSED_KEY = "voicehub_checklist_dismissed";
const URL_COPIED_KEY = "voicehub_url_copied";

export default function NextStepsChecklist({
  formSlug,
  hasRealTestimonials,
  hasApprovedTestimonials,
  widgetCount,
}: NextStepsChecklistProps) {
  const [dismissed, setDismissed] = useState(true); // default hidden until hydrated
  const [urlCopied, setUrlCopied] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISSED_KEY) === "true");
    setUrlCopied(localStorage.getItem(URL_COPIED_KEY) === "true");
  }, []);

  const items = [
    { done: urlCopied, label: "フォームURLをコピーしてお客様に送る" },
    { done: hasRealTestimonials, label: "最初のお客様の声が届くのを待つ" },
    { done: hasApprovedTestimonials, label: "届いた声を承認する" },
    { done: widgetCount > 0, label: "ウィジェットを作成してウェブサイトに埋め込む" },
  ];

  const allDone = items.every((i) => i.done);

  if (dismissed || allDone) return null;

  function handleCopyUrl() {
    if (!formSlug) return;
    const url = `${getBaseUrl()}/form/${formSlug}`;
    navigator.clipboard.writeText(url);
    localStorage.setItem(URL_COPIED_KEY, "true");
    setUrlCopied(true);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 2000);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, "true");
    setDismissed(true);
  }

  return (
    <div className="bg-white rounded-lg border border-foreground/10 shadow-sm p-5 mb-8 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-foreground/30 hover:text-foreground/60 cursor-pointer"
        title="閉じる"
      >
        <X size={18} />
      </button>

      <h3 className="text-base font-semibold text-foreground mb-4">
        🚀 VoiceHubを始めましょう
      </h3>

      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-3">
            {item.done ? (
              <CheckCircle size={18} className="text-emerald-500 shrink-0" />
            ) : (
              <Circle size={18} className="text-foreground/20 shrink-0" />
            )}
            <span
              className={`text-sm ${
                item.done
                  ? "text-foreground/40 line-through"
                  : "text-foreground/70"
              }`}
            >
              {item.label}
            </span>

            {/* Action button for step 1: copy form URL */}
            {i === 0 && !item.done && formSlug && (
              <button
                onClick={handleCopyUrl}
                className="ml-auto flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                <Copy size={13} />
                {justCopied ? "コピーしました" : "URLをコピー"}
              </button>
            )}

            {/* Action button for step 4: create widget */}
            {i === 3 && !item.done && (
              <a
                href="/widgets/new"
                className="ml-auto flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700"
              >
                <ExternalLink size={13} />
                ウィジェット作成
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
