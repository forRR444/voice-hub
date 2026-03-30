"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type TryReview = {
  content: string;
  rating: number;
  publishTime: string;
  sourceId?: string;
};

type TryData = {
  workspaceName?: string;
  googleReviews?: TryReview[];
};

export default function TryDataDetector({
  workspaceId,
}: {
  workspaceId: string;
}) {
  useEffect(() => {
    const raw = localStorage.getItem("voicehub_try_data");
    if (!raw) return;
    localStorage.removeItem("voicehub_try_data");

    try {
      const parsed: TryData = JSON.parse(raw);
      if (!parsed.googleReviews?.length) return;

      const supabase = createClient();
      supabase
        .from("testimonials")
        .upsert(
          parsed.googleReviews.map((r) => ({
            workspace_id: workspaceId,
            form_id: null,
            name: "Googleユーザー",
            content: r.content,
            rating: r.rating,
            avatar_url: null,
            status: "approved",
            source: "google",
            source_id: r.sourceId ?? null,
            is_featured: false,
            permission_granted: true,
            submitted_at: r.publishTime,
          })),
          { onConflict: "workspace_id,source_id", ignoreDuplicates: true }
        )
        .then(() => {
          window.location.reload();
        });
    } catch {
      // invalid JSON
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
