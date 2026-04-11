"use client";

import { useState } from "react";
import { SALON_THEMES } from "@/lib/salon-themes";
import { SALON_INITIAL_DISPLAY_COUNT } from "@/lib/constants";
import { SalonLinkIcon } from "@/lib/salon-link-icons";
import { formatDate } from "@/lib/utils";
import type { SalonPageRow, SalonPageLinkRow, TestimonialRow } from "@/types/database";

type Testimonial = Pick<
  TestimonialRow,
  "id" | "name" | "title" | "company" | "avatar_url" | "rating" | "content" | "before_story" | "is_featured" | "submitted_at"
>;

export default function SalonPageClient({
  salonPage,
  links,
  testimonials,
  avgRating,
  totalCount,
}: {
  salonPage: SalonPageRow;
  links: SalonPageLinkRow[];
  testimonials: Testimonial[];
  avgRating: number;
  totalCount: number;
}) {
  const [displayCount, setDisplayCount] = useState(SALON_INITIAL_DISPLAY_COUNT);
  const [modalTestimonial, setModalTestimonial] = useState<Testimonial | null>(null);
  const theme = SALON_THEMES[salonPage.theme] ?? SALON_THEMES.natural;
  const accent = salonPage.accent_color;

  const visibleTestimonials = testimonials.slice(0, displayCount);
  const hasMore = displayCount < testimonials.length;

  const hasCover = !!salonPage.cover_image_url;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F0F1F3",
      }}
    >
      <div style={{
        maxWidth: 640,
        margin: "0 auto",
        background: theme.bodyBg,
        minHeight: "100vh",
        boxShadow: "0 0 40px rgba(0,0,0,0.06)",
      }}>
        {/* カバー画像 */}
        {hasCover && (
          <img
            src={salonPage.cover_image_url!}
            alt=""
            style={{
              width: "100%",
              aspectRatio: "3.2 / 1",
              objectFit: "cover",
              objectPosition: `center ${salonPage.cover_image_position ?? 50}%`,
              display: "block",
            }}
          />
        )}
        {/* プロフィール */}
        <header
          style={{
            background: hasCover ? theme.bodyBg : theme.headerBg,
            padding: "0 20px 24px",
            textAlign: "center",
          }}
        >
          {/* ロゴ */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            marginTop: 20,
            marginBottom: 12,
          }}>
            {salonPage.logo_url ? (
              <img
                src={salonPage.logo_url}
                alt={salonPage.salon_name}
                className="w-20 h-20 sm:w-28 sm:h-28"
                style={{
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `3px solid ${theme.cardBorder}`,
                }}
              />
            ) : (
              <div
                className="w-20 h-20 sm:w-28 sm:h-28 text-3xl sm:text-5xl"
                style={{
                  borderRadius: "50%",
                  background: accent,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                }}
              >
                {(salonPage.salon_name || "S").charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* サロン名 + リンクアイコン */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: theme.textPrimary,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              {salonPage.salon_name}
            </h1>
            {links.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {links.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={link.label}
                    style={{
                      color: theme.textSecondary,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textDecoration: "none",
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.6")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    <SalonLinkIcon icon={link.icon && link.icon !== "none" ? link.icon : "web"} size={22} color={theme.textSecondary} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {salonPage.tagline && (
            <p
              style={{
                fontSize: 14,
                color: theme.textSecondary,
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              {salonPage.tagline}
            </p>
          )}
        </header>

        {/* 評価サマリー */}
        {totalCount > 0 && (
          <section style={{ padding: "20px 20px 8px", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <StarRating rating={avgRating} color={accent} size={20} />
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: theme.textPrimary,
                }}
              >
                {avgRating.toFixed(1)}
              </span>
            </div>
            <p
              style={{
                fontSize: 13,
                color: theme.textSecondary,
                marginTop: 4,
              }}
            >
              お客様の声 {totalCount}件
            </p>
          </section>
        )}

        {/* レビュー一覧 */}
        <section style={{ padding: "12px 16px" }}>
          {salonPage.review_layout === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {visibleTestimonials.map((t) => (
                <ReviewCard key={t.id} testimonial={t} theme={theme} accent={accent} compact onTap={() => setModalTestimonial(t)} />
              ))}
            </div>
          ) : salonPage.review_layout === "wall" ? (
            <div style={{ columnCount: 2, columnGap: 10 }}>
              {visibleTestimonials.map((t) => (
                <div key={t.id} style={{ breakInside: "avoid", marginBottom: 10 }}>
                  <ReviewCard testimonial={t} theme={theme} accent={accent} />
                </div>
              ))}
            </div>
          ) : salonPage.review_layout === "list" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {visibleTestimonials.map((t, i) => (
                <ReviewListItem
                  key={t.id}
                  testimonial={t}
                  theme={theme}
                  accent={accent}
                  isLast={i === visibleTestimonials.length - 1}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {visibleTestimonials.map((t) => (
                <ReviewCard key={t.id} testimonial={t} theme={theme} accent={accent} />
              ))}
            </div>
          )}

          {hasMore && (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button
                onClick={() => setDisplayCount((c) => c + SALON_INITIAL_DISPLAY_COUNT)}
                style={{
                  background: "none",
                  border: `1px solid ${theme.cardBorder}`,
                  borderRadius: theme.borderRadius,
                  padding: "10px 24px",
                  fontSize: 13,
                  color: theme.textSecondary,
                  cursor: "pointer",
                }}
              >
                もっと見る
              </button>
            </div>
          )}

          {totalCount === 0 && (
            <p
              style={{
                textAlign: "center",
                padding: "40px 20px",
                fontSize: 14,
                color: theme.textSecondary,
              }}
            >
              まだお客様の声がありません
            </p>
          )}
        </section>

        {/* フッター */}
        <footer
          style={{
            textAlign: "center",
            padding: "32px 20px 24px",
            fontSize: 11,
            color: theme.textSecondary,
            opacity: 0.6,
          }}
        >
          Powered by{" "}
          <a
            href="https://voicehub.jp"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit", textDecoration: "underline" }}
          >
            VoiceHub
          </a>
        </footer>
      </div>

      {/* レビュー詳細モーダル */}
      {modalTestimonial && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setModalTestimonial(null)}
        >
          <div
            style={{
              background: theme.cardBg,
              borderRadius: 16,
              padding: 24,
              maxWidth: 480,
              width: "100%",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <ReviewCard testimonial={modalTestimonial} theme={theme} accent={accent} />
            <button
              onClick={() => setModalTestimonial(null)}
              style={{
                display: "block",
                margin: "16px auto 0",
                padding: "8px 24px",
                fontSize: 13,
                color: theme.textSecondary,
                background: "none",
                border: `1px solid ${theme.cardBorder}`,
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StarRating({ rating, color, size = 14 }: { rating: number; color: string; size?: number }) {
  return (
    <span style={{ color, fontSize: size, letterSpacing: "1px", lineHeight: 1 }}>
      {Array.from({ length: 5 }, (_, i) => {
        if (i < Math.floor(rating)) return "\u2605";
        if (i < rating) return "\u2605"; // 簡易: 切り捨て
        return "\u2606";
      }).join("")}
    </span>
  );
}

function ReviewCard({
  testimonial,
  theme,
  accent,
  compact,
  onTap,
}: {
  testimonial: Testimonial;
  theme: (typeof SALON_THEMES)[string];
  accent: string;
  compact?: boolean;
  onTap?: () => void;
}) {
  const t = testimonial;

  return (
    <div
      onClick={onTap}
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: theme.borderRadius,
        padding: compact ? 10 : 14,
        cursor: onTap ? "pointer" : undefined,
        display: "flex",
        flexDirection: "column",
        gap: compact ? 4 : 6,
      }}
    >
      {/* 星 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {t.rating && <StarRating rating={t.rating} color={accent} size={12} />}
      </div>

      {/* 本文 */}
      {t.content && (
        <>
        <p
          className="text-[11px] sm:text-[13px]"
          style={{
            lineHeight: 1.55,
            color: theme.textPrimary,
            margin: 0,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            display: compact ? "-webkit-box" : undefined,
            WebkitLineClamp: compact ? 4 : undefined,
            WebkitBoxOrient: compact ? ("vertical" as const) : undefined,
            overflow: compact ? "hidden" : undefined,
          }}
        >
          {t.content}
        </p>
        {compact && onTap && t.content.length > 60 && (
          <span style={{ fontSize: 11, color: accent, fontWeight: 500 }}>
            続きを読む
          </span>
        )}
        </>
      )}

      {/* 投稿者 + 日付 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 0 }}>
        <span style={{ fontSize: 11, color: theme.textSecondary }}>
          {t.name || "匿名"}
        </span>
        <span style={{ fontSize: 10, color: theme.textSecondary, opacity: 0.7 }}>
          {formatDate(t.submitted_at)}
        </span>
      </div>
    </div>
  );
}

function ReviewListItem({
  testimonial,
  theme,
  accent,
  isLast,
}: {
  testimonial: Testimonial;
  theme: (typeof SALON_THEMES)[string];
  accent: string;
  isLast: boolean;
}) {
  const t = testimonial;

  return (
    <div
      style={{
        padding: "10px 0",
        borderBottom: isLast ? "none" : `1px solid ${theme.cardBorder}`,
        display: "flex",
        gap: 10,
      }}
    >
      {/* アバター */}
      <div style={{ flexShrink: 0, paddingTop: 2 }}>
        {t.avatar_url ? (
          <img
            src={t.avatar_url}
            alt=""
            style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: accent,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {(t.name || "?").charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* コンテンツ */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: theme.textPrimary }}>
            {t.name || "匿名"}
          </span>
          {t.rating && <StarRating rating={t.rating} color={accent} size={10} />}
          <span style={{ fontSize: 9, color: theme.textSecondary, marginLeft: "auto" }}>
            {formatDate(t.submitted_at)}
          </span>
        </div>
        {t.content && (
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.5,
              color: theme.textSecondary,
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {t.content}
          </p>
        )}
      </div>
    </div>
  );
}
