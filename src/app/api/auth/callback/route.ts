import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/utils";
import { getPostAuthRedirect } from "@/lib/auth-redirect";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const baseUrl = getBaseUrl();

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        return NextResponse.redirect(await getPostAuthRedirect(supabase, user, baseUrl));
      }

      return NextResponse.redirect(`${baseUrl}/dashboard`);
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?error=auth`);
}
