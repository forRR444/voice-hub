"use client";

import { createClient } from "@/lib/supabase/client";
import { validatePassword, validatePasswordMatch } from "@/lib/validation";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";

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
    if (passErr) { setError(passErr); return; }
    const matchErr = validatePasswordMatch(password, confirmPassword);
    if (matchErr) { setError(matchErr); return; }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <Link href="/" className="text-2xl font-bold text-foreground hover:opacity-80 transition-opacity">VoiceHub</Link>
          <p className="mt-2 text-sm text-foreground/60">新しいパスワードを設定</p>
        </div>

        <div className="space-y-4">
          <form onSubmit={handleUpdate} className="space-y-3">
            <div>
              <input
                type="password"
                placeholder="新しいパスワード（8文字以上）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="新しいパスワード（確認）"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-foreground/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

          {error && (
            <p className="text-center text-xs text-red-500">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
