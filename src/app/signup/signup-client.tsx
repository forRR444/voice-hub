"use client";

import { createClient } from "@/lib/supabase/client";
import { validateEmail, validatePassword, validatePasswordMatch } from "@/lib/validation";
import { preserveTemplate } from "@/lib/auth-utils";
import { useGoogleOAuth } from "@/hooks/use-google-oauth";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import GoogleOAuthButton from "@/app/components/google-oauth-button";
import AuthInput from "@/app/components/auth-input";

export default function SignupClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const supabase = createClient();
  const { handleGoogleLogin } = useGoogleOAuth({ setLoading, setError });

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) { setError(emailErr); return; }
    const passErr = validatePassword(password);
    if (passErr) { setError(passErr); return; }
    const matchErr = validatePasswordMatch(password, confirmPassword);
    if (matchErr) { setError(matchErr); return; }

    setLoading("email");
    setError(null);
    preserveTemplate();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/confirm`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(null);
    } else {
      setEmailSent(true);
      setLoading(null);
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">メールを確認してください</h1>
            <p className="mt-3 text-sm text-foreground/60">
              <span className="font-medium text-foreground">{email}</span> に確認メールを送信しました。
              メール内のリンクをクリックして登録を完了してください。
            </p>
          </div>
          <p className="text-xs text-foreground/40">
            メールが届かない場合は、迷惑メールフォルダをご確認ください。
          </p>
          <Link href="/login" className="inline-block text-sm text-indigo-600 hover:underline">
            ログインページに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold text-foreground hover:opacity-80 transition-opacity">VoiceHub</Link>
          <div className="mt-4 flex gap-12 justify-center border-b border-foreground/10">
            <Link href="/login" className="pb-2 text-sm font-medium text-foreground/40 hover:text-foreground/60 transition-colors">
              ログイン
            </Link>
            <span className="pb-2 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600">
              新規登録
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Email/Password signup form */}
          <form onSubmit={handleSignup} className="space-y-3">
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
                placeholder="パスワード（8文字以上）"
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <AuthInput
                type="password"
                placeholder="パスワード（確認）"
                value={confirmPassword}
                autoComplete="new-password"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={!!loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading === "email" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              無料で登録
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-foreground/10" />
            <span className="text-xs text-foreground/30">または</span>
            <div className="flex-1 border-t border-foreground/10" />
          </div>

          {/* Google signup */}
          <GoogleOAuthButton
            onClick={handleGoogleLogin}
            loading={loading === "google"}
            label="Googleで登録"
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
            すでにアカウントをお持ちの方は
            <Link href="/login" className="text-indigo-600 hover:underline ml-1">ログイン</Link>
          </p>
          <p className="text-xs text-foreground/30">
            登録することで<Link href="/terms" className="text-indigo-600 hover:underline">利用規約</Link>と<Link href="/privacy" className="text-indigo-600 hover:underline">プライバシーポリシー</Link>に同意したものとみなされます
          </p>
        </div>
      </div>
    </div>
  );
}
