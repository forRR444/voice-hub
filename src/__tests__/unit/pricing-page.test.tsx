import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock("next/image", () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string } & Record<string, unknown>) => {
    const { priority, ...safeRest } = rest as Record<string, unknown>;
    void priority;
    // eslint-disable-next-line @next/next/no-img-element -- mocking next/image in test
    return <img src={src} alt={alt} {...safeRest} />;
  },
}));

// IS_BETA を制御可能にする
vi.mock("@/lib/plan", () => ({
  get IS_BETA() {
    return (globalThis as { __IS_BETA__?: boolean }).__IS_BETA__ ?? false;
  },
}));

beforeEach(() => {
  (globalThis as { __IS_BETA__?: boolean }).__IS_BETA__ = false;
});

function setBeta(on: boolean) {
  (globalThis as { __IS_BETA__?: boolean }).__IS_BETA__ = on;
}

// dynamic import after beforeEach sets mode
async function renderPricing() {
  const mod = await import("@/app/pricing/page");
  const Page = mod.default;
  return render(<Page />);
}

// ─── 基本表示 ─────────────────────────────────────────────────────────

describe("料金プランページ - 基本表示", () => {
  it("H1「シンプルな料金プラン」が表示される", async () => {
    await renderPricing();
    expect(
      screen.getByRole("heading", { level: 1, name: "シンプルな料金プラン" })
    ).toBeInTheDocument();
  });

  it("VoiceHubロゴリンクがhref=/を持つ", async () => {
    await renderPricing();
    const logoLinks = screen
      .getAllByRole("link")
      .filter((el) => /VoiceHub/.test(el.textContent ?? ""));
    expect(logoLinks.length).toBeGreaterThanOrEqual(1);
    expect(logoLinks[0]).toHaveAttribute("href", "/");
  });

  it("ログインリンクがhref=/loginを持つ", async () => {
    await renderPricing();
    const loginLinks = screen.getAllByRole("link", { name: "ログイン" });
    expect(loginLinks.length).toBeGreaterThanOrEqual(1);
    expect(loginLinks[0]).toHaveAttribute("href", "/login");
  });
});

// ─── IS_BETA 分岐 ─────────────────────────────────────────────────────

describe("料金プランページ - 説明文の分岐", () => {
  it("通常時は標準の案内文が表示される", async () => {
    setBeta(false);
    await renderPricing();
    expect(
      screen.getByText("あなたのビジネスに合ったプランをお選びください。")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("現在ベータ版につき、全機能を無料で使えます。")
    ).not.toBeInTheDocument();
  });

  it("ベータ時は特別価格の案内が表示される", async () => {
    setBeta(true);
    await renderPricing();
    expect(screen.getByText("現在ベータ版につき、全機能を無料で使えます。")).toBeInTheDocument();
    expect(
      screen.getByText("ベータユーザーには正式リリース後も特別価格を適用します。")
    ).toBeInTheDocument();
  });
});

// ─── Freeプランカード ─────────────────────────────────────────────────

describe("料金プランページ - Freeプランカード", () => {
  it("「Freeプラン」ラベルが表示される", async () => {
    await renderPricing();
    expect(screen.getByText(/Free プラン|Freeプラン/)).toBeInTheDocument();
  });

  it("価格「¥0」が表示される", async () => {
    await renderPricing();
    expect(screen.getByText("¥0")).toBeInTheDocument();
  });

  it("「クレジットカード不要」noteが表示される", async () => {
    await renderPricing();
    expect(screen.getByText("クレジットカード不要")).toBeInTheDocument();
  });

  it("Freeプランカード内のCTAがhref=/tryを持つ", async () => {
    const { container } = await renderPricing();
    const freeCard = Array.from(
      container.querySelectorAll<HTMLDivElement>("div.bg-white.rounded-xl")
    ).find((el) => /Free/.test(el.textContent ?? ""));
    expect(freeCard).toBeDefined();
    if (!freeCard) return;
    const cta = within(freeCard).getByRole("link", { name: "無料で始める" });
    expect(cta).toHaveAttribute("href", "/try");
  });
});

// ─── Proプランカード ──────────────────────────────────────────────────

describe("料金プランページ - Proプランカード", () => {
  it("「Proプラン」ラベルが表示される", async () => {
    await renderPricing();
    expect(screen.getAllByText(/Pro ?プラン/).length).toBeGreaterThanOrEqual(1);
  });

  it("価格「¥1,980」が表示される", async () => {
    await renderPricing();
    expect(screen.getByText("¥1,980")).toBeInTheDocument();
  });

  it("「おすすめ」バッジが表示される", async () => {
    await renderPricing();
    expect(screen.getByText("おすすめ")).toBeInTheDocument();
  });

  it("通常時のProプランCTAが「Proプランを始める」でhref=/signupを指す", async () => {
    setBeta(false);
    const { container } = await renderPricing();
    const proCard = Array.from(
      container.querySelectorAll<HTMLDivElement>("div.bg-white.rounded-xl")
    ).find((el) => /Pro/.test(el.textContent ?? ""));
    expect(proCard).toBeDefined();
    if (!proCard) return;
    const cta = within(proCard).getByRole("link", { name: "Proプランを始める" });
    expect(cta).toHaveAttribute("href", "/signup");
  });

  it("ベータ時のProプランCTAが「無料で始める」でhref=/tryを指す", async () => {
    setBeta(true);
    const { container } = await renderPricing();
    const proCard = Array.from(
      container.querySelectorAll<HTMLDivElement>("div.bg-white.rounded-xl")
    ).find((el) => /Pro/.test(el.textContent ?? ""));
    expect(proCard).toBeDefined();
    if (!proCard) return;
    const cta = within(proCard).getByRole("link", { name: "無料で始める" });
    expect(cta).toHaveAttribute("href", "/try");
  });

  it("通常時のProプランnoteが「いつでもキャンセル可能」になる", async () => {
    setBeta(false);
    await renderPricing();
    expect(screen.getAllByText("いつでもキャンセル可能").length).toBeGreaterThanOrEqual(1);
  });

  it("ベータ時のProプランnoteが「ベータ中は全機能無料」になる", async () => {
    setBeta(true);
    await renderPricing();
    expect(screen.getByText("ベータ中は全機能無料")).toBeInTheDocument();
  });
});

// ─── フッター文言 ────────────────────────────────────────────────────

describe("料金プランページ - フッター文言", () => {
  it("ベータ時はフッターにベータ無料の案内が表示される", async () => {
    setBeta(true);
    await renderPricing();
    expect(
      screen.getByText("いつでもキャンセル可能 · ベータ期間中は全機能無料でご利用いただけます")
    ).toBeInTheDocument();
  });
});

// ─── メタデータ ───────────────────────────────────────────────────────

describe("料金プランページ - メタデータ", () => {
  it("titleに「料金プラン」が含まれる", async () => {
    const { metadata } = await import("@/app/pricing/page");
    expect(String(metadata.title)).toContain("料金プラン");
  });
});
