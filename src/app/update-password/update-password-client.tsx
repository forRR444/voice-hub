"use client";

import { createClient } from "@/lib/supabase/client";
import { validatePassword, validatePasswordMatch } from "@/lib/validation";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AuthInput from "@/app/components/auth-input";

export default function UpdatePasswordClient() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createClient();

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    const passErr = validatePassword(password);
    if (passErr) {
      setError(passErr);
      return;
    }
    const matchErr = validatePasswordMatch(password, confirmPassword);
    if (matchErr) {
      setError(matchErr);
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("パスワードの更新に失敗しました。もう一度お試しください");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-lg font-bold text-[var(--brand)] hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logo-icon.png"
              alt=""
              width={1047}
              height={1267}
              priority
              className="h-7 w-auto"
            />
            VoiceHub
          </Link>
          <p className="mt-2 text-sm text-foreground/60">新しいパスワードを設定</p>
        </div>

        <div className="space-y-4">
          <form onSubmit={handleUpdate} className="space-y-3">
            <div>
              <AuthInput
                type="password"
                placeholder="新しいパスワード（8文字以上）"
                value={password}
                autoComplete="new-password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <AuthInput
                type="password"
                placeholder="新しいパスワード（確認）"
                value={confirmPassword}
                autoComplete="new-password"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              パスワードを更新
            </button>
          </form>

          {error && <p className="text-center text-xs text-red-500">{error}</p>}
        </div>
      </div>
    </div>
  );
}
