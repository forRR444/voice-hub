"use client";

import { createClient } from "@/lib/supabase/client";
import { validateEmail, validatePassword } from "@/lib/validation";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createClient();

  function preserveTemplate() {
    const template = new URLSearchParams(window.location.search).get("template");
    if (template) {
      localStorage.setItem("voicehub_template", template);
    }
  }

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
      setError(error.message);
      setLoading(null);
    }
  }

  const isFromTry = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("from") === "try";

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
              <input
                type="email"
                placeholder="メールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="パスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <button
            onClick={handleGoogleLogin}
            disabled={!!loading}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-foreground/10 bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:bg-foreground/5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {loading === "google" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            Googleでログイン
          </button>

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
