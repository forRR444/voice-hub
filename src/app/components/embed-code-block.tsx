"use client";

import { Copy, Check } from "lucide-react";

type EmbedCodeBlockProps = {
  label: string;
  description?: string;
  code: string;
  copied: boolean;
  onCopy: () => void;
  variant?: "default" | "card";
};

export default function EmbedCodeBlock({
  label,
  description,
  code,
  copied,
  onCopy,
  variant = "default",
}: EmbedCodeBlockProps) {
  if (variant === "card") {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500">
            {label}
            {description && <span className="font-normal text-gray-400 ml-2">{description}</span>}
          </span>
          <button
            onClick={onCopy}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer"
          >
            {copied ? <><Check size={12} />コピーしました</> : <><Copy size={12} />コピー</>}
          </button>
        </div>
        <pre className="text-xs text-gray-700 whitespace-pre-wrap break-all font-mono leading-relaxed">
          {code}
        </pre>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-1">
        <span className="text-xs font-medium text-foreground/50">
          {label}
          {description && <span className="hidden sm:inline font-normal text-foreground/30 ml-2">{description}</span>}
        </span>
        <button
          onClick={onCopy}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer"
        >
          {copied ? <><Check size={12} />コピーしました</> : <><Copy size={12} />コピー</>}
        </button>
      </div>
      <pre className="bg-foreground/5 text-foreground/70 text-xs p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );
}
