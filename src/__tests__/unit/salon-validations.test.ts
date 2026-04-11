import { describe, it, expect } from "vitest";
import { salonPageSchema, salonLinkSchema } from "@/lib/validations";

describe("salonPageSchema", () => {
  const valid = {
    salon_name: "Nail Salon Miki",
    tagline: "ジェルネイル専門",
    theme: "natural" as const,
    accent_color: "#C4A882",
    links: [],
  };

  it("正常なデータでパスする", () => {
    expect(salonPageSchema.safeParse(valid).success).toBe(true);
  });

  it("サロン名が空でエラー", () => {
    expect(salonPageSchema.safeParse({ ...valid, salon_name: "" }).success).toBe(false);
  });

  it("tagline 100文字でパス、101文字でエラー", () => {
    expect(salonPageSchema.safeParse({ ...valid, tagline: "あ".repeat(100) }).success).toBe(true);
    expect(salonPageSchema.safeParse({ ...valid, tagline: "あ".repeat(101) }).success).toBe(false);
  });

  it("不正なthemeでエラー", () => {
    expect(salonPageSchema.safeParse({ ...valid, theme: "invalid" }).success).toBe(false);
  });

  it("不正なaccent_colorでエラー", () => {
    expect(salonPageSchema.safeParse({ ...valid, accent_color: "red" }).success).toBe(false);
  });

  it("links 3つでパス、4つでエラー", () => {
    const link = { label: "LINE", url: "https://lin.ee/xxx" };
    expect(salonPageSchema.safeParse({ ...valid, links: [link, link, link] }).success).toBe(true);
    expect(salonPageSchema.safeParse({ ...valid, links: [link, link, link, link] }).success).toBe(false);
  });
});

describe("salonLinkSchema", () => {
  it("正常なリンクでパスする", () => {
    expect(salonLinkSchema.safeParse({ label: "LINE", url: "https://lin.ee/xxx" }).success).toBe(true);
  });

  it("ラベル空でエラー", () => {
    expect(salonLinkSchema.safeParse({ label: "", url: "https://example.com" }).success).toBe(false);
  });

  it("URL不正でエラー", () => {
    expect(salonLinkSchema.safeParse({ label: "LINE", url: "not-a-url" }).success).toBe(false);
  });
});
