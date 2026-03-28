"use client";

import { createClient } from "@/lib/supabase/client";
import { validateEmail, validatePassword } from "@/lib/validation";
import { preserveTemplate, translateOAuthError } from "@/lib/auth-utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import GoogleOAuthButton from "@/app/components/google-oauth-button";
import AuthInput from "@/app/components/auth-input";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createClient();

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) { setError(emailErr); return; }
    const passErr = validatePassword(password);
    if (passErr) { setError(passErr); return; }

    setLoading("email");
    setError(null);
    preserveTemplate();

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("メールアドレスまたはパスワードが正しくありません");
      setLoading(null);
    } else {
      router.push("/dashboard");
    }
  }

  async function handleGoogleLogin() {
    setLoading("google");
    setError(null);
    preserveTemplate();

    const callbackUrl = new URL("/api/auth/callback", window.location.origin);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      setError(translateOAuthError(error.message));
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold text-foreground hover:opacity-80 transition-opacity">VoiceHub</Link>
          <div className="mt-4 flex gap-12 justify-center border-b border-foreground/10">
            <span className="pb-2 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600">
              ログイン
            </span>
            <Link href="/signup" className="pb-2 text-sm font-medium text-foreground/40 hover:text-foreground/60 transition-colors">
              新規登録
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          {/* Email/Password form */}
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <div>
              <AuthInput
                type="email"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <AuthInput
                type="password"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={!!loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              ログイン
            </button>
          </form>

          <div className="text-right">
            <Link href="/reset-password" className="text-xs text-indigo-600 hover:underline">
              パスワードを忘れた方
            </Link>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-foreground/10" />
            <span className="text-xs text-foreground/30">または</span>
            <div className="flex-1 border-t border-foreground/10" />
          </div>

          {/* Google login */}
          <GoogleOAuthButton
            onClick={handleGoogleLogin}
            loading={loading === "google"}
            label="Googleでログイン"
          />

          <p className="text-center text-xs text-foreground/40">
            クレジットカード不要
          </p>

          {error && (
            <p className="text-center text-xs text-red-500">{error}</p>
          )}
        </div>

        <div className="text-center space-y-2">
          <p className="text-sm text-foreground/60">
            アカウントをお持ちでない方は
            <Link href="/signup" className="text-indigo-600 hover:underline ml-1">新規登録</Link>
          </p>
          <p className="text-xs text-foreground/30">
            登録することで<Link href="/terms" className="text-indigo-600 hover:underline">利用規約</Link>と<Link href="/privacy" className="text-indigo-600 hover:underline">プライバシーポリシー</Link>に同意したものとみなされます
          </p>
        </div>
      </div>
    </div>
  );
}
