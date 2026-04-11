export type SalonThemeConfig = {
  id: "natural" | "modern" | "elegant";
  label: string;
  description: string;
  defaultAccent: string;
  headerBg: string;
  bodyBg: string;
  cardBg: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  borderRadius: string;
};

export const SALON_THEMES: Record<string, SalonThemeConfig> = {
  natural: {
    id: "natural",
    label: "ナチュラル",
    description: "リラクゼーション・アロマ向け",
    defaultAccent: "#C4A882",
    headerBg: "#FAF6F1",
    bodyBg: "#FFFCF9",
    cardBg: "#FFFFFF",
    cardBorder: "#E8E0D6",
    textPrimary: "#3D3226",
    textSecondary: "#8C7B6B",
    borderRadius: "12px",
  },
  modern: {
    id: "modern",
    label: "モダン",
    description: "美容室・ネイルサロン向け",
    defaultAccent: "#2D2D2D",
    headerBg: "#F5F5F5",
    bodyBg: "#FFFFFF",
    cardBg: "#FFFFFF",
    cardBorder: "#E0E0E0",
    textPrimary: "#1A1A1A",
    textSecondary: "#666666",
    borderRadius: "4px",
  },
  elegant: {
    id: "elegant",
    label: "エレガント",
    description: "エステ・フェイシャル向け",
    defaultAccent: "#B8943E",
    headerBg: "#FDFAF5",
    bodyBg: "#FFFDF8",
    cardBg: "#FFFFFF",
    cardBorder: "#E8DFC8",
    textPrimary: "#2C2416",
    textSecondary: "#7A6E5E",
    borderRadius: "16px",
  },
};
