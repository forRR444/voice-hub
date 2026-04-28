// ============================================================================
// 型ガード関数集 — `as` キャストを避けるための narrowing ヘルパー
// ============================================================================

export function isString(v: unknown): v is string {
  return typeof v === "string";
}

export function isNumber(v: unknown): v is number {
  return typeof v === "number" && !Number.isNaN(v);
}

export function isBoolean(v: unknown): v is boolean {
  return typeof v === "boolean";
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function isNode(v: EventTarget | null): v is Node {
  return v !== null && typeof v === "object" && "nodeType" in v;
}

/**
 * 文字列値が指定された値の集合に含まれるかを型ガードで判定する。
 *
 * `values` の要素型 `T` を呼び出し側のジェネリクス指定で固定し、
 * 内部実装は `readonly string[]` 型のみで完結させることで `as` を回避。
 */
export function isOneOf<T extends string>(values: readonly T[], v: unknown): v is T {
  if (typeof v !== "string") return false;
  // values が readonly T[] なら readonly string[] のサブタイプ — includes に直接渡せる
  const list: readonly string[] = values;
  return list.includes(v);
}
