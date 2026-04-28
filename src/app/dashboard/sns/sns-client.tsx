"use client";

import { useState } from "react";
import { ImageIcon, Download, Loader2, Check, Maximize2 } from "lucide-react";
import { TestimonialWithTags } from "@/types/database";
import { generateTestimonialImage, TemplateSize } from "@/lib/canvas-image-generator";
import Modal from "@/app/components/modal";
import { formatDate } from "@/lib/utils";
import PageTitle from "@/app/components/page-title";
import CustomSelect from "@/app/components/custom-select";
import StarRating from "@/app/components/ui/star-rating";
import SnsImagePreview from "@/app/components/sns-image-preview";
import { SNS_TEMPLATE_OPTIONS } from "@/lib/constants";
import EmptyState from "@/app/components/ui/empty-state";
import JSZip from "jszip";

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
          <PageTitle>SNS画像を作成</PageTitle>
          <p className="text-sm text-foreground/50 mt-1">
            口コミを選んでInstagramやX用の画像を生成できます
          </p>
        </div>
      </div>

      {testimonials.length === 0 ? (
        <EmptyState
          card
          icon={<ImageIcon size={32} />}
          message="承認済みの口コミがありません"
          description="口コミが届いて承認すると、ここからSNS画像を作成できます"
        />
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={toggleAll}
                className="text-xs text-foreground/50 hover:text-foreground/80 cursor-pointer whitespace-nowrap"
              >
                {selectedIds.size === testimonials.length ? "選択を解除" : "すべて選択"}
              </button>
              {selectedIds.size > 0 && (
                <span className="text-xs text-indigo-600 font-medium whitespace-nowrap">
                  {selectedIds.size}件選択中
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <CustomSelect
                value={template}
                onChange={(v) => setTemplate(v as TemplateSize)}
                options={SNS_TEMPLATE_OPTIONS.map((o) => ({ value: o.key, label: o.label }))}
              />
              <button
                onClick={handleBulkDownload}
                disabled={selectedIds.size === 0 || generating}
                className="flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {generating ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span className="hidden sm:inline">生成中...</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span className="hidden sm:inline">一括ダウンロード</span>
                  </>
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
                    isSelected
                      ? "border-foreground/20 bg-foreground/[0.02]"
                      : "border-foreground/10 hover:border-foreground/20"
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
                        <span className="text-sm sm:text-base font-semibold text-foreground">
                          {t.name || "お客様"}
                        </span>
                        <span className="text-[10px] text-foreground/25">
                          {formatDate(t.submitted_at)}
                        </span>
                      </div>
                      {t.rating != null && (
                        <StarRating rating={t.rating!} size={14} className="mb-1" />
                      )}
                      <p className="text-xs sm:text-sm text-foreground/50 line-clamp-2 leading-relaxed">
                        {t.content}
                      </p>
                    </div>

                    {/* Individual button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSingleTarget(t);
                      }}
                      className="shrink-0 p-2 rounded-lg text-foreground/40 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      title="プレビュー"
                    >
                      <Maximize2 size={16} />
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

function PreviewModal({
  testimonial,
  brandColor,
  initialTemplate,
  onClose,
}: {
  testimonial: TestimonialWithTags;
  brandColor: string;
  initialTemplate: TemplateSize;
  onClose: () => void;
}) {
  return (
    <Modal title="プレビュー" onClose={onClose}>
      <SnsImagePreview
        testimonial={testimonial}
        brandColor={brandColor}
        initialTemplate={initialTemplate}
      />
    </Modal>
  );
}
