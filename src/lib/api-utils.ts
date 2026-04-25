import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { rateLimitAsync } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";

/**
 * リクエストからクライアントIPを取得する
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIp || "unknown";
}

/**
 * レート制限チェックを行い、制限超過時は429レスポンスを返す
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  message = "リクエスト数の制限に達しました。しばらくしてからもう一度お試しください。",
): Promise<NextResponse | null> {
  const { success } = await rateLimitAsync(key, limit, windowMs);
  if (!success) {
    return NextResponse.json({ error: message }, { status: 429 });
  }
  return null;
}

/**
 * APIルートの共通エラーハンドラ
 */
export function handleApiError(
  error: unknown,
  message = "サーバーエラーが発生しました",
  headers?: Record<string, string>,
): NextResponse {
  logError(message, error);
  return NextResponse.json(
    { error: message },
    { status: 500, ...(headers ? { headers } : {}) },
  );
}

/**
 * Zod バリデーション失敗時の共通レスポンス。
 * logTag にエラー文脈を渡すと `{logTag}:` としてログ出力される。
 */
export function validationErrorResponse(
  error: ZodError,
  logTag: string,
): NextResponse {
  logError(`${logTag}:`, JSON.stringify(error.flatten()));
  return NextResponse.json(
    { error: "入力内容に不備があります", details: error.flatten() },
    { status: 400 },
  );
}
