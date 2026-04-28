// ブランドカラーのデフォルト値
export const DEFAULT_BRAND_COLOR = "#635BFF";

// テキスト入力の最大文字数
export const TEXTAREA_MAX_LENGTH = 5000;

// 画像サイズ制限
export const IMAGE_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const IMAGE_RESIZED_MAX_BYTES = 2 * 1024 * 1024; // 2MB
export const IMAGE_RESIZE_MAX_PX = 800;

// レート制限設定
export const RATE_LIMITS = {
  formGet: { limit: 60, windowMs: 60 * 1000 },
  testimonialSubmit: { limit: 5, windowMs: 15 * 60 * 1000 },
  googleReviewsGuestHourly: { limit: 6, windowMs: 60 * 60 * 1000 }, // 未ログイン: 3フロー/時間
  googleReviewsGuestDaily: { limit: 20, windowMs: 24 * 60 * 60 * 1000 }, // 未ログイン: 10フロー/日
  googleReviewsUser: { limit: 20, windowMs: 24 * 60 * 60 * 1000 }, // ログイン済み: 10フロー/日
  salonPageSave: { limit: 30, windowMs: 60_000 },
  salonUpload: { limit: 20, windowMs: 60_000 },
} as const;

// 予約済み slug — サロンページ slug 生成時に衝突回避する
export const RESERVED_SLUGS = [
  "api",
  "admin",
  "login",
  "signup",
  "dashboard",
  "salon",
  "stripe",
  "auth",
  "onboarding",
  "favicon.ico",
  "sitemap.xml",
  "robots.txt",
] as const;

// ウィジェットタイプ一覧
export const WIDGET_TYPES = [
  { id: "carousel", label: "カルーセル", desc: "横スクロールで切り替え" },
  { id: "grid", label: "グリッド", desc: "カード一覧" },
  { id: "list", label: "リスト", desc: "縦に並ぶシンプル表示" },
  { id: "wall", label: "Wall of Love", desc: "Masonry風の大量表示" },
  { id: "marquee", label: "マーキー", desc: "横に流れ続ける" },
  { id: "dual-marquee", label: "デュアルマーキー", desc: "2行が逆方向に横スクロール" },
  { id: "single", label: "シングル", desc: "1件を大きく表示" },
  { id: "badge", label: "バッジ", desc: "評価サマリー表示" },
] as const;

// テスティモニアル取得時の共通カラム
export const TESTIMONIAL_SELECT_COLUMNS =
  "id, name, title, company, avatar_url, rating, content, before_story, is_featured, submitted_at";

// SNSテンプレートオプション
export const SNS_TEMPLATE_OPTIONS = [
  { key: "instagram-story" as const, label: "Instagram ストーリー" },
  { key: "instagram-post" as const, label: "Instagram 投稿" },
  { key: "x-post" as const, label: "X 投稿" },
] as const;

// サロンページ
export const SALON_TAGLINE_MAX_LENGTH = 100;
export const SALON_MAX_LINKS = 3;
export const SALON_INITIAL_DISPLAY_COUNT = 10;
export const SALON_DESCRIPTION_MAX_LENGTH = 2000;
export const SALON_ADDRESS_MAX_LENGTH = 200;
export const SALON_CLOSED_DAYS_MAX_LENGTH = 100;
export const SALON_MENU_MAX_ITEMS = 20;
export const SALON_MENU_NAME_MAX_LENGTH = 50;
export const SALON_MENU_PRICE_MAX_LENGTH = 30;
export const SALON_MENU_DESCRIPTION_MAX_LENGTH = 100;
export const SALON_BUSINESS_HOURS_TEXT_MAX_LENGTH = 300;
