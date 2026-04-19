"use client";

import { useState, useEffect, useRef, useId } from "react";
import { MapPin, ExternalLink, Clock, CalendarOff } from "lucide-react";
import { SALON_THEMES, generateThemeFromAccent } from "@/lib/salon-themes";
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
  const accent = salonPage.accent_color;
  const theme = generateThemeFromAccent(accent);

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
        {/* カバー画像 + ロゴ重なり */}
        <div style={{ position: "relative" }}>
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
            <div
              className={hasCover ? "-mt-10 sm:-mt-14" : "mt-5"}
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 12,
                position: "relative",
                zIndex: 2,
              }}
            >
              {salonPage.logo_url ? (
                <img
                  src={salonPage.logo_url}
                  alt={salonPage.salon_name}
                  className="w-20 h-20 sm:w-28 sm:h-28"
                  style={{
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: hasCover ? `3px solid ${theme.cardBg}` : `3px solid ${theme.cardBorder}`,
                    boxShadow: hasCover ? "0 2px 12px rgba(0,0,0,0.12)" : "none",
                    background: theme.cardBg,
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
                    border: hasCover ? `3px solid ${theme.cardBg}` : "none",
                    boxShadow: hasCover ? "0 2px 12px rgba(0,0,0,0.12)" : "none",
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

            {/* 評価サマリー（一番上） */}
            {totalCount > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <SvgStarRating rating={avgRating} color={accent} size={20} />
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
              </div>
            )}

            {/* サロン紹介文 */}
            {salonPage.description && (
              <ExpandableDescription text={salonPage.description} color={theme.textSecondary} accent={accent} />
            )}
          </header>
        </div>

        {/* メニュー・料金表 */}
        {(() => {
          const items = salonPage.menu_items;
          if (!items || items.length === 0) return null;
          return (
          <section style={{ padding: "0 16px" }}>
            <SectionDivider label="メニュー・料金" theme={theme} />
            <div
              style={{
                borderRadius: theme.borderRadius,
                border: `1px solid ${theme.cardBorder}`,
                overflow: "hidden",
              }}
            >
              {items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px 16px",
                    borderBottom: i < items.length - 1 ? `1px solid ${theme.cardBorder}` : "none",
                    background: theme.cardBg,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16 }}>
                    <span className="text-sm font-medium" style={{ color: theme.textPrimary }}>
                      {item.name}
                    </span>
                    <span className="text-sm font-semibold flex-shrink-0" style={{ color: accent }}>
                      {item.price}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs mt-0.5" style={{ color: theme.textSecondary, opacity: 0.7 }}>
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
          );
        })()}

        {/* 営業時間・定休日 */}
        {(salonPage.business_hours?.text || salonPage.closed_days) && (
          <section style={{ padding: "0 16px" }}>
            <SectionDivider label="営業時間" theme={theme} />
            <div className="space-y-3">
              {salonPage.business_hours?.text && (
                <div className="flex items-start gap-2">
                  <Clock size={16} style={{ color: accent, marginTop: 2, flexShrink: 0 }} />
                  <span
                    className="text-sm leading-relaxed"
                    style={{ color: theme.textPrimary, whiteSpace: "pre-wrap" }}
                  >
                    {salonPage.business_hours.text}
                  </span>
                </div>
              )}
              {salonPage.closed_days && (
                <div className="flex items-start gap-2">
                  <CalendarOff size={16} style={{ color: accent, marginTop: 2, flexShrink: 0 }} />
                  <span className="text-sm" style={{ color: theme.textPrimary }}>
                    <span className="font-medium">定休日: </span>
                    {salonPage.closed_days}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* セクションヘッダー */}
        {totalCount > 0 && (
          <div style={{
            padding: "20px 16px 4px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}>
            <div style={{ flex: 1, height: 1, background: theme.cardBorder }} />
            <span style={{
              fontSize: 12,
              fontWeight: 600,
              color: theme.textSecondary,
              letterSpacing: "0.04em",
              whiteSpace: "nowrap",
            }}>
              お客様の声
            </span>
            <div style={{ flex: 1, height: 1, background: theme.cardBorder }} />
          </div>
        )}

        {/* レビュー一覧 */}
        <section style={{ padding: "12px 16px" }}>
          {salonPage.review_layout === "grid" ? (
            <div className="salon-grid-layout">
              {visibleTestimonials.map((t, i) => (
                <ScrollRevealWrapper key={t.id} delay={i * 40}>
                  <ReviewCard testimonial={t} theme={theme} accent={accent} compact onTap={() => setModalTestimonial(t)} />
                </ScrollRevealWrapper>
              ))}
            </div>
          ) : salonPage.review_layout === "wall" ? (
            <div className="salon-wall-layout">
              {visibleTestimonials.map((t, i) => (
                <div key={t.id} style={{ breakInside: "avoid", marginBottom: 10 }}>
                  <ScrollRevealWrapper delay={i * 40}>
                    <ReviewCard testimonial={t} theme={theme} accent={accent} />
                  </ScrollRevealWrapper>
                </div>
              ))}
            </div>
          ) : salonPage.review_layout === "list" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {visibleTestimonials.map((t, i) => (
                <ScrollRevealWrapper key={t.id} delay={i * 50}>
                  <ReviewListItem
                    testimonial={t}
                    theme={theme}
                    accent={accent}
                    isLast={i === visibleTestimonials.length - 1}
                  />
                </ScrollRevealWrapper>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {visibleTestimonials.map((t, i) => (
                <ScrollRevealWrapper key={t.id} delay={i * 60}>
                  <ReviewCard testimonial={t} theme={theme} accent={accent} />
                </ScrollRevealWrapper>
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

        {/* アクセス */}
        {salonPage.address && (
          <section style={{ padding: "0 16px" }}>
            <SectionDivider label="アクセス" theme={theme} />
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin size={16} style={{ color: accent, marginTop: 2, flexShrink: 0 }} />
                <span className="text-sm" style={{ color: theme.textPrimary }}>
                  {salonPage.address}
                </span>
              </div>
              {salonPage.google_map_url && (
                <a
                  href={salonPage.google_map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium ml-6 transition-opacity duration-150 hover:opacity-70"
                  style={{ color: accent, textDecoration: "none" }}
                >
                  <ExternalLink size={14} />
                  Googleマップで見る
                </a>
              )}
            </div>
          </section>
        )}

        {/* フッター */}
        <footer
          style={{
            textAlign: "center",
            padding: "40px 20px 28px",
            borderTop: `1px solid ${theme.cardBorder}`,
          }}
        >
          <a
            href="https://voicehub.jp"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: theme.textSecondary,
              opacity: 0.5,
              textDecoration: "none",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
            </svg>
            Powered by VoiceHub
          </a>
        </footer>
      </div>

      {/* レビュー詳細モーダル */}
      {modalTestimonial && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "vh-fade-in 0.15s ease",
          }}
          onClick={() => setModalTestimonial(null)}
        >
          <style>{`@keyframes vh-fade-in { from { opacity: 0; } to { opacity: 1; } }`}</style>
          <div
            style={{
              background: theme.cardBg,
              borderRadius: 12,
              padding: 24,
              maxWidth: 480,
              width: "calc(100% - 32px)",
              maxHeight: "80vh",
              overflow: "auto",
              position: "relative",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalTestimonial(null)}
              style={{
                position: "absolute",
                top: 8,
                right: 12,
                background: "none",
                border: "none",
                fontSize: 22,
                cursor: "pointer",
                color: theme.textSecondary,
                lineHeight: 1,
                padding: 4,
              }}
              aria-label="閉じる"
            >
              ×
            </button>
            <ReviewCard testimonial={modalTestimonial} theme={theme} accent={accent} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── SVG Star Rating ─── */
function SvgStarRating({ rating, color, size = 14 }: { rating: number; color: string; size?: number }) {
  const prefix = useId();
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {Array.from({ length: 5 }, (_, i) => {
        const fill = Math.min(1, Math.max(0, rating - i));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              fill="#E5E7EB"
            />
            {fill > 0 && (
              <>
                <defs>
                  <clipPath id={`${prefix}-star-${i}`}>
                    <rect x="0" y="0" width={24 * fill} height="24" />
                  </clipPath>
                </defs>
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill={color}
                  clipPath={`url(#${prefix}-star-${i})`}
                />
              </>
            )}
          </svg>
        );
      })}
    </span>
  );
}

/* ─── Scroll Reveal Wrapper ─── */
function ScrollRevealWrapper({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`salon-scroll-reveal${isVisible ? " is-visible" : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─── Review Card ─── */
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
      onKeyDown={onTap ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onTap(); } } : undefined}
      role={onTap ? "button" : undefined}
      tabIndex={onTap ? 0 : undefined}
      className="salon-card"
      style={{
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}20`,
        borderRadius: theme.borderRadius,
        padding: compact ? 10 : 14,
        cursor: onTap ? "pointer" : undefined,
        display: "flex",
        flexDirection: "column",
        gap: compact ? 4 : 6,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
      }}
    >
      {/* 星 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {t.rating && <SvgStarRating rating={t.rating} color={accent} size={12} />}
      </div>

      {/* 本文（引用符装飾付き） */}
      {t.content && (
        <>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                top: -4,
                left: -2,
                fontSize: compact ? 28 : 36,
                lineHeight: 1,
                color: accent,
                opacity: 0.15,
                fontFamily: "Georgia, serif",
                userSelect: "none",
                pointerEvents: "none",
              }}
              aria-hidden="true"
            >
              &ldquo;
            </span>
            <p
              className="text-[11px] sm:text-[13px]"
              style={{
                lineHeight: 1.55,
                color: theme.textPrimary,
                margin: 0,
                paddingLeft: compact ? 12 : 16,
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
          </div>
          {compact && onTap && t.content.length > 60 && (
            <span style={{ fontSize: 11, color: accent, fontWeight: 500, paddingLeft: compact ? 12 : 16 }}>
              続きを読む
            </span>
          )}
        </>
      )}

      {/* 投稿者 + 日付 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
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

/* ─── Expandable Description ─── */
function ExpandableDescription({ text, color, accent }: { text: string; color: string; accent: string }) {
  const [expanded, setExpanded] = useState(false);
  const LINE_CLAMP = 3;

  return (
    <div style={{ marginTop: 16, textAlign: "left" }}>
      <p
        className="text-sm leading-relaxed"
        style={{
          color,
          whiteSpace: "pre-wrap",
          ...(!expanded ? {
            display: "-webkit-box",
            WebkitLineClamp: LINE_CLAMP,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          } : {}),
        }}
      >
        {text}
      </p>
      <div style={{ textAlign: "center" }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            marginTop: 4,
            fontSize: 13,
            fontWeight: 500,
            color: accent,
            cursor: "pointer",
          }}
        >
          {expanded ? "閉じる" : "もっと見る"}
        </button>
      </div>
    </div>
  );
}

/* ─── Section Divider ─── */
function SectionDivider({ label, theme }: { label: string; theme: (typeof SALON_THEMES)[string] }) {
  return (
    <div style={{
      padding: "24px 0 12px",
      display: "flex",
      alignItems: "center",
      gap: 12,
    }}>
      <div style={{ flex: 1, height: 1, background: theme.cardBorder }} />
      <span style={{
        fontSize: 12,
        fontWeight: 600,
        color: theme.textSecondary,
        letterSpacing: "0.04em",
        whiteSpace: "nowrap",
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: theme.cardBorder }} />
    </div>
  );
}

/* ─── Review List Item ─── */
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
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: theme.textPrimary }}>
            {t.name || "匿名"}
          </span>
          {t.rating && <SvgStarRating rating={t.rating} color={accent} size={10} />}
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
