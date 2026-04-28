import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock("@/app/components/testimonial-toast", () => ({
  default: () => null,
}));

vi.mock("@/app/components/widget-demo", () => ({
  default: () => <div data-testid="widget-demo-stub" />,
}));

vi.mock("@/app/components/public-header", () => ({
  default: () => <header data-testid="public-header" />,
}));

vi.mock("@/app/posthog-provider", () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string } & Record<string, unknown>) => {
    const { priority, ...safeRest } = rest as Record<string, unknown>;
    void priority;
    // eslint-disable-next-line @next/next/no-img-element -- mocking next/image in test
    return <img src={src} alt={alt} {...safeRest} />;
  },
}));

vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "--font-inter", className: "inter" }),
}));

vi.mock("next/script", () => ({
  default: () => null,
}));

import HomePage from "@/app/page";
import { metadata } from "@/app/layout";

// ─── ランディングページ本体 ────────────────────────────────────────────

describe("ランディングページ - ヒーローセクション", () => {
  it("メインコピーが表示される", () => {
    render(<HomePage />);
    expect(screen.getByText(/お客様の声を集めて/)).toBeInTheDocument();
    expect(screen.getByText(/HPにもSNSにも/)).toBeInTheDocument();
  });

  it("CTAリンク「無料で試してみる」が表示される", () => {
    render(<HomePage />);
    const ctaLinks = screen
      .getAllByRole("link")
      .filter((el) => /無料で試してみる/.test(el.textContent ?? ""));
    expect(ctaLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("CTAリンクがhref=/tryを指す", () => {
    render(<HomePage />);
    const ctaLinks = screen
      .getAllByRole("link")
      .filter((el) => /無料で試してみる/.test(el.textContent ?? ""));
    expect(ctaLinks[0]).toHaveAttribute("href", "/try");
  });

  it("先着10名バッジが表示される", () => {
    render(<HomePage />);
    expect(screen.getAllByText(/先着10名/).length).toBeGreaterThanOrEqual(1);
  });

  it("クレジットカード不要の記載がある", () => {
    render(<HomePage />);
    expect(screen.getAllByText("クレジットカード不要").length).toBeGreaterThanOrEqual(1);
  });
});

describe("ランディングページ - 主要セクション", () => {
  it("Pain→Solutionセクションが表示される", () => {
    render(<HomePage />);
    expect(screen.getByText("こんな面倒から解放されます。")).toBeInTheDocument();
  });

  it("できることセクション見出しが表示される", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "できること" })).toBeInTheDocument();
  });

  it("2ステップセクション見出しが表示される", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: /2ステップ/ })).toBeInTheDocument();
  });

  it("料金セクションに¥0が表示される", () => {
    render(<HomePage />);
    expect(screen.getAllByText("¥0").length).toBeGreaterThanOrEqual(1);
  });

  it("FAQセクション見出しが表示される", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: "よくある質問" })).toBeInTheDocument();
  });
});

describe("ランディングページ - フッター", () => {
  it("copyrightが表示される", () => {
    render(<HomePage />);
    expect(screen.getByText(/© 2026 VoiceHub/)).toBeInTheDocument();
  });
});

// ─── メタデータ (layout.tsx) ──────────────────────────────────────────

describe("ランディングページ - OGPメタデータ", () => {
  it("titleにVoiceHubが含まれる", () => {
    expect(metadata.title).toBeDefined();
    expect(String(metadata.title)).toContain("VoiceHub");
  });

  it("og:titleが設定されている", () => {
    expect(metadata.openGraph?.title).toBeDefined();
    expect(String(metadata.openGraph?.title)).toContain("VoiceHub");
  });

  it("og:descriptionが設定されている", () => {
    expect(metadata.openGraph?.description).toBeTruthy();
  });

  it("og:imageにVoiceHub.pngが含まれる", () => {
    const images = metadata.openGraph?.images;
    expect(images).toBeDefined();
    const serialized = JSON.stringify(images);
    expect(serialized).toContain("VoiceHub.png");
  });

  it("twitter:cardがsummary_large_imageである", () => {
    const twitter = metadata.twitter;
    expect(twitter).toBeDefined();
    const serialized = JSON.stringify(twitter);
    expect(serialized).toContain("summary_large_image");
  });
});
