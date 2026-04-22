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
    const img = container.querySelector('img[alt=""]');
    expect(img).toBeInstanceOf(HTMLImageElement);
    if (!(img instanceof HTMLImageElement)) throw new Error("cover img not rendered");
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
    expect(screen.queryByLabelText("閉じる")).not.toBeInTheDocument();

    // 「続きを読む」があるカードをクリック
    fireEvent.click(screen.getAllByText("続きを読む")[0]);
    expect(screen.getByLabelText("閉じる")).toBeInTheDocument();
  });

  it("モーダルの「閉じる」をクリックするとモーダルが閉じる", () => {
    renderPage({ review_layout: "grid" });
    fireEvent.click(screen.getAllByText("続きを読む")[0]);
    expect(screen.getByLabelText("閉じる")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("閉じる"));
    expect(screen.queryByLabelText("閉じる")).not.toBeInTheDocument();
  });

  it("モーダル外側をクリックするとモーダルが閉じる", () => {
    renderPage({ review_layout: "grid" });
    fireEvent.click(screen.getAllByText("続きを読む")[0]);
    const closeBtn = screen.getByLabelText("閉じる");
    const overlay = closeBtn.closest('div[style*="position: fixed"]');
    expect(overlay).not.toBeNull();
    if (overlay) {
      fireEvent.click(overlay);
      expect(screen.queryByLabelText("閉じる")).not.toBeInTheDocument();
    }
  });

  it("モーダル本体をクリックしても閉じない（stopPropagation）", () => {
    renderPage({ review_layout: "grid" });
    fireEvent.click(screen.getAllByText("続きを読む")[0]);
    const closeBtn = screen.getByLabelText("閉じる");
    const modalBody = closeBtn.parentElement;
    expect(modalBody).not.toBeNull();
    if (modalBody) {
      fireEvent.click(modalBody);
      expect(screen.getByLabelText("閉じる")).toBeInTheDocument();
    }
  });

  it("gridカードで Enter キーを押すとモーダルが開く", () => {
    renderPage({ review_layout: "grid" });
    const cards = document.querySelectorAll('.salon-card[role="button"]');
    expect(cards.length).toBeGreaterThan(0);
    const firstCard = cards[0];
    fireEvent.keyDown(firstCard, { key: "Enter" });
    expect(screen.getByLabelText("閉じる")).toBeInTheDocument();
  });

  it("gridカードで Space キーを押してもモーダルが開く", () => {
    renderPage({ review_layout: "grid" });
    const cards = document.querySelectorAll('.salon-card[role="button"]');
    expect(cards.length).toBeGreaterThan(0);
    fireEvent.keyDown(cards[0], { key: " " });
    expect(screen.getByLabelText("閉じる")).toBeInTheDocument();
  });

  it("gridカードで他のキーを押してもモーダルは開かない", () => {
    renderPage({ review_layout: "grid" });
    const cards = document.querySelectorAll('.salon-card[role="button"]');
    fireEvent.keyDown(cards[0], { key: "a" });
    expect(screen.queryByLabelText("閉じる")).not.toBeInTheDocument();
  });
});

// ─── サロン紹介文（ExpandableDescription） ───
describe("サロン紹介文（展開可能）", () => {
  it("descriptionがある場合は文章と「もっと見る」が表示される", () => {
    renderPage({ description: "こだわりのサロンです。リラックスできる空間で施術いたします。" });
    expect(
      screen.getByText("こだわりのサロンです。リラックスできる空間で施術いたします。")
    ).toBeInTheDocument();
    expect(screen.getByText("もっと見る")).toBeInTheDocument();
  });

  it("「もっと見る」をクリックすると「閉じる」になる", () => {
    renderPage({ description: "長文の紹介" });
    fireEvent.click(screen.getByText("もっと見る"));
    expect(screen.getByText("閉じる")).toBeInTheDocument();
    expect(screen.queryByText("もっと見る")).not.toBeInTheDocument();
  });

  it("「閉じる」をクリックすると「もっと見る」に戻る", () => {
    renderPage({ description: "長文の紹介" });
    fireEvent.click(screen.getByText("もっと見る"));
    // グリッドモーダルのaria-label「閉じる」との衝突を避けるため、ボタンtextで限定
    const closeButton = screen.getByRole("button", { name: "閉じる" });
    fireEvent.click(closeButton);
    expect(screen.getByText("もっと見る")).toBeInTheDocument();
  });
});

// ─── メニュー・料金セクション ───
describe("メニュー・料金", () => {
  it("menu_items が空配列の場合はセクションが表示されない", () => {
    renderPage({ menu_items: [] });
    expect(screen.queryByText("メニュー・料金")).not.toBeInTheDocument();
  });

  it("menu_items がある場合にセクションと項目が表示される", () => {
    renderPage({
      menu_items: [
        { name: "カット", price: "5,000円", description: "丁寧にカット" },
        { name: "カラー", price: "8,000円", description: "" },
      ],
    });
    expect(screen.getByText("メニュー・料金")).toBeInTheDocument();
    expect(screen.getByText("カット")).toBeInTheDocument();
    expect(screen.getByText("5,000円")).toBeInTheDocument();
    expect(screen.getByText("丁寧にカット")).toBeInTheDocument();
    expect(screen.getByText("カラー")).toBeInTheDocument();
  });
});

// ─── 営業時間・定休日セクション ───
describe("営業時間・定休日", () => {
  it("business_hours.textとclosed_daysが両方ない場合はセクション非表示", () => {
    renderPage({ business_hours: null, closed_days: null });
    expect(screen.queryByText("営業時間")).not.toBeInTheDocument();
  });

  it("business_hours.textだけある場合に営業時間が表示される", () => {
    renderPage({ business_hours: { text: "10:00 - 20:00" }, closed_days: null });
    expect(screen.getByText("営業時間")).toBeInTheDocument();
    expect(screen.getByText("10:00 - 20:00")).toBeInTheDocument();
  });

  it("closed_daysだけある場合に定休日が表示される", () => {
    renderPage({ business_hours: null, closed_days: "火曜日" });
    expect(screen.getByText("営業時間")).toBeInTheDocument();
    expect(screen.getByText("定休日:")).toBeInTheDocument();
    expect(screen.getByText("火曜日")).toBeInTheDocument();
  });
});

// ─── アクセスセクション ───
describe("アクセス", () => {
  it("addressがない場合はセクション非表示", () => {
    renderPage({ address: null });
    expect(screen.queryByText("アクセス")).not.toBeInTheDocument();
  });

  it("addressがある場合に住所が表示される", () => {
    renderPage({ address: "東京都渋谷区1-2-3", google_map_url: null });
    expect(screen.getByText("アクセス")).toBeInTheDocument();
    expect(screen.getByText("東京都渋谷区1-2-3")).toBeInTheDocument();
    expect(screen.queryByText("Googleマップで見る")).not.toBeInTheDocument();
  });

  it("google_map_urlがある場合にGoogleマップリンクが表示される", () => {
    renderPage({
      address: "東京都渋谷区1-2-3",
      google_map_url: "https://maps.google.com/?q=test",
    });
    const link = screen.getByRole("link", { name: /Googleマップで見る/ });
    expect(link).toHaveAttribute("href", "https://maps.google.com/?q=test");
    expect(link).toHaveAttribute("target", "_blank");
  });
});

// ─── listレイアウト（ReviewListItem） ───
describe("listレイアウトの詳細", () => {
  it("名前が空の場合「匿名」が表示される", () => {
    renderPage(
      { review_layout: "list" },
      [
        {
          id: "t-anon",
          name: "",
          title: null,
          company: null,
          avatar_url: null,
          rating: 5,
          content: "よかった",
          before_story: null,
          is_featured: false,
          submitted_at: "2026-04-01T00:00:00Z",
        },
      ]
    );
    expect(screen.getByText("匿名")).toBeInTheDocument();
    expect(screen.getByText("よかった")).toBeInTheDocument();
  });

  it("ratingがnullでも表示が崩れない", () => {
    renderPage(
      { review_layout: "list" },
      [
        {
          id: "t-norating",
          name: "顧客A",
          title: null,
          company: null,
          avatar_url: null,
          rating: null,
          content: "感想",
          before_story: null,
          is_featured: false,
          submitted_at: "2026-04-01T00:00:00Z",
        },
      ]
    );
    expect(screen.getByText("顧客A")).toBeInTheDocument();
    expect(screen.getByText("感想")).toBeInTheDocument();
  });

  it("contentがない場合は本文が表示されない", () => {
    renderPage(
      { review_layout: "list" },
      [
        {
          id: "t-nocontent",
          name: "顧客B",
          title: null,
          company: null,
          avatar_url: null,
          rating: 4,
          content: "",
          before_story: null,
          is_featured: false,
          submitted_at: "2026-04-01T00:00:00Z",
        },
      ]
    );
    expect(screen.getByText("顧客B")).toBeInTheDocument();
  });
});
