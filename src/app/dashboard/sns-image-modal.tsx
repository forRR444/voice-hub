"use client";

import { Download } from "lucide-react";
import { TestimonialWithTags } from "@/types/database";
import Modal from "@/app/components/modal";
import SnsImagePreview from "@/app/components/sns-image-preview";

export default function SnsImageModal({
  testimonial,
  brandColor,
  onClose,
}: {
  testimonial: TestimonialWithTags;
  brandColor: string;
  onClose: () => void;
}) {
  return (
    <Modal title="SNS画像を作成" onClose={onClose}>
      <SnsImagePreview
        testimonial={testimonial}
        brandColor={brandColor}
        footer={({ previewUrl, generating, selectedTemplate }) => {
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
            <button
              onClick={handleDownload}
              disabled={generating || !previewUrl}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              <Download size={16} />
              ダウンロード
            </button>
          );
        }}
      />
    </Modal>
  );
}
