/**
 * API レスポンス共通型。
 * すべての JSON 返却 API は ApiResponse<T> 形状を返す
 * （redirect / Stripe webhook / ハニーポット応答等の例外を除く）。
 */
export type ApiSuccess<T> = { ok: true; data: T };
export type ApiError = { ok: false; error: string; code?: string };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;
