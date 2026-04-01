"use client";

import { useState, useEffect } from "react";
import { Star, ImageIcon, Download, Loader2, Check, X, Eye } from "lucide-react";
import { TestimonialWithTags } from "@/types/database";
import { generateTestimonialImage, TemplateSize } from "@/lib/canvas-image-generator";
import { formatDate } from "@/lib/utils";
import JSZip from "jszip";

const TEMPLATE_OPTIONS: { key: TemplateSize; label: string }[] = [
  { key: "instagram-story", label: "Instagram ストーリー" },
  { key: "instagram-post", label: "Instagram 投稿" },
  { key: "x-post", label: "X 投稿" },
];

export default function SnsClient({
  testimonials,
  brandColor,
}: {
  testimonials: TestimonialWithTags[];
  brandColor: string;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [template, setTemplate] = useState<TemplateSize>("instagram-story");
  const [generating, setGenerating] = useState(false);
  const [singleTarget, setSingleTarget] = useState<TestimonialWithTags | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === testimonials.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(testimonials.map((t) => t.id)));
    }
  };

  async function handleBulkDownload() {
    const selected = testimonials.filter((t) => selectedIds.has(t.id));
    if (selected.length === 0) return;

    setGenerating(true);
    try {
      const zip = new JSZip();

      for (let i = 0; i < selected.length; i++) {
        const t = selected[i];
        const blob = await generateTestimonialImage(
          {
            rating: t.rating,
            content: t.content,
            name: t.name || "お客様",
            title: t.title,
            company: t.company ?? null,
            brandColor,
          },
          template,
          "warm"
        );
        const name = `${(t.name || "お客様").replace(/[/\\?%*:|"<>]/g, "_")}_${i + 1}.png`;
        zip.file(name, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sns-images-${template}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 md:mb-10">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">SNS画像を作成</h2>
          <p className="text-sm text-foreground/50 mt-1">口コミを選んでInstagramやX用の画像を生成できます</p>
        </div>
      </div>

      {testimonials.length === 0 ? (
        <div className="bg-white rounded-lg border border-foreground/10 shadow-sm text-center py-16">
          <ImageIcon size={32} className="mx-auto text-foreground/20 mb-3" />
          <p className="text-sm text-foreground/50">承認済みの口コミがありません</p>
          <p className="text-xs text-foreground/30 mt-1">口コミが届いて承認すると、ここからSNS画像を作成できます</p>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleAll}
                className="text-xs text-foreground/50 hover:text-foreground/80 cursor-pointer"
              >
                {selectedIds.size === testimonials.length ? "選択を解除" : "すべて選択"}
              </button>
              {selectedIds.size > 0 && (
                <span className="text-xs text-indigo-600 font-medium">{selectedIds.size}件選択中</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value as TemplateSize)}
                className="text-sm border border-foreground/10 rounded-lg px-3 py-1.5 bg-white cursor-pointer"
              >
                {TEMPLATE_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
              <button
                onClick={handleBulkDownload}
                disabled={selectedIds.size === 0 || generating}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {generating ? (
                  <><Loader2 size={14} className="animate-spin" />生成中...</>
                ) : (
                  <><Download size={14} />一括ダウンロード</>
                )}
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex flex-col gap-3">
            {testimonials.map((t) => {
              const isSelected = selectedIds.has(t.id);
              return (
                <div
                  key={t.id}
                  onClick={() => toggleSelect(t.id)}
                  className={`bg-white rounded-lg border shadow-sm p-4 sm:p-5 transition-colors cursor-pointer ${
                    isSelected ? "border-indigo-300 bg-indigo-50/30" : "border-foreground/10 hover:border-foreground/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <div
                      className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? "bg-indigo-600 border-indigo-600" : "border-foreground/20"
                      }`}
                    >
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-1.5">
                        <span className="text-sm sm:text-base font-semibold text-foreground">{t.name || "お客様"}</span>
                        <span className="text-[10px] text-foreground/25">{formatDate(t.submitted_at)}</span>
                      </div>
                      {t.rating != null && (
                        <div className="flex gap-0.5 mb-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i < t.rating! ? "fill-amber-400 text-amber-400" : "text-foreground/20"}
                            />
                          ))}
                        </div>
                      )}
                      <p className="text-xs sm:text-sm text-foreground/50 line-clamp-2 leading-relaxed">
                        {t.content}
                      </p>
                    </div>

                    {/* Individual button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setSingleTarget(t); }}
                      className="shrink-0 p-2 rounded-lg text-foreground/40 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="プレビュー"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Preview modal */}
      {singleTarget && (
        <PreviewModal
          testimonial={singleTarget}
          brandColor={brandColor}
          initialTemplate={template}
          onClose={() => setSingleTarget(null)}
        />
      )}
    </div>
  );
}

function PreviewModal({ testimonial, brandColor, initialTemplate, onClose }: {
  testimonial: TestimonialWithTags;
  brandColor: string;
  initialTemplate: TemplateSize;
  onClose: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentTemplate, setCurrentTemplate] = useState<TemplateSize>(initialTemplate);

  useEffect(() => {
    let revoked = false;
    setPreviewUrl(null);
    generateTestimonialImage(
      {
        rating: testimonial.rating,
        content: testimonial.content,
        name: testimonial.name || "お客様",
        title: testimonial.title,
        company: testimonial.company ?? null,
        brandColor,
      },
      currentTemplate,
      "warm"
    ).then((blob) => {
      if (revoked) return;
      setPreviewUrl(URL.createObjectURL(blob));
    });
    return () => { revoked = true; };
  }, [testimonial, brandColor, currentTemplate]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="relative max-w-sm mx-4 flex flex-col items-center gap-3" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-lg text-foreground/60 hover:text-foreground cursor-pointer z-10">
          <X size={16} />
        </button>
        {previewUrl ? (
          <img src={previewUrl} alt="プレビュー" className="rounded-lg shadow-xl max-h-[70vh] w-auto" />
        ) : (
          <div className="bg-white rounded-lg p-16 flex items-center justify-center">
            <Loader2 size={24} className="animate-spin text-foreground/30" />
          </div>
        )}
        <div className="flex gap-1 bg-white/90 backdrop-blur rounded-lg p-1">
          {TEMPLATE_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => setCurrentTemplate(o.key)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors cursor-pointer ${
                currentTemplate === o.key
                  ? "bg-indigo-600 text-white"
                  : "text-foreground/60 hover:bg-foreground/5"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
