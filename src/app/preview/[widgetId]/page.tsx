import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface Theme {
  mode?: "light" | "dark";
  brandColor?: string;
  showRating?: boolean;
  showAvatar?: boolean;
  showDate?: boolean;
  maxItems?: number;
  autoplay?: boolean;
}

interface Testimonial {
  id: string;
  name: string;
  title: string | null;
  company: string | null;
  avatar_url: string | null;
  rating: number;
  content: string;
  before_story: string | null;
  is_featured: boolean;
  submitted_at: string;
}

interface Widget {
  id: string;
  workspace_id: string;
  name: string;
  type: "carousel" | "grid";
  theme: Theme;
  filter_min_rating: number;
  only_featured: boolean;
}

function StarRating({ rating, color }: { rating: number; color: string }) {
  return (
    <span style={{ color, fontSize: "16px", letterSpacing: "2px" }}>
      {Array.from({ length: 5 }, (_, i) =>
        i < rating ? "\u2605" : "\u2606"
      ).join("")}
    </span>
  );
}

function AvatarFallback({ name, color }: { name: string; color: string }) {
  const letter = (name || "?").charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        backgroundColor: color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: 20,
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
}: {
  t: Testimonial;
  theme: Theme;
}) {
  const isDark = theme.mode === "dark";
  const brand = theme.brandColor || "#635BFF";

  return (
    <div
      style={{
        background: isDark ? "#1e1e2e" : "#ffffff",
        border: `1px solid ${isDark ? "#2e2e3e" : "#e5e7eb"}`,
        borderRadius: 12,
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minWidth: 300,
        maxWidth: 400,
        flexShrink: 0,
      }}
    >
      {theme.showRating !== false && (
        <StarRating rating={t.rating} color={brand} />
      )}
      <p
        style={{
          color: isDark ? "#e0e0e0" : "#374151",
          fontSize: 15,
          lineHeight: 1.6,
          margin: 0,
          flex: 1,
        }}
      >
        {t.content}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
        {theme.showAvatar !== false &&
          (t.avatar_url ? (
            <img
              src={t.avatar_url}
              alt={t.name}
              width={48}
              height={48}
              style={{ borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <AvatarFallback name={t.name} color={brand} />
          ))}
        <div>
          <div
            style={{
              fontWeight: 600,
              color: isDark ? "#f0f0f0" : "#111827",
              fontSize: 14,
            }}
          >
            {t.name}
          </div>
          {(t.title || t.company) && (
            <div
              style={{
                color: isDark ? "#9ca3af" : "#6b7280",
                fontSize: 13,
              }}
            >
              {[t.title, t.company].filter(Boolean).join(" / ")}
            </div>
          )}
          {theme.showDate && (
            <div
              style={{
                color: isDark ? "#6b7280" : "#9ca3af",
                fontSize: 12,
                marginTop: 2,
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
}: {
  params: Promise<{ widgetId: string }>;
}) {
  const { widgetId } = await params;
  const supabase = createAdminClient();

  const { data: widget, error: widgetError } = await supabase
    .from("widgets")
    .select("*")
    .eq("id", widgetId)
    .single<Widget>();

  if (widgetError || !widget) {
    notFound();
  }

  const theme: Theme = widget.theme ?? {};

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
    .select(
      "id, name, title, company, avatar_url, rating, content, before_story, is_featured, submitted_at"
    )
    .eq("workspace_id", widget.workspace_id)
    .eq("status", "approved")
    .gte("rating", widget.filter_min_rating ?? 1)
    .order("submitted_at", { ascending: false });

  if (widget.only_featured) {
    query = query.eq("is_featured", true);
  }

  const maxItems = theme.maxItems ?? 10;
  query = query.limit(maxItems);

  const { data: testimonials } = await query;
  const items: Testimonial[] = (testimonials as Testimonial[]) ?? [];

  const isDark = theme.mode === "dark";
  const brand = theme.brandColor || "#635BFF";

  return (
    <div
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: isDark ? "#121220" : "#f9fafb",
        color: isDark ? "#e0e0e0" : "#111827",
        padding: 24,
        minHeight: "100vh",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
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
              .grid-container {
                display: grid;
                grid-template-columns: repeat(1, 1fr);
                gap: 16px;
              }
              @media (min-width: 640px) {
                .grid-container { grid-template-columns: repeat(2, 1fr); }
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
              .marquee-container {
                overflow: hidden;
                position: relative;
              }
              .marquee-track {
                display: flex;
                gap: 24px;
                animation: marquee-scroll var(--marquee-duration, 30s) linear infinite;
                width: max-content;
              }
              .marquee-container:hover .marquee-track {
                animation-play-state: paused;
              }
              @keyframes marquee-scroll {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
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
                <TestimonialCard key={t.id} t={t} theme={theme} />
              ))}
              {items.map((t) => (
                <TestimonialCard key={`dup-${t.id}`} t={t} theme={theme} />
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
          </div>
        ) : (
          <div className="grid-container">
            {items.map((t) => (
              <TestimonialCard key={t.id} t={t} theme={theme} />
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
                  if (!carousel || !prevBtn || !nextBtn) return;

                  var scrollAmount = 340;
                  prevBtn.addEventListener('click', function() {
                    carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
                  });
                  nextBtn.addEventListener('click', function() {
                    carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
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
    </div>
  );
}
