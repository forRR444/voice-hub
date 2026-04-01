"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { SignOut } from "@phosphor-icons/react";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-foreground/50 hover:bg-foreground/5 hover:text-foreground transition-colors cursor-pointer"
    >
      <SignOut className="h-3.5 w-3.5" />
      ログアウト
    </button>
  );
}
