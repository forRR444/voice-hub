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

// HEXをRGBに変換
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

// RGBをHEXに変換
function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) =>
        Math.round(Math.max(0, Math.min(255, v)))
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  );
}

// 白と混ぜる（ratio: 0=元の色, 1=白）
function mixWhite(rgb: [number, number, number], ratio: number): string {
  return rgbToHex(
    rgb[0] + (255 - rgb[0]) * ratio,
    rgb[1] + (255 - rgb[1]) * ratio,
    rgb[2] + (255 - rgb[2]) * ratio
  );
}

// RGBをHSLに変換
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

// HSLをRGBに変換
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

// 彩度を抑えた色を生成（背景用）
function desaturatedTint(
  rgb: [number, number, number],
  lightness: number,
  saturationRatio: number
): string {
  const [h, s] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  const newRgb = hslToRgb(h, s * saturationRatio, lightness);
  return rgbToHex(newRgb[0], newRgb[1], newRgb[2]);
}

// RGBの輝度を計算
function luminance(rgb: [number, number, number]): number {
  return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
}

/** アクセントカラーからテーマ全色を自動生成 */
export function generateThemeFromAccent(accent: string): SalonThemeConfig {
  const rgb = hexToRgb(accent);
  const lum = luminance(rgb);
  const [, sat] = rgbToHsl(rgb[0], rgb[1], rgb[2]);

  // 暗い色 or 低彩度 → クリーンなグレー系
  const isDark = lum < 0.3;
  // 彩度が高い明るい色 → 彩度を大幅に落として温度感だけ残す
  const satRatio = sat > 0.4 ? 0.15 : 0.3;

  return {
    id: "natural",
    label: "",
    description: "",
    defaultAccent: accent,
    headerBg: isDark ? "#F5F5F5" : desaturatedTint(rgb, 0.97, satRatio),
    bodyBg: isDark ? "#FFFFFF" : desaturatedTint(rgb, 0.985, satRatio),
    cardBg: "#FFFFFF",
    cardBorder: isDark ? "#E0E0E0" : desaturatedTint(rgb, 0.9, satRatio),
    textPrimary: isDark ? "#1A1A1A" : rgbToHex(rgb[0] * 0.15, rgb[1] * 0.15, rgb[2] * 0.15),
    textSecondary: isDark ? "#666666" : desaturatedTint(rgb, 0.45, 0.2),
    borderRadius: "12px",
  };
}

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
