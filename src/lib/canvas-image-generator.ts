// ============================================================================
// Canvas-based Testimonial Image Generator
// ============================================================================

export type TemplateSize = "instagram-story" | "instagram-post" | "x-post";
type DesignStyle = "glass" | "warm";

type ImageConfig = { width: number; height: number; label: string };

type TestimonialImageData = {
  rating: number | null;
  content: string;
  name: string;
  title: string | null;
  company: string | null;
  brandColor: string;
};

const TEMPLATES: Record<TemplateSize, ImageConfig> = {
  "instagram-story": { width: 1080, height: 1920, label: "Instagram ストーリー" },
  "instagram-post": { width: 1080, height: 1080, label: "Instagram 投稿" },
  "x-post": { width: 1200, height: 675, label: "X (Twitter) 投稿" },
};

type FontConfig = { contentSize: number; nameSize: number };

const FONT_CONFIGS: Record<TemplateSize, FontConfig> = {
  "instagram-story": { contentSize: 42, nameSize: 36 },
  "instagram-post": { contentSize: 36, nameSize: 30 },
  "x-post": { contentSize: 28, nameSize: 24 },
};

const FONT_FAMILY =
  '"Hiragino Sans", "Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif';

// ---------------------------------------------------------------------------
// Color utilities
// ---------------------------------------------------------------------------

function hexToRGB(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return [(num >> 16), ((num >> 8) & 0xff), (num & 0xff)];
}

function darkenHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRGB(hex);
  const f = 1 - amount / 100;
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
}

// ---------------------------------------------------------------------------
// CJK detection & text wrapping
// ---------------------------------------------------------------------------

function isCJK(char: string): boolean {
  const code = char.charCodeAt(0);
  return (code >= 0x3000 && code <= 0x9fff) || (code >= 0xf900 && code <= 0xfaff) || (code >= 0xff00 && code <= 0xffef);
}

type WrappedLine = { text: string; y: number };

function wrapText(
  ctx: CanvasRenderingContext2D, text: string, maxWidth: number,
  lineHeight: number, startY: number, maxLines: number,
): WrappedLine[] {
  const lines: WrappedLine[] = [];
  const paragraphs = text.split(/\r?\n/);
  for (const paragraph of paragraphs) {
    if (lines.length >= maxLines) break;
    if (paragraph.length === 0) { lines.push({ text: "", y: startY + lines.length * lineHeight }); continue; }
    let currentLine = "";
    for (let i = 0; i < paragraph.length; i++) {
      if (lines.length >= maxLines) break;
      const char = paragraph[i];
      const testLine = currentLine + char;
      if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
        if (lines.length === maxLines - 1) {
          currentLine = truncate(ctx, currentLine, maxWidth);
          lines.push({ text: currentLine, y: startY + lines.length * lineHeight });
          currentLine = ""; break;
        }
        if (isCJK(char)) {
          lines.push({ text: currentLine, y: startY + lines.length * lineHeight });
          currentLine = char;
        } else {
          const sp = currentLine.lastIndexOf(" ");
          if (sp > 0) {
            lines.push({ text: currentLine.substring(0, sp), y: startY + lines.length * lineHeight });
            currentLine = currentLine.substring(sp + 1) + char;
          } else {
            lines.push({ text: currentLine, y: startY + lines.length * lineHeight });
            currentLine = char;
          }
        }
      } else { currentLine = testLine; }
    }
    if (currentLine.length > 0 && lines.length < maxLines) {
      if (lines.length === maxLines - 1 && paragraphs.indexOf(paragraph) < paragraphs.length - 1)
        currentLine = truncate(ctx, currentLine, maxWidth);
      lines.push({ text: currentLine, y: startY + lines.length * lineHeight });
    } else if (currentLine.length > 0 && lines.length >= maxLines) {
      lines[lines.length - 1].text = truncate(ctx, lines[lines.length - 1].text, maxWidth);
    }
  }
  return lines;
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  const e = "...";
  if (ctx.measureText(text + e).width <= maxWidth) return text + e;
  let t = text;
  while (t.length > 0 && ctx.measureText(t + e).width > maxWidth) t = t.slice(0, -1);
  return t + e;
}

// ---------------------------------------------------------------------------
// Canvas helpers
// ---------------------------------------------------------------------------

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function drawStars(ctx: CanvasRenderingContext2D, rating: number, x: number, y: number, size: number, color: string) {
  ctx.font = `${size}px ${FONT_FAMILY}`;
  ctx.textBaseline = "top";
  ctx.fillStyle = color;
  const stars = [];
  for (let i = 1; i <= 5; i++) stars.push(i <= rating ? "★" : "☆");
  ctx.fillText(stars.join("  "), x, y);
}

// ---------------------------------------------------------------------------
// Layout configs per template
// ---------------------------------------------------------------------------

type Layout = {
  paddingX: number; topY: number; starSize: number;
  lineHeight: number; dividerGap: number; nameGap: number;
  subtitleGap: number; footerSize: number; footerBottom: number;
  // Glass-specific
  cardMargin: number; cardPadding: number; cardRadius: number;
};

function getLayout(t: TemplateSize): Layout {
  if (t === "instagram-story") return {
    paddingX: 100, topY: 420, starSize: 36, lineHeight: 72,
    dividerGap: 56, nameGap: 44, subtitleGap: 40, footerSize: 24, footerBottom: 80,
    cardMargin: 56, cardPadding: 64, cardRadius: 28,
  };
  if (t === "instagram-post") return {
    paddingX: 80, topY: 130, starSize: 30, lineHeight: 60,
    dividerGap: 44, nameGap: 36, subtitleGap: 32, footerSize: 22, footerBottom: 50,
    cardMargin: 48, cardPadding: 52, cardRadius: 24,
  };
  return {
    paddingX: 60, topY: 60, starSize: 26, lineHeight: 46,
    dividerGap: 32, nameGap: 28, subtitleGap: 24, footerSize: 18, footerBottom: 30,
    cardMargin: 32, cardPadding: 40, cardRadius: 18,
  };
}

// ---------------------------------------------------------------------------
// Auto-scale font to fit available height
// ---------------------------------------------------------------------------

function autoScaleText(
  ctx: CanvasRenderingContext2D, content: string, maxWidth: number,
  maxTextH: number, defaultSize: number, lineHeightRatio: number,
): { fontSize: number; lineHeight: number; lines: WrappedLine[] } {
  const minSize = Math.round(defaultSize * 0.55);
  let best = { fontSize: defaultSize, lineHeight: Math.round(defaultSize * lineHeightRatio), lines: [] as WrappedLine[] };

  for (let s = defaultSize; s >= minSize; s -= 2) {
    const lh = Math.round(s * lineHeightRatio);
    ctx.font = `${s}px ${FONT_FAMILY}`;
    ctx.textBaseline = "top";
    const lines = wrapText(ctx, content, maxWidth, lh, 0, 100);
    const h = lines.length > 0 ? (lines.length - 1) * lh + s : 0;
    best = { fontSize: s, lineHeight: lh, lines };
    if (h <= maxTextH) break;
  }

  const maxLines = Math.floor(maxTextH / best.lineHeight);
  if (best.lines.length > maxLines) {
    ctx.font = `${best.fontSize}px ${FONT_FAMILY}`;
    best.lines = wrapText(ctx, content, maxWidth, best.lineHeight, 0, maxLines);
  }
  return best;
}

// ===========================================================================
// Design A: Glass — frosted card on gradient
// ===========================================================================

function renderGlass(
  ctx: CanvasRenderingContext2D, data: TestimonialImageData,
  template: TemplateSize, width: number, height: number,
) {
  const fonts = FONT_CONFIGS[template];
  const L = getLayout(template);

  // 1. Gradient background
  const grad = ctx.createLinearGradient(0, 0, width * 0.3, height);
  grad.addColorStop(0, data.brandColor);
  grad.addColorStop(1, darkenHex(data.brandColor, 35));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. Measure content for card sizing
  const cardX = L.cardMargin;
  const cardW = width - L.cardMargin * 2;
  const innerW = cardW - L.cardPadding * 2;
  const subtitleParts: string[] = [];
  if (data.title) subtitleParts.push(data.title);
  if (data.company) subtitleParts.push(data.company);

  const fixedH =
    L.cardPadding + // top padding
    (data.rating !== null ? L.starSize + 28 : 0) +
    L.dividerGap + L.nameGap + fonts.nameSize * 1.2 +
    (subtitleParts.length > 0 ? L.subtitleGap : 0) +
    L.cardPadding; // bottom padding

  const maxCardH = height - L.topY - L.footerBottom - L.footerSize - 20;
  const maxTextH = maxCardH - fixedH;

  const scaled = autoScaleText(ctx, data.content, innerW, maxTextH, fonts.contentSize, 1.72);

  const textH = scaled.lines.length > 0 ? (scaled.lines.length - 1) * scaled.lineHeight + scaled.fontSize : 0;
  const cardContentH = (data.rating !== null ? L.starSize + 28 : 0) + textH + L.dividerGap + L.nameGap + fonts.nameSize * 1.2 + (subtitleParts.length > 0 ? L.subtitleGap : 0);
  const cardH = L.cardPadding + cardContentH + L.cardPadding;

  // Center card vertically in available space
  const availTop = L.topY;
  const availBottom = height - L.footerBottom - L.footerSize - 20;
  const cardY = Math.round(availTop + (availBottom - availTop - cardH) / 2);

  // 3. Frosted glass card
  // Background layer (darker, semi-transparent)
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, L.cardRadius);
  ctx.fill();

  // Border
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, L.cardRadius);
  ctx.stroke();

  // 4. Content inside card
  const innerX = cardX + L.cardPadding;
  let y = cardY + L.cardPadding;

  // Stars
  if (data.rating !== null) {
    drawStars(ctx, data.rating, innerX, y, L.starSize, "rgba(255,255,255,0.9)");
    y += L.starSize + 28;
  }

  // Text
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `${scaled.fontSize}px ${FONT_FAMILY}`;
  ctx.textBaseline = "top";
  const lines = wrapText(ctx, data.content, innerW, scaled.lineHeight, y, scaled.lines.length);
  for (const line of lines) ctx.fillText(line.text, innerX, line.y);
  if (lines.length > 0) y = lines[lines.length - 1].y + scaled.lineHeight + L.dividerGap;
  else y += L.dividerGap;

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(innerX, y); ctx.lineTo(innerX + innerW, y); ctx.stroke();
  y += L.nameGap;

  // Name
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `bold ${fonts.nameSize}px ${FONT_FAMILY}`;
  ctx.fillText(data.name || "お客様", innerX, y);
  y += Math.round(fonts.nameSize * 1.5);

  // Subtitle
  if (subtitleParts.length > 0) {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = `${Math.round(fonts.nameSize * 0.85)}px ${FONT_FAMILY}`;
    const sub = subtitleParts.join(" / ");
    ctx.fillText(ctx.measureText(sub).width > innerW ? truncate(ctx, sub, innerW) : sub, innerX, y);
  }

  // 5. Footer
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = `${L.footerSize}px ${FONT_FAMILY}`;
  ctx.textBaseline = "bottom";
  ctx.textAlign = "center";
  ctx.fillText("Powered by VoiceHub", width / 2, height - L.footerBottom);
  ctx.textAlign = "start";
}

// ===========================================================================
// Design B: Warm Minimal — beige background, centered
// ===========================================================================

function renderWarm(
  ctx: CanvasRenderingContext2D, data: TestimonialImageData,
  template: TemplateSize, width: number, height: number,
) {
  const fonts = FONT_CONFIGS[template];
  const L = getLayout(template);

  // 1. Warm beige background
  ctx.fillStyle = "#F5F0EB";
  ctx.fillRect(0, 0, width, height);

  // 2. Measure content
  const contentW = width - L.paddingX * 2;
  const subtitleParts: string[] = [];
  if (data.title) subtitleParts.push(data.title);
  if (data.company) subtitleParts.push(data.company);

  const fixedH =
    L.topY +
    (data.rating !== null ? L.starSize + 32 : 0) +
    L.dividerGap + L.nameGap + fonts.nameSize * 1.2 +
    (subtitleParts.length > 0 ? L.subtitleGap : 0) +
    L.footerBottom + L.footerSize;

  const maxTextH = height - fixedH;
  const scaled = autoScaleText(ctx, data.content, contentW, maxTextH, fonts.contentSize, 1.72);

  // 3. Draw — left aligned
  const x = L.paddingX;
  let y = L.topY;

  // Stars
  if (data.rating !== null) {
    drawStars(ctx, data.rating, x, y, L.starSize, "#D4A853");
    y += L.starSize + 32;
  }

  // Text
  ctx.fillStyle = "#2C2C2C";
  ctx.font = `${scaled.fontSize}px ${FONT_FAMILY}`;
  ctx.textBaseline = "top";
  const lines = wrapText(ctx, data.content, contentW, scaled.lineHeight, y, scaled.lines.length);
  for (const line of lines) ctx.fillText(line.text, x, line.y);
  if (lines.length > 0) y = lines[lines.length - 1].y + scaled.lineHeight + L.dividerGap;
  else y += L.dividerGap;

  // Divider (right-aligned)
  ctx.strokeStyle = "#C4A76C";
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x + contentW - 48, y); ctx.lineTo(x + contentW, y); ctx.stroke();
  y += L.nameGap;

  // Name (right-aligned)
  const rightX = x + contentW;
  ctx.fillStyle = "#2C2C2C";
  ctx.font = `600 ${fonts.nameSize}px ${FONT_FAMILY}`;
  ctx.textBaseline = "top";
  ctx.textAlign = "right";
  ctx.fillText(data.name || "お客様", rightX, y);
  ctx.textAlign = "start";
  y += Math.round(fonts.nameSize * 1.5);

  // Subtitle (right-aligned)
  if (subtitleParts.length > 0) {
    ctx.fillStyle = "#8C8279";
    ctx.font = `${Math.round(fonts.nameSize * 0.85)}px ${FONT_FAMILY}`;
    ctx.textAlign = "right";
    const sub = subtitleParts.join(" / ");
    ctx.fillText(ctx.measureText(sub).width > contentW ? truncate(ctx, sub, contentW) : sub, rightX, y);
    ctx.textAlign = "start";
  }

  // Footer
  ctx.fillStyle = "#C4B9AD";
  ctx.font = `${L.footerSize}px ${FONT_FAMILY}`;
  ctx.textBaseline = "bottom";
  ctx.textAlign = "center";
  ctx.fillText("Powered by VoiceHub", width / 2, height - L.footerBottom);
  ctx.textAlign = "start";
}

// ===========================================================================
// Main entry point
// ===========================================================================

export async function generateTestimonialImage(
  data: TestimonialImageData,
  template: TemplateSize,
  style: DesignStyle = "glass",
): Promise<Blob> {
  const { width, height } = TEMPLATES[template];
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to obtain 2D rendering context.");

  if (style === "glass") renderGlass(ctx, data, template, width, height);
  else renderWarm(ctx, data, template, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("canvas.toBlob() returned null."));
    }, "image/png");
  });
}
