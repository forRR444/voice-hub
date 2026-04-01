import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ─── Mocks ───────────────────────────────────────────────────

// Phosphor Icons
vi.mock("@phosphor-icons/react", () => ({
  Star: ({ size, className, weight }: any) => <span data-testid="star" data-weight={weight} className={className}>{size}</span>,
  Image: ({ size, className }: any) => <span data-testid="image-icon" className={className}>{size}</span>,
  DownloadSimple: ({ size }: any) => <span data-testid="download-icon">{size}</span>,
  SpinnerGap: ({ size, className }: any) => <span data-testid="spinner" className={className}>{size}</span>,
  Check: ({ size, className }: any) => <span data-testid="check-icon" className={className}>{size}</span>,
  ArrowsOut: ({ size }: any) => <span data-testid="arrows-out">{size}</span>,
}));

// Canvas image generator
const mockGenerateImage = vi.fn().mockResolvedValue(new Blob(["fake-image"], { type: "image/png" }));
vi.mock("@/lib/canvas-image-generator", () => ({
  generateTestimonialImage: (...args: unknown[]) => mockGenerateImage(...args),
}));

// Modal
vi.mock("@/app/components/modal", () => ({
  default: ({ title, onClose, children }: any) => (
    <div data-testid="modal">
      <span data-testid="modal-title">{title}</span>
      <button data-testid="modal-close" onClick={onClose}>Close</button>
      {children}
    </div>
  ),
}));

// JSZip
const mockFile = vi.fn();
const mockGenerateAsync = vi.fn().mockResolvedValue(new Blob(["fake-zip"], { type: "application/zip" }));

function MockJSZip() {
  return { file: mockFile, generateAsync: mockGenerateAsync };
}
vi.mock("jszip", () => ({ default: MockJSZip }));

// URL.createObjectURL / revokeObjectURL
const mockCreateObjectURL = vi.fn().mockReturnValue("blob:mock-url");
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

import SnsClient from "@/app/dashboard/sns/sns-client";
import { TestimonialWithTags } from "@/types/database";

// ─── Test Data ───────────────────────────────────────────────

function makeTestimonial(overrides: Partial<TestimonialWithTags> = {}): TestimonialWithTags {
  return {
    id: "t-1",
    workspace_id: "ws-1",
    form_id: null,
    name: "田中太郎",
    title: null,
    company: null,
    content: "素晴らしいサービスでした",
    rating: 5,
    status: "approved",
    source: "form",
    source_id: null,
    avatar_url: null,
    is_featured: false,
    permission_granted: true,
    submitted_at: "2026-04-01T00:00:00Z",
    created_at: "2026-04-01T00:00:00Z",
    before_story: null,
    custom_fields: null,
    tags: [],
    ...overrides,
  };
}

const testimonials: TestimonialWithTags[] = [
  makeTestimonial({ id: "t-1", name: "田中太郎", content: "素晴らしいサービスでした", rating: 5 }),
  makeTestimonial({ id: "t-2", name: "佐藤花子", content: "とても丁寧な対応でした", rating: 4 }),
  makeTestimonial({ id: "t-3", name: "", content: "名前なしの口コミ", rating: 3 }),
];

// ─── Setup ───────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockGenerateImage.mockResolvedValue(new Blob(["fake-image"], { type: "image/png" }));
});

// ─── 空状態の表示 ────────────────────────────────────────────

describe("SnsClient — 空状態", () => {
  it("口コミが0件の場合、空状態メッセージを表示する", () => {
    render(<SnsClient testimonials={[]} brandColor="#6366F1" />);
    expect(screen.getByText("承認済みの口コミがありません")).toBeInTheDocument();
  });

  it("口コミが0件の場合、ツールバーを表示しない", () => {
    render(<SnsClient testimonials={[]} brandColor="#6366F1" />);
    expect(screen.queryByText("すべて選択")).not.toBeInTheDocument();
    expect(screen.queryByText("一括ダウンロード")).not.toBeInTheDocument();
  });
});

// ─── 口コミ一覧の表示 ───────────────────────────────────────

describe("SnsClient — 口コミ一覧", () => {
  it("口コミが表示される", () => {
    render(<SnsClient testimonials={testimonials} brandColor="#6366F1" />);
    expect(screen.getByText("田中太郎")).toBeInTheDocument();
    expect(screen.getByText("佐藤花子")).toBeInTheDocument();
    expect(screen.getByText("素晴らしいサービスでした")).toBeInTheDocument();
  });

  it("名前が空の口コミは「お客様」と表示される", () => {
    render(<SnsClient testimonials={testimonials} brandColor="#6366F1" />);
    expect(screen.getByText("お客様")).toBeInTheDocument();
  });

  it("星評価が表示される", () => {
    render(<SnsClient testimonials={testimonials} brandColor="#6366F1" />);
    const stars = screen.getAllByTestId("star");
    expect(stars.length).toBeGreaterThan(0);
  });

  it("ツールバーが表示される", () => {
    render(<SnsClient testimonials={testimonials} brandColor="#6366F1" />);
    expect(screen.getByText("すべて選択")).toBeInTheDocument();
    expect(screen.getByText("一括ダウンロード")).toBeInTheDocument();
  });

  it("テンプレート選択が表示される", () => {
    render(<SnsClient testimonials={testimonials} brandColor="#6366F1" />);
    expect(screen.getByDisplayValue("Instagram ストーリー")).toBeInTheDocument();
  });
});

// ─── 選択操作 ────────────────────────────────────────────────

describe("SnsClient — 選択操作", () => {
  it("カードクリックで選択される", () => {
    render(<SnsClient testimonials={testimonials} brandColor="#6366F1" />);
    fireEvent.click(screen.getByText("田中太郎").closest("[class*=cursor-pointer]")!);
    expect(screen.getByText("1件選択中")).toBeInTheDocument();
  });

  it("同じカードを2回クリックで選択解除される", () => {
    render(<SnsClient testimonials={testimonials} brandColor="#6366F1" />);
    const card = screen.getByText("田中太郎").closest("[class*=cursor-pointer]")!;
    fireEvent.click(card);
    expect(screen.getByText("1件選択中")).toBeInTheDocument();
    fireEvent.click(card);
    expect(screen.queryByText("1件選択中")).not.toBeInTheDocument();
  });

  it("すべて選択で全件選択される", () => {
    render(<SnsClient testimonials={testimonials} brandColor="#6366F1" />);
    fireEvent.click(screen.getByText("すべて選択"));
    expect(screen.getByText("3件選択中")).toBeInTheDocument();
    expect(screen.getByText("選択を解除")).toBeInTheDocument();
  });

  it("選択を解除で全件解除される", () => {
    render(<SnsClient testimonials={testimonials} brandColor="#6366F1" />);
    fireEvent.click(screen.getByText("すべて選択"));
    expect(screen.getByText("3件選択中")).toBeInTheDocument();
    fireEvent.click(screen.getByText("選択を解除"));
    expect(screen.queryByText("3件選択中")).not.toBeInTheDocument();
  });

  it("選択なしの場合、一括ダウンロードボタンが無効", () => {
    render(<SnsClient testimonials={testimonials} brandColor="#6366F1" />);
    const btn = screen.getByText("一括ダウンロード").closest("button")!;
    expect(btn).toBeDisabled();
  });

  it("選択ありの場合、一括ダウンロードボタンが有効", () => {
    render(<SnsClient testimonials={testimonials} brandColor="#6366F1" />);
    fireEvent.click(screen.getByText("田中太郎").closest("[class*=cursor-pointer]")!);
    const btn = screen.getByText("一括ダウンロード").closest("button")!;
    expect(btn).not.toBeDisabled();
  });
});

// ─── 一括ダウンロード ───────────────────────────────────────

describe("SnsClient — 一括ダウンロード", () => {
  it("選択した口コミ分の画像を生成してZIPに追加する", async () => {
    render(<SnsClient testimonials={testimonials} brandColor="#6366F1" />);

    // 2件選択
    fireEvent.click(screen.getByText("田中太郎").closest("[class*=cursor-pointer]")!);
    fireEvent.click(screen.getByText("佐藤花子").closest("[class*=cursor-pointer]")!);

    // ダウンロード実行
    fireEvent.click(screen.getByText("一括ダウンロード").closest("button")!);

    await waitFor(() => {
      expect(mockGenerateImage).toHaveBeenCalledTimes(2);
    });

    // ZIPにファイルが追加されたか
    expect(mockFile).toHaveBeenCalledTimes(2);
    expect(mockFile).toHaveBeenCalledWith("田中太郎_1.png", expect.any(Blob));
    expect(mockFile).toHaveBeenCalledWith("佐藤花子_2.png", expect.any(Blob));

    // ZIP生成が呼ばれたか
    expect(mockGenerateAsync).toHaveBeenCalledWith({ type: "blob" });
  });

  it("名前が空の口コミは「お客様」でファイル名が作られる", async () => {
    render(<SnsClient testimonials={[testimonials[2]]} brandColor="#6366F1" />);

    fireEvent.click(screen.getByText("お客様").closest("[class*=cursor-pointer]")!);
    fireEvent.click(screen.getByText("一括ダウンロード").closest("button")!);

    await waitFor(() => {
      expect(mockFile).toHaveBeenCalledWith("お客様_1.png", expect.any(Blob));
    });
  });

  it("選択したテンプレートで画像が生成される", async () => {
    render(<SnsClient testimonials={testimonials} brandColor="#6366F1" />);

    // テンプレートをX投稿に変更
    fireEvent.change(screen.getByDisplayValue("Instagram ストーリー"), { target: { value: "x-post" } });

    // 1件選択してダウンロード
    fireEvent.click(screen.getByText("田中太郎").closest("[class*=cursor-pointer]")!);
    fireEvent.click(screen.getByText("一括ダウンロード").closest("button")!);

    await waitFor(() => {
      expect(mockGenerateImage).toHaveBeenCalledWith(
        expect.objectContaining({ name: "田中太郎" }),
        "x-post",
        "warm"
      );
    });
  });

  it("brandColorが画像生成に渡される", async () => {
    render(<SnsClient testimonials={testimonials} brandColor="#FF0000" />);

    fireEvent.click(screen.getByText("田中太郎").closest("[class*=cursor-pointer]")!);
    fireEvent.click(screen.getByText("一括ダウンロード").closest("button")!);

    await waitFor(() => {
      expect(mockGenerateImage).toHaveBeenCalledWith(
        expect.objectContaining({ brandColor: "#FF0000" }),
        "instagram-story",
        "warm"
      );
    });
  });

  it("選択0件の場合、ダウンロード処理が実行されない", () => {
    render(<SnsClient testimonials={testimonials} brandColor="#6366F1" />);
    // ボタンはdisabledなのでclickしても反応しない
    const btn = screen.getByText("一括ダウンロード").closest("button")!;
    fireEvent.click(btn);
    expect(mockGenerateImage).not.toHaveBeenCalled();
  });
});

// ─── プレビューモーダル ─────────────────────────────────────

describe("SnsClient — プレビューモーダル", () => {
  it("プレビューボタンクリックでモーダルが開く", async () => {
    render(<SnsClient testimonials={testimonials} brandColor="#6366F1" />);
    const previewButtons = screen.getAllByTitle("プレビュー");
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("modal")).toBeInTheDocument();
      expect(screen.getByTestId("modal-title")).toHaveTextContent("プレビュー");
    });
  });

  it("プレビューボタンクリックでカード選択状態が変わらない", () => {
    render(<SnsClient testimonials={testimonials} brandColor="#6366F1" />);
    const previewButtons = screen.getAllByTitle("プレビュー");
    fireEvent.click(previewButtons[0]);
    // 選択カウントが表示されないことを確認
    expect(screen.queryByText("1件選択中")).not.toBeInTheDocument();
  });

  it("モーダル内にテンプレート選択ボタンが表示される", async () => {
    render(<SnsClient testimonials={testimonials} brandColor="#6366F1" />);
    const previewButtons = screen.getAllByTitle("プレビュー");
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("modal")).toBeInTheDocument();
      // モーダル内にテンプレートボタンが存在する（ツールバーのselectとは別）
      const modal = screen.getByTestId("modal");
      expect(modal.textContent).toContain("Instagram");
    });
  });

  it("モーダルを閉じることができる", async () => {
    render(<SnsClient testimonials={testimonials} brandColor="#6366F1" />);
    const previewButtons = screen.getAllByTitle("プレビュー");
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("modal")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("modal-close"));
    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
  });

  it("プレビューで画像生成が呼ばれる", async () => {
    render(<SnsClient testimonials={testimonials} brandColor="#6366F1" />);
    const previewButtons = screen.getAllByTitle("プレビュー");
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(mockGenerateImage).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "田中太郎",
          content: "素晴らしいサービスでした",
          rating: 5,
        }),
        "instagram-story",
        "warm"
      );
    });
  });
});
