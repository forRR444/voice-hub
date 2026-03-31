// ============================================================================
// Canvas-based Testimonial Image Generator
// Pure TypeScript utility — no React, no external dependencies.
// Works in any modern browser environment (client-side only).
// ============================================================================

export type TemplateSize = "instagram-story" | "instagram-post" | "x-post";

export type ImageConfig = {
  width: number;
  height: number;
  label: string;
};

export type TestimonialImageData = {
  rating: number | null;
  content: string;
  name: string;
  title: string | null;
  company: string | null;
  brandColor: string;
};

export const TEMPLATES: Record<TemplateSize, ImageConfig> = {
  "instagram-story": { width: 1080, height: 1920, label: "Instagram ストーリー" },
  "instagram-post": { width: 1080, height: 1080, label: "Instagram 投稿" },
  "x-post": { width: 1200, height: 675, label: "X (Twitter) 投稿" },
};

type FontConfig = {
  contentSize: number;
  nameSize: number;
  maxLines: number;
};

const FONT_CONFIGS: Record<TemplateSize, FontConfig> = {
  "instagram-story": { contentSize: 42, nameSize: 36, maxLines: 14 },
  "instagram-post": { contentSize: 36, nameSize: 30, maxLines: 8 },
  "x-post": { contentSize: 28, nameSize: 24, maxLines: 6 },
};

const FONT_FAMILY =
  '"Hiragino Sans", "Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif';

// ---------------------------------------------------------------------------
// Color utilities (HSL-based)
// ---------------------------------------------------------------------------

function hexToHSL(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  const r = (num >> 16) / 255;
  const g = ((num >> 8) & 0xff) / 255;
  const b = (num & 0xff) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h * 360, s * 100, l * 100];
}

function hslToRGB(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h / 360 + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h / 360) * 255),
    Math.round(hue2rgb(p, q, h / 360 - 1 / 3) * 255),
  ];
}

function hslColor(h: number, s: number, l: number, a = 1): string {
  const [r, g, b] = hslToRGB(h, s, l);
  return a < 1 ? `rgba(${r},${g},${b},${a})` : `rgb(${r},${g},${b})`;
}

// ---------------------------------------------------------------------------
// CJK detection & text wrapping
// ---------------------------------------------------------------------------

function isCJK(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x3000 && code <= 0x9fff) ||
    (code >= 0xf900 && code <= 0xfaff) ||
    (code >= 0xff00 && code <= 0xffef)
  );
}

type WrappedLine = { text: string; y: number };

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number,
  startY: number,
  maxLines: number,
): WrappedLine[] {
  const lines: WrappedLine[] = [];
  const paragraphs = text.split(/\r?\n/);

  for (const paragraph of paragraphs) {
    if (lines.length >= maxLines) break;
    if (paragraph.length === 0) {
      lines.push({ text: "", y: startY + lines.length * lineHeight });
      continue;
    }
    let currentLine = "";
    for (let i = 0; i < paragraph.length; i++) {
      if (lines.length >= maxLines) break;
      const char = paragraph[i];
      const testLine = currentLine + char;
      if (ctx.measureText(testLine).width > maxWidth && currentLine.length > 0) {
        if (lines.length === maxLines - 1) {
          currentLine = truncateWithEllipsis(ctx, currentLine, maxWidth);
          lines.push({ text: currentLine, y: startY + lines.length * lineHeight });
          currentLine = "";
          break;
        }
        if (isCJK(char)) {
          lines.push({ text: currentLine, y: startY + lines.length * lineHeight });
          currentLine = char;
        } else {
          const lastSpace = currentLine.lastIndexOf(" ");
          if (lastSpace > 0) {
            lines.push({ text: currentLine.substring(0, lastSpace), y: startY + lines.length * lineHeight });
            currentLine = currentLine.substring(lastSpace + 1) + char;
          } else {
            lines.push({ text: currentLine, y: startY + lines.length * lineHeight });
            currentLine = char;
          }
        }
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine.length > 0 && lines.length < maxLines) {
      if (lines.length === maxLines - 1 && paragraphs.indexOf(paragraph) < paragraphs.length - 1) {
        currentLine = truncateWithEllipsis(ctx, currentLine, maxWidth);
      }
      lines.push({ text: currentLine, y: startY + lines.length * lineHeight });
    } else if (currentLine.length > 0 && lines.length >= maxLines) {
      const last = lines[lines.length - 1];
      last.text = truncateWithEllipsis(ctx, last.text, maxWidth);
    }
  }
  return lines;
}

function truncateWithEllipsis(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  const ellipsis = "...";
  if (ctx.measureText(text + ellipsis).width <= maxWidth) return text + ellipsis;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + ellipsis).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + ellipsis;
}

// ---------------------------------------------------------------------------
// Canvas drawing helpers
// ---------------------------------------------------------------------------

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  rating: number,
  x: number, y: number,
  size: number,
): void {
  ctx.font = `${size}px ${FONT_FAMILY}`;
  ctx.textBaseline = "top";
  const stars: string[] = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(i <= rating ? "★" : "☆");
  }
  // Gold color for stars — universal, not brand-dependent
  ctx.fillStyle = "#F59E0B";
  ctx.fillText(stars.join(" "), x, y);
}

// ---------------------------------------------------------------------------
// Template-specific layout configs
// ---------------------------------------------------------------------------

type LayoutConfig = {
  cardMarginX: number;
  cardTopY: number;
  cardPaddingX: number;
  cardPaddingTop: number;
  cardRadius: number;
  quoteSize: number;
  starSize: number;
  contentLineHeight: number;
  dividerGap: number;
  nameGap: number;
  subtitleGap: number;
  cardPaddingBottom: number;
  footerSize: number;
  footerBottomMargin: number;
  accentBarHeight: number;
};

function getLayout(template: TemplateSize, width: number, height: number): LayoutConfig {
  switch (template) {
    case "instagram-story":
      return {
        cardMarginX: 64,
        cardTopY: 320,
        cardPaddingX: 64,
        cardPaddingTop: 64,
        cardRadius: 32,
        quoteSize: 120,
        starSize: 38,
        contentLineHeight: 68,
        dividerGap: 48,
        nameGap: 40,
        subtitleGap: 48,
        cardPaddingBottom: 64,
        footerSize: 24,
        footerBottomMargin: 80,
        accentBarHeight: 6,
      };
    case "instagram-post":
      return {
        cardMarginX: 56,
        cardTopY: 80,
        cardPaddingX: 56,
        cardPaddingTop: 56,
        cardRadius: 28,
        quoteSize: 96,
        starSize: 32,
        contentLineHeight: 58,
        dividerGap: 40,
        nameGap: 32,
        subtitleGap: 40,
        cardPaddingBottom: 56,
        footerSize: 22,
        footerBottomMargin: 50,
        accentBarHeight: 5,
      };
    case "x-post":
      return {
        cardMarginX: 40,
        cardTopY: 40,
        cardPaddingX: 48,
        cardPaddingTop: 44,
        cardRadius: 20,
        quoteSize: 72,
        starSize: 26,
        contentLineHeight: 44,
        dividerGap: 28,
        nameGap: 24,
        subtitleGap: 32,
        cardPaddingBottom: 44,
        footerSize: 18,
        footerBottomMargin: 30,
        accentBarHeight: 4,
      };
  }
}

// ---------------------------------------------------------------------------
// Main: generate a branded testimonial image and return as Blob
// ---------------------------------------------------------------------------

export async function generateTestimonialImage(
  data: TestimonialImageData,
  template: TemplateSize,
): Promise<Blob> {
  const config = TEMPLATES[template];
  const fonts = FONT_CONFIGS[template];
  const { width, height } = config;
  const layout = getLayout(template, width, height);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to obtain 2D rendering context from canvas.");

  // Parse brand color to HSL
  const [bH, bS, bL] = hexToHSL(data.brandColor);

  // ==================================================
  // 1. Gradient background (brand color based)
  // ==================================================
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, hslColor(bH, bS, Math.max(bL - 12, 15)));
  grad.addColorStop(1, hslColor(bH + 25, Math.min(bS + 5, 100), Math.min(bL + 8, 60)));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // ==================================================
  // 2. Decorative bokeh circles
  // ==================================================
  const circles = [
    { cx: width * 0.15, cy: height * 0.17, r: width * 0.2, alpha: 0.07 },
    { cx: width * 0.85, cy: height * 0.78, r: width * 0.26, alpha: 0.06 },
    { cx: width * 0.5, cy: height * 0.5, r: width * 0.15, alpha: 0.04 },
  ];
  for (const c of circles) {
    ctx.fillStyle = `rgba(255,255,255,${c.alpha})`;
    ctx.beginPath();
    ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ==================================================
  // 3. Floating white card with shadow
  // ==================================================
  const cardX = layout.cardMarginX;
  const cardW = width - layout.cardMarginX * 2;
  const contentMaxWidth = cardW - layout.cardPaddingX * 2;

  // --------------------------------------------------
  // Calculate available space and auto-scale font size
  // --------------------------------------------------
  const subtitleParts: string[] = [];
  if (data.title) subtitleParts.push(data.title);
  if (data.company) subtitleParts.push(data.company);

  // Max card height = canvas height - cardTopY - footer space
  const maxCardH = height - layout.cardTopY - layout.footerBottomMargin - layout.footerSize - 40;

  // Fixed height elements (stars, divider, name, subtitle, paddings)
  const fixedHeight =
    layout.cardPaddingTop + layout.accentBarHeight +
    (data.rating !== null ? layout.starSize + 24 : 0) +
    layout.dividerGap + 4 + layout.nameGap +
    fonts.nameSize * 1.2 +
    (subtitleParts.length > 0 ? layout.subtitleGap : 0) +
    layout.cardPaddingBottom;

  const maxTextHeight = maxCardH - fixedHeight;

  // Try font sizes from default down to minimum, pick the largest that fits all text
  const minFontSize = Math.round(fonts.contentSize * 0.55);
  let bestFontSize = fonts.contentSize;
  let bestLineHeight = layout.contentLineHeight;
  let bestLines: WrappedLine[] = [];

  for (let trySize = fonts.contentSize; trySize >= minFontSize; trySize -= 2) {
    const tryLineHeight = Math.round(trySize * 1.62);
    ctx.font = `${trySize}px ${FONT_FAMILY}`;
    ctx.textBaseline = "top";
    // Use a generous maxLines so we don't truncate — we rely on height fitting
    const tryLines = wrapText(ctx, data.content, contentMaxWidth, tryLineHeight, 0, 100);
    const tryTextH = tryLines.length > 0 ? (tryLines.length - 1) * tryLineHeight + trySize : 0;

    if (tryTextH <= maxTextHeight) {
      bestFontSize = trySize;
      bestLineHeight = tryLineHeight;
      bestLines = tryLines;
      break;
    }
    // If even smallest font doesn't fit, we'll use it with truncation
    bestFontSize = trySize;
    bestLineHeight = tryLineHeight;
    bestLines = tryLines;
  }

  // If text still overflows at minimum font, truncate as last resort
  const maxLinesAtMin = Math.floor(maxTextHeight / bestLineHeight);
  if (bestLines.length > maxLinesAtMin) {
    ctx.font = `${bestFontSize}px ${FONT_FAMILY}`;
    bestLines = wrapText(ctx, data.content, contentMaxWidth, bestLineHeight, 0, maxLinesAtMin);
  }

  // Now calculate actual card height
  const textHeight = bestLines.length > 0 ? (bestLines.length - 1) * bestLineHeight + bestFontSize : 0;
  const cardContentHeight =
    (data.rating !== null ? layout.starSize + 24 : 0) +
    textHeight +
    layout.dividerGap + 4 + layout.nameGap +
    fonts.nameSize * 1.2 +
    (subtitleParts.length > 0 ? layout.subtitleGap : 0);

  const cardH = layout.cardPaddingTop + layout.accentBarHeight + cardContentHeight + layout.cardPaddingBottom;
  const cardY = layout.cardTopY;

  // Shadow layers (simulated)
  const shadowLayers = [
    { offsetY: 20, alpha: 0.06, expand: 8 },
    { offsetY: 10, alpha: 0.04, expand: 4 },
    { offsetY: 4, alpha: 0.02, expand: 2 },
  ];
  for (const s of shadowLayers) {
    ctx.fillStyle = `rgba(0,0,0,${s.alpha})`;
    drawRoundedRect(ctx, cardX - s.expand, cardY + s.offsetY - s.expand, cardW + s.expand * 2, cardH + s.expand * 2, layout.cardRadius + 4);
    ctx.fill();
  }

  // Card fill
  ctx.fillStyle = "rgba(255,255,255,0.97)";
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, layout.cardRadius);
  ctx.fill();

  // ==================================================
  // 4. Accent strip at top of card
  // ==================================================
  ctx.save();
  drawRoundedRect(ctx, cardX, cardY, cardW, layout.cardRadius * 2, layout.cardRadius);
  ctx.clip();
  ctx.fillStyle = data.brandColor;
  ctx.fillRect(cardX, cardY, cardW, layout.accentBarHeight);
  ctx.restore();

  // ==================================================
  // Now draw content inside the card
  // ==================================================
  const innerX = cardX + layout.cardPaddingX;
  let drawY = cardY + layout.accentBarHeight + layout.cardPaddingTop;

  // 5. (quote mark removed — 日本語圏では馴染みが薄いため)

  // 6. Star rating
  if (data.rating !== null) {
    drawStars(ctx, data.rating, innerX, drawY, layout.starSize);
    drawY += layout.starSize + 24;
  }

  // 7. Testimonial text (auto-scaled font size)
  ctx.fillStyle = "#1F2937";
  ctx.font = `${bestFontSize}px ${FONT_FAMILY}`;
  ctx.textBaseline = "top";

  // Re-wrap with actual Y positions
  const drawnLines = wrapText(ctx, data.content, contentMaxWidth, bestLineHeight, drawY, bestLines.length);
  for (const line of drawnLines) {
    ctx.fillText(line.text, innerX, line.y);
  }

  if (drawnLines.length > 0) {
    drawY = drawnLines[drawnLines.length - 1].y + bestLineHeight + layout.dividerGap;
  } else {
    drawY += layout.dividerGap;
  }

  // 8. Short accent divider (branded)
  ctx.strokeStyle = hslColor(bH, bS, bL, 0.35);
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(innerX, drawY);
  ctx.lineTo(innerX + 80, drawY);
  ctx.stroke();

  drawY += layout.nameGap;

  // 9. Customer name
  ctx.fillStyle = "#1F2937";
  ctx.font = `bold ${fonts.nameSize}px ${FONT_FAMILY}`;
  ctx.textBaseline = "top";
  ctx.fillText(data.name, innerX, drawY);
  drawY += Math.round(fonts.nameSize * 1.5);

  // 10. Title / Company
  if (subtitleParts.length > 0) {
    const subtitleSize = Math.round(fonts.nameSize * 0.85);
    ctx.fillStyle = "#6B7280";
    ctx.font = `${subtitleSize}px ${FONT_FAMILY}`;
    ctx.textBaseline = "top";
    const subtitleText = subtitleParts.join(" / ");
    if (ctx.measureText(subtitleText).width > contentMaxWidth) {
      ctx.fillText(truncateWithEllipsis(ctx, subtitleText, contentMaxWidth), innerX, drawY);
    } else {
      ctx.fillText(subtitleText, innerX, drawY);
    }
  }

  // ==================================================
  // 11. Footer — "Powered by VoiceHub" on gradient background
  // ==================================================
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `500 ${layout.footerSize}px ${FONT_FAMILY}`;
  ctx.textBaseline = "bottom";
  ctx.textAlign = "center";
  ctx.fillText("Powered by VoiceHub", width / 2, height - layout.footerBottomMargin);
  ctx.textAlign = "start";

  // ==================================================
  // 12. Export as PNG
  // ==================================================
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("canvas.toBlob() returned null."));
    }, "image/png");
  });
}
