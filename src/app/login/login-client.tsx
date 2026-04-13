"use client";

import { createClient } from "@/lib/supabase/client";
import { validateEmail, validatePassword } from "@/lib/validation";
import { preserveTemplate } from "@/lib/auth-utils";
import { useGoogleOAuth } from "@/hooks/use-google-oauth";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import GoogleOAuthButton from "@/app/components/google-oauth-button";
import AuthInput from "@/app/components/auth-input";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const router = useRouter();

  const supabase = createClient();
  const { handleGoogleLogin } = useGoogleOAuth({ setLoading, setError });

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-foreground hover:opacity-80 transition-opacity">
            <Image src="/logo-icon.png" alt="" width={1047} height={1267} priority className="h-11 w-auto" />
            VoiceHub
          </Link>
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
          {showEmailForm ? (
            <>
              <button
                onClick={() => { setShowEmailForm(false); setError(null); }}
                className="flex items-center gap-1.5 text-sm text-foreground/50 hover:text-foreground/70 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                戻る
              </button>

              <form onSubmit={handleEmailLogin} className="space-y-3">
                <AuthInput
                  type="email"
                  placeholder="メールアドレス"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <AuthInput
                  type="password"
                  placeholder="パスワード"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
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
            </>
          ) : (
            <>
              <GoogleOAuthButton
                onClick={handleGoogleLogin}
                loading={loading === "google"}
                label="Googleでログイン"
              />

              <button
                onClick={() => setShowEmailForm(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-foreground/10 bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:bg-foreground/5 transition-colors cursor-pointer"
              >
                <Mail size={16} />
                メールアドレスでログイン
              </button>
            </>
          )}

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
