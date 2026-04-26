import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { rateLimitAsync } from "@/lib/rate-limit";
import { logError } from "@/lib/logger";
import { apiError } from "@/lib/api-response";

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
    return apiError(message, 429, "RATE_LIMITED");
  }
  return null;
}

/**
 * APIルートの共通エラーハンドラ。
 * 内部実装は apiError に委譲しつつ、外部シグネチャ（呼び出し側）は変更しない。
 */
export function handleApiError(
  error: unknown,
  message = "サーバーエラーが発生しました",
  headers?: Record<string, string>,
): NextResponse {
  logError(message, error);
  return apiError(
    message,
    500,
    "INTERNAL_ERROR",
    headers ? { headers } : undefined,
  );
}

/**
 * Zod バリデーション失敗時の共通レスポンス。
 * logTag にエラー文脈を渡すと `{logTag}:` としてログ出力される。
 * 詳細は ApiResponse から削除（クライアントでは error メッセージのみ利用するため）。
 */
export function validationErrorResponse(
  error: ZodError,
  logTag: string,
): NextResponse {
  logError(`${logTag}:`, JSON.stringify(error.flatten()));
  return apiError("入力内容に不備があります", 400, "VALIDATION_ERROR");
}
