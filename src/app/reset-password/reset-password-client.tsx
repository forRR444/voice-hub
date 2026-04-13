"use client";

import { createClient } from "@/lib/supabase/client";
import { validateEmail } from "@/lib/validation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AuthInput from "@/app/components/auth-input";

export default function ResetPasswordClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const supabase = createClient();

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) { setError(emailErr); return; }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/confirm`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">メールを送信しました</h1>
            <p className="mt-3 text-sm text-foreground/60">
              <span className="font-medium text-foreground">{email}</span> にパスワードリセットのメールを送信しました。
              メール内のリンクをクリックしてパスワードを再設定してください。
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
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-foreground hover:opacity-80 transition-opacity">
            <Image src="/logo-icon.png" alt="" width={1047} height={1267} priority className="h-11 w-auto" />
            VoiceHub
          </Link>
          <p className="mt-2 text-sm text-foreground/60">パスワードをリセット</p>
        </div>

        <div className="space-y-4">
          <form onSubmit={handleReset} className="space-y-3">
            <div>
              <AuthInput
                type="email"
                placeholder="登録済みのメールアドレス"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              リセットメールを送信
            </button>
          </form>

          {error && (
            <p className="text-center text-xs text-red-500">{error}</p>
          )}
        </div>

        <p className="text-center text-sm text-foreground/60">
          <Link href="/login" className="text-indigo-600 hover:underline">ログインに戻る</Link>
        </p>
      </div>
    </div>
  );
}
