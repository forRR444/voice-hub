import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/utils";

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
        const { data: workspaces } = await supabase
          .from("workspaces")
          .select("onboarding_completed")
          .eq("user_id", user.id);

        const workspace = workspaces?.[0] ?? null;

        if (!workspace || !workspace.onboarding_completed) {
          return NextResponse.redirect(`${baseUrl}/onboarding`);
        }

        return NextResponse.redirect(`${baseUrl}/dashboard`);
      }

      return NextResponse.redirect(`${baseUrl}/dashboard`);
    }
  }

  return NextResponse.redirect(`${baseUrl}/login?error=auth`);
}
