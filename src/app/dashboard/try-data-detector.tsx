"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type TryData = {
  workspaceName?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  googleReviews?: any[];
};

export default function TryDataDetector({
  workspaceId,
}: {
  workspaceId: string;
  existingForm?: { id: string; brand_color: string; questions: unknown[] };
}) {
  useEffect(() => {
    const raw = localStorage.getItem("voicehub_try_data");
    if (!raw) return;
    localStorage.removeItem("voicehub_try_data");

    try {
      const parsed: TryData = JSON.parse(raw);
      if (!parsed.googleReviews?.length) return;

      const supabase = createClient();
      supabase.from("testimonials").insert(
        parsed.googleReviews.map((r) => ({
          workspace_id: workspaceId,
          form_id: null,
          name: r.name,
          content: r.content,
          rating: r.rating,
          avatar_url: r.photoUri || null,
          status: "approved",
          source: "google",
          is_featured: false,
          permission_granted: true,
          submitted_at: r.publishTime,
        }))
      ).then(() => {
        window.location.reload();
      });
    } catch {
      // invalid JSON
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
