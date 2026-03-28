import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Password reset: redirect to update password page
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/update-password`);
      }

      // Email verification (signup): check onboarding status
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: workspace } = await supabase
          .from("workspaces")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .single();

        if (!workspace || !workspace.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
