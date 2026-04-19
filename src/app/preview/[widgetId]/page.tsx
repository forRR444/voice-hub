import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { DEFAULT_BRAND_COLOR, TESTIMONIAL_SELECT_COLUMNS } from "@/lib/constants";
import type { WidgetRow, WidgetTheme, TestimonialRow } from "@/types/database";

export const dynamic = "force-dynamic";

/** Escape a string for safe embedding inside a <script> tag */
function safeJsonForScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
}

/** Validate hex color to prevent CSS/JS injection */
function sanitizeColor(color: string): string {
  return /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : DEFAULT_BRAND_COLOR;
}

type Testimonial = Omit<Pick<TestimonialRow, "id" | "name" | "title" | "company" | "avatar_url" | "rating" | "content" | "before_story" | "is_featured" | "submitted_at">, "rating"> & { rating: number };

function StarRating({ rating, color }: { rating: number; color: string }) {
  return (
    <span className="tc-stars" style={{ color, fontSize: "14px", letterSpacing: "1px" }}>
      {Array.from({ length: 5 }, (_, i) =>
        i < rating ? "\u2605" : "\u2606"
      ).join("")}
    </span>
  );
}

function AvatarFallback({ name, color, className }: { name: string; color: string; className?: string }) {
  const letter = (name || "?").charAt(0).toUpperCase();
  return (
    <div
      className={className}
      style={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        backgroundColor: color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 15,
        flexShrink: 0,
      }}
    >
      {letter}
    </div>
  );
}

function TestimonialCard({
  t,
  theme,
  clamp,
}: {
  t: Testimonial;
  theme: WidgetTheme;
  clamp?: boolean;
}) {
  const isDark = theme.mode === "dark";
  const brand = sanitizeColor(theme.brandColor || DEFAULT_BRAND_COLOR);

  return (
    <div
      className="tc"
      style={{
        background: isDark ? "#1e1e2e" : "#ffffff",
        border: `1px solid ${isDark ? "#2e2e3e" : "#e5e7eb"}`,
        borderRadius: 10,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        minWidth: 0,
        width: "100%",
        flexShrink: 0,
      }}
    >
      {theme.showRating !== false && (
        <StarRating rating={t.rating} color={brand} />
      )}
      <p
        className={clamp ? "tc-content clamp-content" : "tc-content"}
        style={{
          color: isDark ? "#e0e0e0" : "#374151",
          fontSize: 13,
          lineHeight: 1.6,
          margin: 0,
          flex: 1,
        }}
      >
        {t.content}
      </p>
      {clamp && t.content.length > 60 && (
        <button className="read-more-btn">もっと見る</button>
      )}
      <div className="tc-author" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
        {theme.showAvatar === true &&
          (t.avatar_url ? (
            <img
              className="tc-avatar"
              src={t.avatar_url}
              alt={t.name}
              width={36}
              height={36}
              style={{ borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <AvatarFallback className="tc-initials" name={t.name} color={brand} />
          ))}
        <div>
          <div
            className="tc-name"
            style={{
              fontWeight: 600,
              color: isDark ? "#f0f0f0" : "#111827",
              fontSize: 12,
            }}
          >
            {t.name || "お客様"}
          </div>
          {(t.title || t.company) && (
            <div
              className="tc-title"
              style={{
                color: isDark ? "#9ca3af" : "#6b7280",
                fontSize: 11,
              }}
            >
              {[t.title, t.company].filter(Boolean).join(" / ")}
            </div>
          )}
          {theme.showDate && (
            <div
              className="tc-date"
              style={{
                color: isDark ? "#6b7280" : "#9ca3af",
                fontSize: 11,
                marginTop: 1,
              }}
            >
              {new Date(t.submitted_at).toLocaleDateString("ja-JP")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function WidgetPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ widgetId: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { widgetId } = await params;
  const { type: typeOverride } = await searchParams;
  const supabase = createAdminClient();

  const { data: widget, error: widgetError } = await supabase
    .from("widgets")
    .select("*")
    .eq("id", widgetId)
    .single<WidgetRow>();

  if (widgetError || !widget) {
    notFound();
  }

  // Allow type override via query param (e.g. ?type=grid)
  if (typeOverride && ["carousel", "grid", "marquee", "list", "single", "wall", "dual-marquee", "badge"].includes(typeOverride)) {
    widget.type = typeOverride as WidgetRow["type"];
  }

  const theme: WidgetTheme = widget.theme ?? {} as WidgetTheme;

  // Fetch workspace for badge
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("subscription_status")
    .eq("id", widget.workspace_id)
    .single();

  const showBadge = workspace?.subscription_status === "free";

  // Fetch testimonials
  let query = supabase
    .from("testimonials")
    .select(TESTIMONIAL_SELECT_COLUMNS)
    .eq("workspace_id", widget.workspace_id)
    .eq("status", "approved")
    .not("source", "in", '("sample","guide")')
    .gte("rating", widget.filter_min_rating ?? 1)
    .order("submitted_at", { ascending: false });

  if (widget.only_featured) {
    query = query.eq("is_featured", true);
  }

  const maxItems = theme.maxItems ?? 10;
  query = query.limit(maxItems);

  const { data: testimonials } = await query;
  const items = (testimonials as Testimonial[]) ?? [];

  // "auto" mode is resolved client-side in embed.js; server preview treats it as light
  const isDark = theme.mode === "dark";
  const brand = sanitizeColor(theme.brandColor || DEFAULT_BRAND_COLOR);

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: isDark ? "#121220" : "#f9fafb",
        color: isDark ? "#e0e0e0" : "#111827",
        padding: "16px 12px",
        minHeight: "100vh",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
              .clamp-content {
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }
              .clamp-content.expanded {
                -webkit-line-clamp: unset;
                display: block;
              }
              .read-more-btn {
                background: none;
                border: none;
                padding: 0;
                margin-top: 4px;
                font-size: 12px;
                color: ${brand};
                cursor: pointer;
              }
              .read-more-btn:hover { text-decoration: underline; }
              .carousel-wrapper {
                overflow-x: auto;
                scroll-behavior: smooth;
                -webkit-overflow-scrolling: touch;
                scrollbar-width: none;
              }
              .carousel-wrapper::-webkit-scrollbar { display: none; }
              .carousel-track {
                display: flex;
                gap: 16px;
                padding: 4px;
              }
              .carousel-track > div {
                min-width: min(200px, 44vw);
                max-width: 280px;
              }
              .grid-container {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 16px;
              }
              @media (min-width: 1024px) {
                .grid-container { grid-template-columns: repeat(3, 1fr); }
              }
              .nav-btn {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                width: 40px;
                height: 40px;
                border-radius: 50%;
                border: 1px solid ${isDark ? "#3e3e4e" : "#d1d5db"};
                background: ${isDark ? "#1e1e2e" : "#ffffff"};
                color: ${isDark ? "#e0e0e0" : "#374151"};
                font-size: 18px;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2;
              }
              .nav-btn:hover { background: ${isDark ? "#2e2e3e" : "#f3f4f6"}; }
              .badge {
                text-align: center;
                margin-top: 20px;
              }
              .badge a {
                color: ${isDark ? "#6b7280" : "#9ca3af"};
                text-decoration: none;
                font-size: 12px;
              }
              .badge a:hover { text-decoration: underline; }
              .carousel-dots { display: flex; justify-content: center; gap: 6px; margin-top: 14px; }
              .carousel-dot { width: 8px; height: 8px; border-radius: 50%; border: none; cursor: pointer; padding: 0; transition: background 0.2s; }
              .carousel-dot.active { transform: scale(1.25); }
              .single-fade { transition: opacity 0.5s ease; }
              .marquee-container {
                overflow: hidden;
                position: relative;
              }
              .marquee-track {
                display: flex;
                gap: 16px;
                animation: marquee-scroll var(--marquee-duration, 30s) linear infinite;
                width: max-content;
              }
              .marquee-track > div {
                min-width: min(200px, 44vw);
                max-width: 280px;
              }
              .marquee-container:hover .marquee-track {
                animation-play-state: paused;
              }
              @keyframes marquee-scroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .dual-marquee-container {
                display: flex;
                flex-direction: column;
                gap: 16px;
                overflow: hidden;
              }
              .dual-marquee-row {
                overflow: hidden;
                position: relative;
              }
              .dual-marquee-track {
                display: flex;
                gap: 16px;
                width: max-content;
              }
              .dual-marquee-track > div {
                min-width: min(200px, 44vw);
                max-width: 280px;
              }
              .dual-marquee-track--left {
                animation: dual-marquee-left var(--dual-marquee-duration, 30s) linear infinite;
              }
              .dual-marquee-track--right {
                animation: dual-marquee-right var(--dual-marquee-duration, 30s) linear infinite;
              }
              .dual-marquee-container:hover .dual-marquee-track--left,
              .dual-marquee-container:hover .dual-marquee-track--right {
                animation-play-state: paused;
              }
              @keyframes dual-marquee-left {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              @keyframes dual-marquee-right {
                0% { transform: translateX(-50%); }
                100% { transform: translateX(0); }
              }
              @media (min-width: 640px) {
                .carousel-track > div,
                .marquee-track > div,
                .dual-marquee-track > div {
                  min-width: 280px;
                }
              }
              .list-container {
                display: flex;
                flex-direction: column;
                gap: 12px;
              }
              .single-container {
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 60vh;
              }
              .single-card {
                background: ${isDark ? "#1e1e2e" : "#ffffff"};
                border: 1px solid ${isDark ? "#2e2e3e" : "#e5e7eb"};
                border-radius: 16px;
                padding: 24px;
                max-width: 600px;
                width: 100%;
                text-align: center;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 20px;
              }
              @media (min-width: 640px) {
                .single-card { padding: 48px; }
              }
              .wall-container {
                column-count: 2;
                column-gap: 16px;
              }
              @media (min-width: 1024px) {
                .wall-container { column-count: 3; }
              }
              /* Mobile compact */
              @media (max-width: 639px) {
                .tc { padding: 10px !important; gap: 5px !important; border-radius: 8px !important; }
                .tc-stars { font-size: 12px !important; letter-spacing: 0.5px !important; }
                .tc-content { font-size: 12px !important; line-height: 1.5 !important; }
                .clamp-content { -webkit-line-clamp: 2 !important; }
                .tc-author { gap: 6px !important; margin-top: 3px !important; }
                .tc-avatar { width: 28px !important; height: 28px !important; }
                .tc-initials { width: 28px !important; height: 28px !important; font-size: 12px !important; }
                .tc-name { font-size: 11px !important; }
                .tc-title { font-size: 10px !important; }
                .tc-date { font-size: 10px !important; }
                .grid-container { gap: 8px !important; }
                .list-container { gap: 8px !important; }
                .wall-container { column-gap: 8px !important; }
                .wall-card-wrap { margin-bottom: 8px !important; }
                .carousel-track { gap: 12px !important; }
                .marquee-track { gap: 12px !important; }
                .dual-marquee-container { gap: 12px !important; }
                .dual-marquee-track { gap: 12px !important; }
                .single-card { padding: 20px !important; gap: 14px !important; border-radius: 12px !important; }
                .single-stars { font-size: 18px !important; letter-spacing: 2px !important; }
                .single-content { font-size: 15px !important; line-height: 1.6 !important; }
                .single-avatar { width: 48px !important; height: 48px !important; }
                .single-initials { width: 48px !important; height: 48px !important; font-size: 18px !important; }
                .single-name { font-size: 14px !important; }
                .single-subtitle { font-size: 12px !important; }
                .single-date { font-size: 11px !important; }
                .single-author { gap: 6px !important; }
              }
              .badge-container {
                display: inline-flex;
                align-items: center;
                gap: 12px;
                background: ${isDark ? "#1e1e2e" : "#ffffff"};
                border: 1px solid ${isDark ? "#2e2e3e" : "#e5e7eb"};
                border-radius: 12px;
                padding: 16px 24px;
              }
              .badge-rating {
                font-size: 36px;
                font-weight: 700;
                color: ${isDark ? "#f0f0f0" : "#111827"};
                line-height: 1;
              }
              .badge-stars {
                color: ${brand};
                font-size: 20px;
                letter-spacing: 2px;
              }
              .badge-count {
                font-size: 13px;
                color: ${isDark ? "#9ca3af" : "#6b7280"};
              }
              .badge-link {
                font-size: 12px;
                color: ${brand};
                text-decoration: none;
              }
              .badge-link:hover { text-decoration: underline; }
            `,
          }}
        />
        {items.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 48,
              color: isDark ? "#6b7280" : "#9ca3af",
            }}
          >
            表示できるテスティモニアルがありません
          </div>
        ) : widget.type === "marquee" ? (
          <div className="marquee-container">
            <div
              className="marquee-track"
              style={{ ["--marquee-duration" as string]: `${Math.max(items.length * 6, 20)}s` }}
            >
              {items.map((t) => (
                <TestimonialCard key={t.id} t={t} theme={theme} clamp />
              ))}
              {items.map((t) => (
                <TestimonialCard key={`dup-${t.id}`} t={t} theme={theme} clamp />
              ))}
            </div>
          </div>
        ) : widget.type === "carousel" ? (
          <div style={{ position: "relative" }}>
            <div className="carousel-wrapper" id="carousel">
              <div className="carousel-track">
                {items.map((t) => (
                  <TestimonialCard key={t.id} t={t} theme={theme} />
                ))}
              </div>
            </div>
            <button
              className="nav-btn"
              style={{ left: -20 }}
              onClick={undefined}
              aria-label="前へ"
              id="prev-btn"
            >
              &#8249;
            </button>
            <button
              className="nav-btn"
              style={{ right: -20 }}
              onClick={undefined}
              aria-label="次へ"
              id="next-btn"
            >
              &#8250;
            </button>
            {items.length > 1 && (
              <div className="carousel-dots" id="carousel-dots">
                {items.map((_, i) => (
                  <button
                    key={i}
                    className={`carousel-dot${i === 0 ? " active" : ""}`}
                    data-idx={i}
                    style={{ background: i === 0 ? brand : (isDark ? "#3e3e4e" : "#d1d5db") }}
                    aria-label={`${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : widget.type === "list" ? (
          <div className="list-container">
            {items.map((t) => (
              <TestimonialCard key={t.id} t={t} theme={theme} />
            ))}
          </div>
        ) : widget.type === "single" ? (
          <div className="single-container" id="single-container">
            {items[0] && (
              <div className="single-card single-fade" id="single-card">
                {theme.showRating !== false && (
                  <span style={{ color: brand, fontSize: "24px", letterSpacing: "3px" }} className="single-stars">
                    {Array.from({ length: 5 }, (_, i) => i < items[0].rating ? "\u2605" : "\u2606").join("")}
                  </span>
                )}
                <p className="single-content" style={{ color: isDark ? "#e0e0e0" : "#374151", fontSize: 18, lineHeight: 1.7, margin: 0 }}>
                  {items[0].content}
                </p>
                <div className="single-author" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginTop: 8 }}>
                  {theme.showAvatar === true && (
                    items[0].avatar_url ? (
                      <img src={items[0].avatar_url} alt={items[0].name} width={64} height={64} style={{ borderRadius: "50%", objectFit: "cover" }} className="single-avatar" />
                    ) : (
                      <div className="single-initials" style={{ width: 64, height: 64, borderRadius: "50%", backgroundColor: brand, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 24 }}>
                        {(items[0].name || "お客様").charAt(0).toUpperCase()}
                      </div>
                    )
                  )}
                  <div style={{ textAlign: "center" }}>
                    <div className="single-name" style={{ fontWeight: 700, color: isDark ? "#f0f0f0" : "#111827", fontSize: 16 }}>{items[0].name || "お客様"}</div>
                    <div className="single-subtitle" style={{ color: isDark ? "#9ca3af" : "#6b7280", fontSize: 13, marginTop: 2 }}>
                      {[items[0].title, items[0].company].filter(Boolean).join(" / ")}
                    </div>
                    {theme.showDate && (
                      <div className="single-date" style={{ color: isDark ? "#6b7280" : "#9ca3af", fontSize: 12, marginTop: 4 }}>
                        {new Date(items[0].submitted_at).toLocaleDateString("ja-JP")}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : widget.type === "wall" ? (
          <div className="wall-container">
            {items.map((t) => (
              <div key={t.id} className="wall-card-wrap" style={{ breakInside: "avoid", marginBottom: 16 }}>
                <TestimonialCard t={t} theme={theme} />
              </div>
            ))}
          </div>
        ) : widget.type === "dual-marquee" ? (
          (() => {
            const mid = Math.ceil(items.length / 2);
            const rowA = items.slice(0, mid);
            const rowB = items.length > 1 ? items.slice(mid) : items;
            const duration = `${Math.max(items.length * 6, 20)}s`;
            return (
              <div className="dual-marquee-container" style={{ ["--dual-marquee-duration" as string]: duration }}>
                <div className="dual-marquee-row">
                  <div className="dual-marquee-track dual-marquee-track--left">
                    {rowA.map((t) => (
                      <TestimonialCard key={t.id} t={t} theme={theme} clamp />
                    ))}
                    {rowA.map((t) => (
                      <TestimonialCard key={`dup-${t.id}`} t={t} theme={theme} clamp />
                    ))}
                  </div>
                </div>
                <div className="dual-marquee-row">
                  <div className="dual-marquee-track dual-marquee-track--right">
                    {rowB.map((t) => (
                      <TestimonialCard key={t.id} t={t} theme={theme} clamp />
                    ))}
                    {rowB.map((t) => (
                      <TestimonialCard key={`dup-${t.id}`} t={t} theme={theme} clamp />
                    ))}
                  </div>
                </div>
              </div>
            );
          })()
        ) : widget.type === "badge" ? (
          (() => {
            const avgRating = items.length > 0 ? items.reduce((sum, t) => sum + t.rating, 0) / items.length : 0;
            const roundedAvg = Math.round(avgRating * 10) / 10;
            const filledStars = Math.round(avgRating);
            return (
              <div className="badge-container">
                <div className="badge-rating">{roundedAvg}</div>
                <div>
                  <div className="badge-stars">
                    {Array.from({ length: 5 }, (_, i) => i < filledStars ? "\u2605" : "\u2606").join("")}
                  </div>
                  <div className="badge-count">{items.length}件のお客様の声</div>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="grid-container">
            {items.map((t) => (
              <TestimonialCard key={t.id} t={t} theme={theme} clamp />
            ))}
          </div>
        )}

        {showBadge && (
          <div className="badge">
            <a
              href={process.env.NEXT_PUBLIC_APP_URL || "https://voicehub.app"}
              target="_blank"
              rel="noopener noreferrer"
            >
              Powered by VoiceHub
            </a>
          </div>
        )}

        {widget.type === "carousel" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  var carousel = document.getElementById('carousel');
                  var prevBtn = document.getElementById('prev-btn');
                  var nextBtn = document.getElementById('next-btn');
                  var dots = document.querySelectorAll('.carousel-dot');
                  var brand = '${brand}';
                  var dimColor = '${isDark ? "#3e3e4e" : "#d1d5db"}';
                  if (!carousel || !prevBtn || !nextBtn) return;

                  var scrollAmount = 340;
                  prevBtn.addEventListener('click', function() {
                    carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                  });
                  nextBtn.addEventListener('click', function() {
                    carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                  });

                  function updateDots() {
                    var cards = carousel.querySelectorAll('.carousel-track > div');
                    var scrollLeft = carousel.scrollLeft;
                    var closest = 0;
                    var minDist = Infinity;
                    for (var c = 0; c < cards.length; c++) {
                      var dist = Math.abs(cards[c].offsetLeft - scrollLeft - 4);
                      if (dist < minDist) { minDist = dist; closest = c; }
                    }
                    for (var d = 0; d < dots.length; d++) {
                      dots[d].style.background = d === closest ? brand : dimColor;
                      dots[d].style.transform = d === closest ? 'scale(1.25)' : 'scale(1)';
                    }
                  }

                  for (var i = 0; i < dots.length; i++) {
                    dots[i].addEventListener('click', function() {
                      var idx = parseInt(this.getAttribute('data-idx'), 10);
                      var cards = carousel.querySelectorAll('.carousel-track > div');
                      if (cards[idx]) carousel.scrollTo({ left: cards[idx].offsetLeft - 4, behavior: 'smooth' });
                    });
                  }

                  var scrollTimer;
                  carousel.addEventListener('scroll', function() {
                    clearTimeout(scrollTimer);
                    scrollTimer = setTimeout(updateDots, 100);
                  });

                  ${
                    theme.autoplay !== false
                      ? `
                  var autoplayInterval = setInterval(function() {
                    var maxScroll = carousel.scrollWidth - carousel.clientWidth;
                    if (carousel.scrollLeft >= maxScroll - 10) {
                      carousel.scrollTo({ left: 0, behavior: 'smooth' });
                    } else {
                      carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                    }
                  }, 4000);

                  carousel.addEventListener('mouseenter', function() { clearInterval(autoplayInterval); });
                  carousel.addEventListener('mouseleave', function() {
                    autoplayInterval = setInterval(function() {
                      var maxScroll = carousel.scrollWidth - carousel.clientWidth;
                      if (carousel.scrollLeft >= maxScroll - 10) {
                        carousel.scrollTo({ left: 0, behavior: 'smooth' });
                      } else {
                        carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                      }
                    }, 4000);
                  });
                  `
                      : ""
                  }
                })();
              `,
            }}
          />
        )}

        {widget.type === "single" && items.length > 1 && theme.autoplay !== false && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  var items = ${safeJsonForScript(items.map(t => ({
                    rating: t.rating,
                    content: t.content,
                    name: t.name,
                    title: t.title,
                    company: t.company,
                    avatar_url: t.avatar_url,
                    submitted_at: t.submitted_at,
                  })))};
                  var brand = '${brand}';
                  var isDark = ${isDark};
                  var showRating = ${theme.showRating !== false};
                  var showAvatar = ${theme.showAvatar === true};
                  var showDate = ${!!theme.showDate};
                  var current = 0;
                  var card = document.getElementById('single-card');
                  if (!card || items.length < 2) return;

                  function starsHtml(rating) {
                    var s = '';
                    for (var i = 0; i < 5; i++) s += i < rating ? '\\u2605' : '\\u2606';
                    return s;
                  }

                  function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
                  function safeUrl(s) { var u=(s||'').trim(); return /^https?:\/\//i.test(u) ? esc(u) : ''; }

                  function renderItem(t) {
                    var html = '';
                    if (showRating) {
                      html += '<span class="single-stars" style="color:'+brand+';font-size:24px;letter-spacing:3px;">'+starsHtml(t.rating)+'</span>';
                    }
                    html += '<p class="single-content" style="color:'+(isDark?'#e0e0e0':'#374151')+';font-size:18px;line-height:1.7;margin:0;">'+esc(t.content)+'</p>';
                    html += '<div style="display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:8px;">';
                    if (showAvatar) {
                      if (t.avatar_url) {
                        html += '<img class="single-avatar" src="'+safeUrl(t.avatar_url)+'" width="64" height="64" style="border-radius:50%;object-fit:cover;">';
                      } else {
                        html += '<div class="single-initials" style="width:64px;height:64px;border-radius:50%;background:'+brand+';color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:24px;">'+esc((t.name||'お客様').charAt(0).toUpperCase())+'</div>';
                      }
                    }
                    html += '<div style="text-align:center;">';
                    html += '<div class="single-name" style="font-weight:700;color:'+(isDark?'#f0f0f0':'#111827')+';font-size:16px;">'+esc(t.name||'お客様')+'</div>';
                    var sub = [t.title, t.company].filter(Boolean).join(' / ');
                    if (sub) html += '<div class="single-subtitle" style="color:'+(isDark?'#9ca3af':'#6b7280')+';font-size:13px;margin-top:2px;">'+esc(sub)+'</div>';
                    if (showDate) html += '<div class="single-date" style="color:'+(isDark?'#6b7280':'#9ca3af')+';font-size:12px;margin-top:4px;">'+new Date(t.submitted_at).toLocaleDateString('ja-JP')+'</div>';
                    html += '</div></div>';
                    return html;
                  }

                  setInterval(function() {
                    card.style.opacity = '0';
                    setTimeout(function() {
                      current = (current + 1) % items.length;
                      card.innerHTML = renderItem(items[current]);
                      card.style.opacity = '1';
                    }, 500);
                  }, 5000);
                })();
              `,
            }}
          />
        )}

        {/* Read more toggle script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                document.addEventListener('click', function(e) {
                  var btn = e.target.closest('.read-more-btn');
                  if (!btn) return;
                  var card = btn.previousElementSibling;
                  if (!card || !card.classList.contains('clamp-content')) return;
                  var isExpanded = card.classList.toggle('expanded');
                  btn.textContent = isExpanded ? '閉じる' : 'もっと見る';
                });
              })();
            `,
          }}
        />
    </div>
  );
}
