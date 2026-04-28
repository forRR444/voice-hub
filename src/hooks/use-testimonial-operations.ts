"use client";

import { useState, useCallback } from "react";
import type { TestimonialWithTags } from "@/types/database";

/**
 * testimonial のステータス更新・注目トグルのロジックを共通化するフック
 */
export function useTestimonialOperations(initial: TestimonialWithTags) {
  const [testimonial, setTestimonial] = useState(initial);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const updateStatus = useCallback(
    async (status: "pending" | "approved" | "rejected") => {
      setErrorMsg(null);
      const res = await fetch(`/api/testimonials/${testimonial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        setErrorMsg("ステータスの更新に失敗しました");
        return;
      }
      setTestimonial((prev) => ({ ...prev, status }));
    },
    [testimonial.id]
  );

  const toggleFeatured = useCallback(async () => {
    setErrorMsg(null);
    const val = !testimonial.is_featured;
    const res = await fetch(`/api/testimonials/${testimonial.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_featured: val }),
    });
    if (!res.ok) {
      setErrorMsg("おすすめ設定の更新に失敗しました");
      return;
    }
    setTestimonial((prev) => ({ ...prev, is_featured: val }));
  }, [testimonial.id, testimonial.is_featured]);

  return {
    testimonial,
    setTestimonial,
    errorMsg,
    setErrorMsg,
    updateStatus,
    toggleFeatured,
  };
}
