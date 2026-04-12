import type { PickedReview } from "@/app/components/google-reviews-picker";

type GoogleReviewRow = {
  workspace_id: string;
  form_id: null;
  name: string;
  content: string;
  rating: number;
  avatar_url: null;
  status: "pending" | "approved";
  source: string;
  source_id?: string;
  is_featured: boolean;
  permission_granted: boolean;
  submitted_at: string;
};

export function mapGoogleReviewsToRows(
  reviews: PickedReview[],
  workspaceId: string,
  options: { status?: "pending" | "approved"; includeSourceId?: boolean } = {}
): GoogleReviewRow[] {
  const { status = "pending", includeSourceId = false } = options;
  return reviews.map((r) => ({
    workspace_id: workspaceId,
    form_id: null,
    name: "Googleユーザー",
    content: r.content,
    rating: r.rating,
    avatar_url: null,
    status,
    source: "google",
    ...(includeSourceId ? { source_id: r.googleId } : {}),
    is_featured: false,
    permission_granted: true,
    submitted_at: r.publishTime,
  }));
}
