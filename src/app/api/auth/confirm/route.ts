import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");

  const supabase = await createClient();

  // PKCE flow: Supabase redirects with a code parameter
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      // Check if this is a recovery flow
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/update-password`);
      }

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

  // Legacy flow: token_hash parameter
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/update-password`);
      }

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
