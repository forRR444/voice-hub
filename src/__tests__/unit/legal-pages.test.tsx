import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string } & Record<string, unknown>) => {
    const { priority, ...safeRest } = rest as Record<string, unknown>;
    void priority;
    // eslint-disable-next-line @next/next/no-img-element -- mocking next/image in test
    return <img src={src} alt={alt} {...safeRest} />;
  },
}));

import TermsPage from "@/app/terms/page";
import PrivacyPage from "@/app/privacy/page";
import SignupClient from "@/app/signup/signup-client";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signUp: vi.fn(), signInWithOAuth: vi.fn() },
  }),
}));

vi.mock("@/lib/auth-utils", () => ({
  preserveTemplate: vi.fn(),
}));

vi.mock("@/hooks/use-google-oauth", () => ({
  useGoogleOAuth: () => ({ handleGoogleLogin: vi.fn() }),
}));

// ─── 利用規約ページ ──────────────────────────────────────────────────

describe("利用規約ページ", () => {
  it("見出し「利用規約」が表示される", () => {
    render(<TermsPage />);
    const headings = screen.getAllByRole("heading", { name: "利用規約" });
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it("ヘッダーのVoiceHubリンクがhref=/を持つ", () => {
    render(<TermsPage />);
    const links = screen.getAllByRole("link").filter((el) => /VoiceHub/.test(el.textContent ?? ""));
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toHaveAttribute("href", "/");
  });

  it("第1条（適用）が存在する", () => {
    render(<TermsPage />);
    expect(screen.getByText("第1条（適用）")).toBeInTheDocument();
  });

  it("第18条（準拠法・裁判管轄）が存在する", () => {
    render(<TermsPage />);
    expect(screen.getByText("第18条（準拠法・裁判管轄）")).toBeInTheDocument();
  });

  it("最終更新日が表示される", () => {
    render(<TermsPage />);
    expect(screen.getByText("最終更新日: 2026年3月20日")).toBeInTheDocument();
  });
});

// ─── プライバシーポリシーページ ──────────────────────────────────────

describe("プライバシーポリシーページ", () => {
  it("見出し「プライバシーポリシー」が表示される", () => {
    render(<PrivacyPage />);
    const headings = screen.getAllByRole("heading", { name: "プライバシーポリシー" });
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it("ヘッダーのVoiceHubリンクがhref=/を持つ", () => {
    render(<PrivacyPage />);
    const links = screen.getAllByRole("link").filter((el) => /VoiceHub/.test(el.textContent ?? ""));
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toHaveAttribute("href", "/");
  });

  it("外部サービステーブルにSupabaseがある", () => {
    render(<PrivacyPage />);
    const cells = screen.getAllByRole("cell", { name: "Supabase" });
    expect(cells.length).toBeGreaterThanOrEqual(1);
  });

  it("外部サービステーブルにStripeがある", () => {
    render(<PrivacyPage />);
    const cells = screen.getAllByRole("cell", { name: "Stripe" });
    expect(cells.length).toBeGreaterThanOrEqual(1);
  });

  it("最終更新日が表示される", () => {
    render(<PrivacyPage />);
    expect(screen.getByText("最終更新日: 2026年3月23日")).toBeInTheDocument();
  });
});

// ─── サインアップページからのリーガルリンク ──────────────────────────

describe("サインアップページからのリーガルリンク", () => {
  it("利用規約リンクがhref=/termsを持つ", () => {
    render(<SignupClient />);
    const termsLink = screen.getByRole("link", { name: "利用規約" });
    expect(termsLink).toHaveAttribute("href", "/terms");
  });

  it("プライバシーポリシーリンクがhref=/privacyを持つ", () => {
    render(<SignupClient />);
    const privacyLink = screen.getByRole("link", { name: "プライバシーポリシー" });
    expect(privacyLink).toHaveAttribute("href", "/privacy");
  });
});
