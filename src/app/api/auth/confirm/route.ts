import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/utils";
import { getPostAuthRedirect } from "@/lib/auth-redirect";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const baseUrl = getBaseUrl();

  const supabase = await createClient();

  // PKCE flow: Supabase redirects with a code parameter
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      // Check if this is a recovery flow
      if (type === "recovery") {
        return NextResponse.redirect(`${baseUrl}/update-password`);
      }

      if (user) {
        return NextResponse.redirect(await getPostAuthRedirect(supabase, user, baseUrl));
      }

      return NextResponse.redirect(`${baseUrl}/dashboard`);
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
        return NextResponse.redirect(`${baseUrl}/update-password`);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return NextResponse.redirect(await getPostAuthRedirect(supabase, user, baseUrl));
      }

      return NextResponse.redirect(`${baseUrl}/dashboard`);
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?error=auth`);
}
