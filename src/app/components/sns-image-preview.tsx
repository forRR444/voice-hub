"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  generateTestimonialImage,
  TemplateSize,
} from "@/lib/canvas-image-generator";
import { TestimonialWithTags } from "@/types/database";
import { SNS_TEMPLATE_OPTIONS } from "@/lib/constants";

type SnsImagePreviewProps = {
  testimonial: TestimonialWithTags;
  brandColor: string;
  initialTemplate?: TemplateSize;
  footer?: (opts: { previewUrl: string | null; generating: boolean; selectedTemplate: TemplateSize }) => React.ReactNode;
};

export default function SnsImagePreview({
  testimonial,
  brandColor,
  initialTemplate = "instagram-story",
  footer,
}: SnsImagePreviewProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateSize>(initialTemplate);
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
            name: testimonial.name || "お客様",
            title: testimonial.title,
            company: testimonial.company ?? null,
            brandColor,
          },
          selectedTemplate,
          "warm"
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

  return (
    <>
      {/* Template selector */}
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-2 mb-4">
        {SNS_TEMPLATE_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSelectedTemplate(opt.key)}
            className={`flex-1 px-4 py-3 text-base rounded-lg border cursor-pointer transition-colors ${
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
      <div className={`flex items-center justify-center bg-foreground/5 rounded-lg max-h-[250px] sm:max-h-[400px] min-h-[150px] sm:min-h-[200px] overflow-hidden${footer ? " mb-4" : ""}`}>
        {generating ? (
          <Loader2 size={32} className="animate-spin text-foreground/30" />
        ) : previewUrl ? (
          <img
            src={previewUrl}
            alt="SNS画像プレビュー"
            className="object-contain max-h-[250px] sm:max-h-[400px] w-full"
          />
        ) : null}
      </div>

      {footer?.({ previewUrl, generating, selectedTemplate })}
    </>
  );
}
