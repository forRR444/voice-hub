"use client";

import { useParams } from "next/navigation";
import Script from "next/script";
import { isString } from "@/lib/type-guards";

const panels = [
  { label: "White", bg: "#ffffff", text: "#111827", heading: "#000000", link: "#2563eb" },
  { label: "Cream", bg: "#fdf6e3", text: "#5c4b28", heading: "#3b2f14", link: "#b58900" },
  { label: "Light Gray", bg: "#f3f4f6", text: "#374151", heading: "#111827", link: "#4f46e5" },
  { label: "Dark Navy", bg: "#0f172a", text: "#e2e8f0", heading: "#f8fafc", link: "#60a5fa" },
  { label: "Dark Gray", bg: "#1a1a2e", text: "#d1d5db", heading: "#f3f4f6", link: "#a78bfa" },
  { label: "Warm Dark", bg: "#292524", text: "#e7e5e4", heading: "#fafaf9", link: "#fb923c" },
];

export default function AutoTestPage() {
  const params = useParams();
  const widgetId = isString(params.widgetId) ? params.widgetId : "";

  return (
    <>
      <Script src="/widget/v1/embed.js" strategy="afterInteractive" />
      <div style={{ padding: "24px", background: "#f9fafb", minHeight: "100vh" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px", color: "#111827" }}>
          Auto Mode Preview
        </h1>
        <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "24px" }}>
          Widget ID:{" "}
          <code style={{ background: "#e5e7eb", padding: "2px 6px", borderRadius: "4px" }}>
            {widgetId}
          </code>
          <span style={{ marginLeft: "12px", color: "#ef4444" }}>
            ※ ウィジェットのモードを「自動適応」に設定してからテストしてください
          </span>
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))",
            gap: "20px",
          }}
        >
          {panels.map((p) => (
            <div
              key={p.label}
              style={{
                background: p.bg,
                color: p.text,
                borderRadius: "12px",
                padding: "24px",
                minHeight: "320px",
              }}
            >
              <div
                style={{
                  marginBottom: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2 style={{ fontSize: "16px", fontWeight: 600, color: p.heading }}>{p.label}</h2>
                <span style={{ fontSize: "11px", fontFamily: "monospace", opacity: 0.6 }}>
                  {p.bg}
                </span>
              </div>
              <p style={{ fontSize: "13px", marginBottom: "8px" }}>
                サンプルテキスト —{" "}
                <a href="#" style={{ color: p.link, textDecoration: "underline" }}>
                  リンクの色
                </a>
              </p>
              <div
                data-testimonial-widget={widgetId}
                data-theme="auto"
                style={{ marginTop: "12px" }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
