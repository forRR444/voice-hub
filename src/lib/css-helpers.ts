// ============================================================================
// CSS 変数（カスタムプロパティ）を含むスタイルを React.CSSProperties として扱うヘルパー
// ============================================================================
//
// TypeScript の `React.CSSProperties` はカスタムプロパティ（`--xxx`）を公式に型付けしないため、
// アプリ全体で散在する `as React.CSSProperties` を本ファイルに一元化する。
// ここ以外では CSS 変数を含むスタイルでも `as` を直接書かない。

import type { CSSProperties } from "react";

/**
 * CSS 変数を含むスタイルオブジェクトを React.CSSProperties に変換する。
 *
 * 例:
 * ```tsx
 * <div style={cssVars({ "--marquee-duration": "20s", color: "red" })} />
 * ```
 *
 * 内部の型変換は React.CSSProperties が `--xxx` を許容しない制約への対処であり、
 * このファイル一箇所のみに閉じ込める。
 */
export function cssVars(
  vars: Record<string, string | number | undefined>,
): CSSProperties {
  // CSSProperties は string index signature を持たないため、
  // ここで一度だけ型変換する。実行時の値は string | number | undefined のみ。
  return vars as CSSProperties;
}
