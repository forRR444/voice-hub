import type { SupabaseClient, User } from "@supabase/supabase-js";

/**
 * 認証完了後にユーザーを送るべきURLを決定する。
 * onboarding 未完了なら /onboarding、それ以外は /dashboard。
 */
export async function getPostAuthRedirect(
  supabase: SupabaseClient,
  user: User,
  baseUrl: string
): Promise<string> {
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("onboarding_completed")
    .eq("user_id", user.id)
    .single();
  if (!workspace || !workspace.onboarding_completed) {
    return `${baseUrl}/onboarding`;
  }
  return `${baseUrl}/dashboard`;
}
