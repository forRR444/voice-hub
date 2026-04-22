/**
 * プラン比較の表示情報（単一の情報源）
 * LP、設定ページ、料金ページ、アップグレードモーダルで共通利用する
 */

const PLAN_FEATURE_COMPARISONS = [
  { label: "口コミ収集", free: "無制限", pro: "無制限" },
  { label: "口コミ表示", free: "上限 5件", pro: "無制限" },
  { label: "ダッシュボード閲覧", free: "上限 10件", pro: "無制限" },
  { label: "VoiceHubバッジ", free: "表示あり", pro: "非表示" },
] as const;

/** Freeプランの機能リスト（表示用） */
export const FREE_FEATURE_LIST = PLAN_FEATURE_COMPARISONS.map(
  (f) => `${f.label} ${f.free}`
);

/** Proプランの機能リスト（表示用） */
export const PRO_FEATURE_LIST = PLAN_FEATURE_COMPARISONS.map(
  (f) => `${f.label} ${f.pro}`
);
