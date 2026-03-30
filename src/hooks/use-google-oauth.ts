import { createClient } from "@/lib/supabase/client";
import { preserveTemplate, translateOAuthError } from "@/lib/auth-utils";

export function useGoogleOAuth({
  setLoading,
  setError,
}: {
  setLoading: (v: "email" | "google" | null) => void;
  setError: (v: string | null) => void;
}) {
  async function handleGoogleLogin() {
    setLoading("google");
    setError(null);
    preserveTemplate();

    const supabase = createClient();
    const callbackUrl = new URL("/api/auth/callback", window.location.origin);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl.toString() },
    });

    if (error) {
      setError(translateOAuthError(error.message));
      setLoading(null);
    }
  }

  return { handleGoogleLogin };
}
