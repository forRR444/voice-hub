import { NextResponse } from "next/server";
import type { ApiError, ApiSuccess } from "@/types/api";

/**
 * init?.headers と既定ヘッダをマージする。
 * NextResponse.json の headers は HeadersInit を受けるので
 * Headers / Record / [key,value][] のいずれでも安全に統合する。
 */
function mergeInit(
  base: ResponseInit,
  override?: ResponseInit,
): ResponseInit {
  if (!override) return base;
  const merged: ResponseInit = { ...base, ...override };
  if (base.headers || override.headers) {
    const headers = new Headers(base.headers);
    if (override.headers) {
      const overrideHeaders = new Headers(override.headers);
      overrideHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    }
    merged.headers = headers;
  }
  return merged;
}

/**
 * 成功レスポンス。data は任意。null を渡すと "Action 完了" 系の no-payload を表す。
 */
export function apiSuccess<T>(
  data: T,
  init?: ResponseInit,
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json<ApiSuccess<T>>(
    { ok: true, data },
    mergeInit({ status: 200 }, init),
  );
}

/**
 * エラーレスポンス。code は意味があるときだけ付ける。
 */
export function apiError(
  error: string,
  status: number,
  code?: string,
  init?: ResponseInit,
): NextResponse<ApiError> {
  const body: ApiError = code ? { ok: false, error, code } : { ok: false, error };
  return NextResponse.json<ApiError>(body, mergeInit({ status }, init));
}
