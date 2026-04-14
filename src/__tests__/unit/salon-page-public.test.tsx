import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/lib/salon-link-icons", () => ({
  SalonLinkIcon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));

import SalonPageClient from "@/app/salon/[slug]/salon-page-client";
import type { SalonPageRow, SalonPageLinkRow, TestimonialRow } from "@/types/database";

type TestimonialPick = Pick<
  TestimonialRow,
  "id" | "name" | "title" | "company" | "avatar_url" | "rating" | "content" | "before_story" | "is_featured" | "submitted_at"
>;

const baseSalonPage: SalonPageRow = {
  id: "sp-1",
  workspace_id: "ws-1",
  salon_name: "テストサロン",
  tagline: "テスト紹介文です",
  logo_url: null,
  theme: "natural",
  accent_color: "#C4A882",
  cover_image_url: null,
  cover_image_position: 50,
  review_layout: "card",
  is_published: true,
  slug: "test123",
  description: null,
  address: null,
  google_map_url: null,
  business_hours: null,
  closed_days: null,
  menu_items: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const baseLinks: SalonPageLinkRow[] = [
  { id: "l-1", salon_page_id: "sp-1", label: "LINE", url: "https://lin.ee/xxx", icon: "line", display_order: 0, created_at: "2026-01-01T00:00:00Z" },
  { id: "l-2", salon_page_id: "sp-1", label: "Web", url: "https://example.com", icon: "web", display_order: 1, created_at: "2026-01-01T00:00:00Z" },
];

function makeTestimonials(count: number): TestimonialPick[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `t-${i}`,
    name: `顧客${i}`,
    title: null,
    company: null,
    avatar_url: null,
    rating: i % 2 === 0 ? 5 : 4,
    content: `口コミ内容${i}${"あ".repeat(80)}`,
    before_story: null,
    is_featured: false,
    submitted_at: `2026-04-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
  }));
}

function renderPage(overrides: Partial<SalonPageRow> = {}, testimonials?: TestimonialPick[], links = baseLinks) {
  const salonPage = { ...baseSalonPage, ...overrides };
  const t = testimonials ?? makeTestimonials(2);
  const totalCount = t.length;
  const avgRating = totalCount > 0 ? t.reduce((s, x) => s + (x.rating ?? 0), 0) / totalCount : 0;
  return render(
    <SalonPageClient salonPage={salonPage} links={links} testimonials={t} avgRating={avgRating} totalCount={totalCount} />
  );
}

// ─── 基本表示 ───
describe("基本表示", () => {
  it("サロン名と紹介文が表示される", () => {
    renderPage();
    expect(screen.getByText("テストサロン")).toBeInTheDocument();
    expect(screen.getByText("テスト紹介文です")).toBeInTheDocument();
  });

  it("紹介文がnullの場合は表示されない", () => {
    renderPage({ tagline: null });
    expect(screen.queryByText("テスト紹介文です")).not.toBeInTheDocument();
  });

  it("ロゴ未設定時にイニシャルが表示される", () => {
    renderPage();
    expect(screen.getByText("テ")).toBeInTheDocument();
  });

  it("リンクアイコンが表示される", () => {
    renderPage();
    expect(screen.getByTestId("icon-line")).toBeInTheDocument();
    expect(screen.getByTestId("icon-web")).toBeInTheDocument();
  });

  it("リンクがない場合はアイコンが表示されない", () => {
    renderPage({}, undefined, []);
    expect(screen.queryByTestId("icon-line")).not.toBeInTheDocument();
  });
});

// ─── カバー画像 ───
describe("カバー画像", () => {
  it("cover_image_urlがある場合にimg要素が表示される", () => {
    const { container } = renderPage({ cover_image_url: "https://example.com/cover.jpg" });
    const img = container.querySelector('img[alt=""]');
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toBe("https://example.com/cover.jpg");
  });

  it("cover_image_urlがない場合にカバーimgが表示されない", () => {
    const { container } = renderPage({ cover_image_url: null });
    const imgs = container.querySelectorAll("img");
    const coverImgs = Array.from(imgs).filter((img) => img.alt === "");
    expect(coverImgs).toHaveLength(0);
  });

  it("cover_image_positionがobject-positionに反映される", () => {
    const { container } = renderPage({ cover_image_url: "https://example.com/cover.jpg", cover_image_position: 25 });
    const img = container.querySelector('img[alt=""]') as HTMLImageElement;
    expect(img.style.objectPosition).toContain("25%");
  });
});

// ─── 評価サマリー ───
describe("評価サマリー", () => {
  it("口コミがある場合に平均評価と件数が表示される", () => {
    renderPage();
    expect(screen.getByText("4.5")).toBeInTheDocument();
    expect(screen.getByText("お客様の声 2件")).toBeInTheDocument();
  });

  it("口コミが0件の場合は評価サマリーが表示されない", () => {
    renderPage({}, []);
    expect(screen.queryByText(/お客様の声 \d+件/)).not.toBeInTheDocument();
  });

  it("口コミが0件の場合に空状態メッセージが表示される", () => {
    renderPage({}, []);
    expect(screen.getByText("まだお客様の声がありません")).toBeInTheDocument();
  });
});

// ─── もっと見るボタン ───
describe("もっと見るボタン", () => {
  it("10件以下の場合はボタンが表示されない", () => {
    renderPage({}, makeTestimonials(5));
    expect(screen.queryByText("もっと見る")).not.toBeInTheDocument();
  });

  it("11件以上の場合にボタンが表示される", () => {
    renderPage({}, makeTestimonials(15));
    expect(screen.getByText("もっと見る")).toBeInTheDocument();
  });

  it("クリックすると追加の口コミが表示される", () => {
    renderPage({}, makeTestimonials(15));
    expect(screen.queryByText("顧客14")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("もっと見る"));
    expect(screen.getByText("顧客14")).toBeInTheDocument();
  });
});

// ─── レイアウト別表示 ───
describe("レイアウト別表示", () => {
  it("cardレイアウトで口コミが表示される", () => {
    renderPage({ review_layout: "card" });
    expect(screen.getByText("顧客0")).toBeInTheDocument();
  });

  it("gridレイアウトで「続きを読む」が表示される（長文時）", () => {
    renderPage({ review_layout: "grid" });
    expect(screen.getAllByText("続きを読む").length).toBeGreaterThan(0);
  });

  it("wallレイアウトで口コミが表示される", () => {
    renderPage({ review_layout: "wall" });
    expect(screen.getByText("顧客0")).toBeInTheDocument();
  });

  it("listレイアウトで口コミが表示される", () => {
    renderPage({ review_layout: "list" });
    expect(screen.getByText("顧客0")).toBeInTheDocument();
  });
});

// ─── グリッドモーダル ───
describe("グリッドモーダル", () => {
  it("グリッドカードをクリックするとモーダルが開く", () => {
    renderPage({ review_layout: "grid" });
    expect(screen.queryByText("閉じる")).not.toBeInTheDocument();

    // 「続きを読む」があるカードをクリック
    fireEvent.click(screen.getAllByText("続きを読む")[0]);
    expect(screen.getByText("閉じる")).toBeInTheDocument();
  });

  it("モーダルの「閉じる」をクリックするとモーダルが閉じる", () => {
    renderPage({ review_layout: "grid" });
    fireEvent.click(screen.getAllByText("続きを読む")[0]);
    expect(screen.getByText("閉じる")).toBeInTheDocument();

    fireEvent.click(screen.getByText("閉じる"));
    expect(screen.queryByText("閉じる")).not.toBeInTheDocument();
  });
});
