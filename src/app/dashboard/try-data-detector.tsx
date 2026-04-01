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
    (async () => {
    const raw = localStorage.getItem("voicehub_try_data");
    if (!raw) return;
    localStorage.removeItem("voicehub_try_data");

    try {
      const parsed: TryData = JSON.parse(raw);
      if (!parsed.googleReviews?.length) return;

      const supabase = createClient();
      const rows = parsed.googleReviews.map((r) => ({
        workspace_id: workspaceId,
        form_id: null,
        name: "Googleユーザー",
        content: r.content,
        rating: r.rating,
        avatar_url: null,
        status: "approved" as const,
        source: "google",
        source_id: r.sourceId ?? null,
        is_featured: false,
        permission_granted: true,
        submitted_at: r.publishTime,
      }));

      const sourceIds = rows.map((r) => r.source_id).filter(Boolean);
      const { data: existing } = sourceIds.length > 0
        ? await supabase
            .from("testimonials")
            .select("source_id")
            .eq("workspace_id", workspaceId)
            .in("source_id", sourceIds)
        : { data: [] };

      const existingIds = new Set((existing ?? []).map((e: { source_id: string }) => e.source_id));
      const newRows = rows.filter((r) => !r.source_id || !existingIds.has(r.source_id));

      if (newRows.length > 0) {
        await supabase.from("testimonials").insert(newRows);
      }
      window.location.reload();
    } catch {
      // invalid JSON
    }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
