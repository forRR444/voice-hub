import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: salonPage } = await supabase
    .from("salon_pages")
    .select("salon_name, tagline, theme, accent_color")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!salonPage) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#F7F8F9",
            fontSize: 32,
            color: "#1A1F36",
          }}
        >
          VoiceHub
        </div>
      ),
      { ...size }
    );
  }

  const { data: stats } = await supabase
    .from("testimonials")
    .select("rating")
    .eq("workspace_id", (
      await supabase
        .from("salon_pages")
        .select("workspace_id")
        .eq("slug", slug)
        .single()
    ).data?.workspace_id ?? "")
    .eq("status", "approved")
    .not("source", "in", '("sample","guide")');

  const testimonials = stats ?? [];
  const count = testimonials.length;
  const avg = count > 0
    ? (testimonials.reduce((s, t) => s + ((t as { rating: number | null }).rating ?? 0), 0) / count).toFixed(1)
    : "0.0";

  const accent = salonPage.accent_color || "#635BFF";

  const stars = Array.from({ length: 5 }, (_, i) =>
    i < Math.round(Number(avg)) ? "\u2605" : "\u2606"
  ).join("");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFFCF9",
          padding: 60,
        }}
      >
        <div
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: "#1A1F36",
            marginBottom: 16,
          }}
        >
          {salonPage.salon_name}
        </div>
        {salonPage.tagline && (
          <div
            style={{
              fontSize: 20,
              color: "#4F566B",
              marginBottom: 24,
            }}
          >
            {salonPage.tagline}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: 32, color: accent, letterSpacing: 2 }}>{stars}</span>
          <span style={{ fontSize: 32, fontWeight: 700, color: "#1A1F36" }}>{avg}</span>
        </div>
        <div style={{ fontSize: 18, color: "#4F566B" }}>
          お客様の声 {count}件
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 30,
            fontSize: 14,
            color: "#A3ACB9",
          }}
        >
          Powered by VoiceHub
        </div>
      </div>
    ),
    { ...size }
  );
}
