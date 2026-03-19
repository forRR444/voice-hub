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
  "instagram-story": {
    width: 1080,
    height: 1920,
    label: "Instagram ストーリー",
  },
  "instagram-post": {
    width: 1080,
    height: 1080,
    label: "Instagram 投稿",
  },
  "x-post": {
    width: 1200,
    height: 675,
    label: "X (Twitter) 投稿",
  },
};

// ---------------------------------------------------------------------------
// Font configuration per template
// ---------------------------------------------------------------------------

type FontConfig = {
  contentSize: number;
  nameSize: number;
  maxLines: number;
};

const FONT_CONFIGS: Record<TemplateSize, FontConfig> = {
  "instagram-story": { contentSize: 42, nameSize: 36, maxLines: 18 },
  "instagram-post": { contentSize: 36, nameSize: 30, maxLines: 10 },
  "x-post": { contentSize: 28, nameSize: 24, maxLines: 6 },
};

const FONT_FAMILY =
  '"Hiragino Sans", "Noto Sans JP", "Hiragino Kaku Gothic ProN", sans-serif';

// ---------------------------------------------------------------------------
// Helper: detect whether a character is CJK (Japanese / Chinese / Korean)
// ---------------------------------------------------------------------------

function isCJK(char: string): boolean {
  const code = char.charCodeAt(0);
  return (
    (code >= 0x3000 && code <= 0x9fff) || // CJK Unified + punctuation + kana
    (code >= 0xf900 && code <= 0xfaff) || // CJK Compatibility Ideographs
    (code >= 0xff00 && code <= 0xffef) // Full-width forms
  );
}

// ---------------------------------------------------------------------------
// Helper: word-wrap text to fit within maxWidth
// For Japanese text, wrap at character level.
// Returns an array of { text, y } objects.
// ---------------------------------------------------------------------------

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
  // Split by explicit newlines first
  const paragraphs = text.split(/\r?\n/);

  for (const paragraph of paragraphs) {
    if (lines.length >= maxLines) break;

    if (paragraph.length === 0) {
      // Empty line — preserve blank line
      lines.push({ text: "", y: startY + lines.length * lineHeight });
      continue;
    }

    let currentLine = "";

    for (let i = 0; i < paragraph.length; i++) {
      if (lines.length >= maxLines) break;

      const char = paragraph[i];
      const testLine = currentLine + char;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine.length > 0) {
        // If we are at the last allowed line, truncate with ellipsis
        if (lines.length === maxLines - 1) {
          currentLine = truncateWithEllipsis(ctx, currentLine, maxWidth);
          lines.push({
            text: currentLine,
            y: startY + lines.length * lineHeight,
          });
          currentLine = "";
          break;
        }

        // For CJK characters we can break anywhere; for Latin text try to
        // break at the last space.
        if (isCJK(char)) {
          lines.push({
            text: currentLine,
            y: startY + lines.length * lineHeight,
          });
          currentLine = char;
        } else {
          const lastSpace = currentLine.lastIndexOf(" ");
          if (lastSpace > 0) {
            lines.push({
              text: currentLine.substring(0, lastSpace),
              y: startY + lines.length * lineHeight,
            });
            currentLine = currentLine.substring(lastSpace + 1) + char;
          } else {
            lines.push({
              text: currentLine,
              y: startY + lines.length * lineHeight,
            });
            currentLine = char;
          }
        }
      } else {
        currentLine = testLine;
      }
    }

    // Flush remaining text in currentLine
    if (currentLine.length > 0 && lines.length < maxLines) {
      if (lines.length === maxLines - 1 && paragraphs.indexOf(paragraph) < paragraphs.length - 1) {
        // More paragraphs remain — indicate truncation
        currentLine = truncateWithEllipsis(ctx, currentLine, maxWidth);
      }
      lines.push({
        text: currentLine,
        y: startY + lines.length * lineHeight,
      });
    } else if (currentLine.length > 0 && lines.length >= maxLines) {
      // We ran out of lines — retroactively add ellipsis to the last line
      const last = lines[lines.length - 1];
      last.text = truncateWithEllipsis(ctx, last.text, maxWidth);
    }
  }

  return lines;
}

// ---------------------------------------------------------------------------
// Helper: truncate a string so it fits within maxWidth with "..." appended
// ---------------------------------------------------------------------------

function truncateWithEllipsis(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  const ellipsis = "...";
  if (ctx.measureText(text + ellipsis).width <= maxWidth) {
    return text + ellipsis;
  }
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + ellipsis).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + ellipsis;
}

// ---------------------------------------------------------------------------
// Helper: draw star rating (★ filled, ☆ empty)
// ---------------------------------------------------------------------------

function drawStars(
  ctx: CanvasRenderingContext2D,
  rating: number,
  x: number,
  y: number,
  size: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.font = `${size}px ${FONT_FAMILY}`;
  ctx.textBaseline = "top";

  const stars: string[] = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(i <= rating ? "★" : "☆");
  }
  ctx.fillText(stars.join(" "), x, y);
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

  // Padding — 10 % of width on each side
  const paddingX = Math.round(width * 0.1);
  const contentWidth = width - paddingX * 2;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Failed to obtain 2D rendering context from canvas.");
  }

  // --------------------------------------------------
  // 1. White background
  // --------------------------------------------------
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, width, height);

  // --------------------------------------------------
  // 2. Accent bar at top
  // --------------------------------------------------
  const accentBarHeight = 8;
  ctx.fillStyle = data.brandColor;
  ctx.fillRect(0, 0, width, accentBarHeight);

  // --------------------------------------------------
  // 3. Decorative open-quote character
  // --------------------------------------------------
  let cursorY = accentBarHeight + Math.round(height * 0.06);

  const quoteSize = Math.round(fonts.contentSize * 2.8);
  ctx.fillStyle = data.brandColor;
  ctx.font = `bold ${quoteSize}px ${FONT_FAMILY}`;
  ctx.textBaseline = "top";
  ctx.fillText("\u201C", paddingX - Math.round(quoteSize * 0.1), cursorY);

  cursorY += quoteSize + Math.round(height * 0.02);

  // --------------------------------------------------
  // 4. Star rating (skip if null)
  // --------------------------------------------------
  if (data.rating !== null) {
    const starSize = Math.round(fonts.contentSize * 0.9);
    drawStars(ctx, data.rating, paddingX, cursorY, starSize, data.brandColor);
    cursorY += starSize + Math.round(height * 0.03);
  }

  // --------------------------------------------------
  // 5. Testimonial content with word-wrapping
  // --------------------------------------------------
  const contentLineHeight = Math.round(fonts.contentSize * 1.65);
  ctx.fillStyle = "#1A1A1A";
  ctx.font = `${fonts.contentSize}px ${FONT_FAMILY}`;
  ctx.textBaseline = "top";

  const lines = wrapText(
    ctx,
    data.content,
    contentWidth,
    contentLineHeight,
    cursorY,
    fonts.maxLines,
  );

  for (const line of lines) {
    ctx.fillText(line.text, paddingX, line.y);
  }

  if (lines.length > 0) {
    cursorY = lines[lines.length - 1].y + contentLineHeight + Math.round(height * 0.04);
  } else {
    cursorY += Math.round(height * 0.04);
  }

  // --------------------------------------------------
  // 6. Horizontal divider
  // --------------------------------------------------
  ctx.strokeStyle = "#E0E0E0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(paddingX, cursorY);
  ctx.lineTo(width - paddingX, cursorY);
  ctx.stroke();

  cursorY += Math.round(height * 0.035);

  // --------------------------------------------------
  // 7. Customer name (bold)
  // --------------------------------------------------
  ctx.fillStyle = "#1A1A1A";
  ctx.font = `bold ${fonts.nameSize}px ${FONT_FAMILY}`;
  ctx.textBaseline = "top";
  ctx.fillText(data.name, paddingX, cursorY);

  cursorY += Math.round(fonts.nameSize * 1.6);

  // --------------------------------------------------
  // 8. Title / Company (lighter gray)
  // --------------------------------------------------
  const subtitleParts: string[] = [];
  if (data.title) subtitleParts.push(data.title);
  if (data.company) subtitleParts.push(data.company);

  if (subtitleParts.length > 0) {
    const subtitleSize = Math.round(fonts.nameSize * 0.85);
    ctx.fillStyle = "#888888";
    ctx.font = `${subtitleSize}px ${FONT_FAMILY}`;
    ctx.textBaseline = "top";

    const subtitleText = subtitleParts.join(" / ");
    // Truncate if necessary
    if (ctx.measureText(subtitleText).width > contentWidth) {
      ctx.fillText(
        truncateWithEllipsis(ctx, subtitleText, contentWidth),
        paddingX,
        cursorY,
      );
    } else {
      ctx.fillText(subtitleText, paddingX, cursorY);
    }
  }

  // --------------------------------------------------
  // 9. "Powered by VoiceHub" footer
  // --------------------------------------------------
  const footerSize = Math.round(fonts.nameSize * 0.6);
  const footerY = height - Math.round(height * 0.05);
  ctx.fillStyle = "#BBBBBB";
  ctx.font = `${footerSize}px ${FONT_FAMILY}`;
  ctx.textBaseline = "bottom";
  ctx.textAlign = "center";
  ctx.fillText("Powered by VoiceHub", width / 2, footerY);

  // Reset alignment for safety
  ctx.textAlign = "start";

  // --------------------------------------------------
  // 10. Export canvas as PNG Blob
  // --------------------------------------------------
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("canvas.toBlob() returned null."));
      }
    }, "image/png");
  });
}
