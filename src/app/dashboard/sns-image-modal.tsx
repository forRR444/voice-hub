"use client";

import { useState, useEffect } from "react";
import { X, Download, Loader2 } from "lucide-react";
import {
  generateTestimonialImage,
  TEMPLATES,
  TemplateSize,
} from "@/lib/canvas-image-generator";
import { TestimonialWithTags } from "@/types/database";

const TEMPLATE_OPTIONS: { key: TemplateSize; label: string }[] = [
  { key: "instagram-story", label: "Instagram ストーリー" },
  { key: "instagram-post", label: "Instagram 投稿" },
  { key: "x-post", label: "X 投稿" },
];

export default function SnsImageModal({
  testimonial,
  brandColor,
  onClose,
}: {
  testimonial: TestimonialWithTags;
  brandColor: string;
  onClose: () => void;
}) {
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateSize>("instagram-story");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let revoked = false;
    let objectUrl: string | null = null;

    async function generate() {
      setGenerating(true);
      setPreviewUrl(null);

      try {
        const blob = await generateTestimonialImage(
          {
            rating: testimonial.rating,
            content: testimonial.content,
            name: testimonial.name,
            title: testimonial.title,
            company: testimonial.company ?? null,
            brandColor,
          },
          selectedTemplate
        );

        if (revoked) return;

        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      } finally {
        if (!revoked) setGenerating(false);
      }
    }

    generate();

    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedTemplate, testimonial, brandColor]);

  function handleDownload() {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `testimonial-${selectedTemplate}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-sm w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-foreground">
            SNS画像を作成
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-foreground/40 hover:text-foreground/60 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Template selector */}
        <div className="flex gap-2 mb-4">
          {TEMPLATE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSelectedTemplate(opt.key)}
              className={`flex-1 px-3 py-2 text-sm rounded-lg border cursor-pointer transition-colors ${
                selectedTemplate === opt.key
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-medium"
                  : "border-foreground/10 text-foreground/70 hover:bg-foreground/5"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Preview area */}
        <div className="flex items-center justify-center bg-foreground/5 rounded-lg mb-4 max-h-[400px] min-h-[200px] overflow-hidden">
          {generating ? (
            <Loader2 size={32} className="animate-spin text-foreground/30" />
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt="SNS画像プレビュー"
              className="object-contain max-h-[400px] w-full"
            />
          ) : null}
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={generating || !previewUrl}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
        >
          <Download size={16} />
          ダウンロード
        </button>
      </div>
    </div>
  );
}
