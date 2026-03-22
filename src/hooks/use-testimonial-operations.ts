"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TestimonialWithTags } from "@/types/database";

/**
 * testimonial のステータス更新・注目トグルのロジックを共通化するフック
 */
export function useTestimonialOperations(initial: TestimonialWithTags) {
  const supabase = createClient();
  const [testimonial, setTestimonial] = useState(initial);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const updateStatus = useCallback(
    async (status: "pending" | "approved" | "rejected") => {
      setErrorMsg(null);
      const { error } = await supabase
        .from("testimonials")
        .update({ status })
        .eq("id", testimonial.id);
      if (error) {
        setErrorMsg("ステータスの更新に失敗しました");
        return;
      }
      setTestimonial((prev) => ({ ...prev, status }));
    },
    [supabase, testimonial.id],
  );

  const toggleFeatured = useCallback(async () => {
    setErrorMsg(null);
    const val = !testimonial.is_featured;
    const { error } = await supabase
      .from("testimonials")
      .update({ is_featured: val })
      .eq("id", testimonial.id);
    if (error) {
      setErrorMsg("おすすめ設定の更新に失敗しました");
      return;
    }
    setTestimonial((prev) => ({ ...prev, is_featured: val }));
  }, [supabase, testimonial.id, testimonial.is_featured]);

  return {
    testimonial,
    setTestimonial,
    errorMsg,
    setErrorMsg,
    updateStatus,
    toggleFeatured,
  };
}
