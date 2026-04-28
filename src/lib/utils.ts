import type { SupabaseClient } from "@supabase/supabase-js";
import { RESERVED_SLUGS } from "@/lib/constants";

export function generateSlug(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * salon_pages.slug としてユニークな slug を生成する。
 * RESERVED_SLUGS と衝突せず、DB にも存在しない値を返す。
 * maxRetries 回試して全て衝突した場合は例外を投げる。
 */
export async function generateUniqueSalonSlug(
  supabase: SupabaseClient,
  length = 10,
  maxRetries = 10
): Promise<string> {
  const reserved = new Set<string>(RESERVED_SLUGS);
  for (let i = 0; i < maxRetries; i++) {
    const candidate = generateSlug(length);
    if (reserved.has(candidate)) continue;
    const { data, error } = await supabase
      .from("salon_pages")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (error) throw error;
    if (!data) return candidate;
  }
  throw new Error("ユニークなslugの生成に失敗しました");
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3001";
}
