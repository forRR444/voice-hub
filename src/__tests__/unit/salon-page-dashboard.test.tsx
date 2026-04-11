import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ─── Supabase mock ───
const mockUpsertResult = { data: { id: "sp-new", slug: "testslug123" }, error: null };
const mockChain: Record<string, ReturnType<typeof vi.fn>> = {};
function resetChain() {
  const methods = ["select", "insert", "update", "delete", "upsert", "eq", "order", "single"];
  for (const m of methods) {
    mockChain[m] = vi.fn().mockReturnValue(mockChain);
  }
  mockChain.single = vi.fn().mockResolvedValue(mockUpsertResult);
  mockChain.then = vi.fn((resolve: (v: unknown) => void) => resolve({ data: null, error: null }));
}
resetChain();

const mockFrom = vi.fn().mockReturnValue(mockChain);
const mockUpload = vi.fn().mockResolvedValue({ error: null });
const mockGetPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl: "https://example.com/uploaded.jpg" } });
const mockStorage = {
  from: vi.fn().mockReturnValue({ upload: mockUpload, getPublicUrl: mockGetPublicUrl }),
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: mockFrom, storage: mockStorage }),
}));
vi.mock("@/lib/image-utils", () => ({
  resizeImage: vi.fn().mockResolvedValue(new Blob(["fake"])),
}));
vi.mock("@/lib/utils", () => ({
  generateSlug: () => "testslug123",
  getBaseUrl: () => "https://voicehub.jp",
}));
vi.mock("@/hooks/use-copy", () => ({
  useCopy: () => ({ copiedKey: null, copy: vi.fn() }),
}));
vi.mock("@/lib/salon-link-icons", () => ({
  SALON_LINK_ICONS: [
    { id: "web", label: "Webサイト", svg: () => null },
    { id: "line", label: "LINE", svg: () => null },
  ],
  SalonLinkIcon: ({ icon }: { icon: string }) => <span data-testid={`icon-${icon}`} />,
}));
vi.mock("lucide-react", () => ({
  Check: () => <span>check</span>,
  Copy: () => <span>copy</span>,
  ExternalLink: () => <span>ext</span>,
  Plus: () => <span>plus</span>,
  Trash2: () => <span>trash</span>,
  Upload: () => <span>upload</span>,
  Eye: () => <span>eye</span>,
  List: () => <span>list</span>,
  LayoutGrid: () => <span>grid</span>,
  Square: () => <span>square</span>,
  Columns3: () => <span>columns</span>,
}));

import SalonPageSettingsClient from "@/app/dashboard/salon-page/salon-page-client";
import type { WorkspaceRow, SalonPageRow, SalonPageLinkRow } from "@/types/database";

const workspace: WorkspaceRow = {
  id: "ws-1",
  user_id: "user-1",
  name: "テストワークスペース",
  onboarding_completed: true,
  created_at: "2026-01-01T00:00:00Z",
};

const existingSalonPage: SalonPageRow = {
  id: "sp-1",
  workspace_id: "ws-1",
  salon_name: "既存サロン",
  tagline: "既存紹介文",
  logo_url: null,
  theme: "natural",
  accent_color: "#C4A882",
  cover_image_url: null,
  cover_image_position: 50,
  review_layout: "card",
  is_published: true,
  slug: "existing123",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const existingLinks: SalonPageLinkRow[] = [
  { id: "l-1", salon_page_id: "sp-1", label: "LINE", url: "https://lin.ee/xxx", icon: "line", display_order: 0, created_at: "2026-01-01T00:00:00Z" },
];

function renderSettings(salonPage: SalonPageRow | null = null, links: SalonPageLinkRow[] = []) {
  return render(
    <SalonPageSettingsClient workspace={workspace} initialSalonPage={salonPage} initialLinks={links} />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  resetChain();
  mockFrom.mockReturnValue(mockChain);
});

// ─── 初期表示 ───
describe("初期表示", () => {
  it("新規作成時にStep 1が表示され、サロン名がワークスペース名で初期化される", () => {
    renderSettings();
    expect(screen.getByDisplayValue("テストワークスペース")).toBeInTheDocument();
  });

  it("既存データがある場合にサロン名が反映される", () => {
    renderSettings(existingSalonPage);
    expect(screen.getByDisplayValue("既存サロン")).toBeInTheDocument();
  });

  it("既存リンクがある場合にURLが反映される", () => {
    renderSettings(existingSalonPage, existingLinks);
    fireEvent.click(screen.getByText("予約導線"));
    expect(screen.getByDisplayValue("https://lin.ee/xxx")).toBeInTheDocument();
  });
});

// ─── ステップ切替 ───
describe("ステップ切替", () => {
  it("STEP 2をクリックするとデザイン画面が表示される", () => {
    renderSettings();
    fireEvent.click(screen.getByText("デザイン"));
    expect(screen.getByText("メインカラー")).toBeInTheDocument();
  });

  it("STEP 3をクリックすると予約導線画面が表示される", () => {
    renderSettings();
    fireEvent.click(screen.getByText("予約導線"));
    expect(screen.getByText(/リンクを追加できます/)).toBeInTheDocument();
  });

  it("STEP 4をクリックすると公開設定画面が表示される", () => {
    renderSettings();
    fireEvent.click(screen.getByText("公開設定"));
    expect(screen.getByText("ページを公開")).toBeInTheDocument();
  });

  it("「次へ」ボタンでStep 1→2に進める", () => {
    renderSettings();
    fireEvent.click(screen.getByText("次へ"));
    expect(screen.getByText("メインカラー")).toBeInTheDocument();
  });

  it("「戻る」ボタンでStep 2→1に戻れる", () => {
    renderSettings();
    fireEvent.click(screen.getByText("デザイン"));
    fireEvent.click(screen.getByText("戻る"));
    expect(screen.getByDisplayValue("テストワークスペース")).toBeInTheDocument();
  });
});

// ─── Step 1: サロン情報 ───
describe("サロン情報入力", () => {
  it("サロン名を変更できる", () => {
    renderSettings();
    const input = screen.getByDisplayValue("テストワークスペース");
    fireEvent.change(input, { target: { value: "新しいサロン名" } });
    expect(screen.getByDisplayValue("新しいサロン名")).toBeInTheDocument();
  });

  it("紹介文の文字数カウンターが表示される", () => {
    renderSettings();
    expect(screen.getByText("0/100")).toBeInTheDocument();
  });

  it("紹介文を入力すると文字数カウンターが更新される", () => {
    renderSettings();
    const textarea = screen.getByPlaceholderText(/爪に優しい/);
    fireEvent.change(textarea, { target: { value: "テスト" } });
    expect(screen.getByText("3/100")).toBeInTheDocument();
  });
});

// ─── Step 2: レイアウト選択 ───
describe("レイアウト選択", () => {
  it("4つのレイアウト選択肢が表示される", () => {
    renderSettings();
    fireEvent.click(screen.getByText("デザイン"));
    expect(screen.getByText("カード")).toBeInTheDocument();
    expect(screen.getByText("グリッド")).toBeInTheDocument();
    expect(screen.getByText("Wall")).toBeInTheDocument();
    expect(screen.getByText("リスト")).toBeInTheDocument();
  });
});

// ─── Step 3: リンク管理 ───
describe("リンク管理", () => {
  it("「リンクを追加」でリンク入力欄が追加される", () => {
    renderSettings();
    fireEvent.click(screen.getByText("予約導線"));
    fireEvent.click(screen.getAllByText(/リンクを追加/)[1]);
    expect(screen.getByPlaceholderText(/WebサイトのURL/)).toBeInTheDocument();
  });

  it("3つ追加すると「リンクを追加」ボタンが消える", () => {
    renderSettings();
    fireEvent.click(screen.getByText("予約導線"));
    fireEvent.click(screen.getAllByText(/リンクを追加/)[1]);
    fireEvent.click(screen.getAllByText(/リンクを追加/)[1]);
    fireEvent.click(screen.getAllByText(/リンクを追加/)[1]);
    const matches = screen.getAllByText(/リンクを追加/);
    expect(matches).toHaveLength(1); // 説明文の1つだけ残る
  });

  it("URL未入力時にエラーメッセージが表示される", () => {
    renderSettings();
    fireEvent.click(screen.getByText("予約導線"));
    fireEvent.click(screen.getAllByText(/リンクを追加/)[1]);
    expect(screen.getByText("URLを入力してください")).toBeInTheDocument();
  });

  it("URL未入力時に「次へ」ボタンが無効化される", () => {
    renderSettings();
    fireEvent.click(screen.getByText("予約導線"));
    fireEvent.click(screen.getAllByText(/リンクを追加/)[1]);
    const nextButtons = screen.getAllByText("次へ");
    const step3Next = nextButtons[nextButtons.length - 1];
    expect(step3Next).toBeDisabled();
  });

  it("URLを入力するとエラーが消えて「次へ」が有効になる", () => {
    renderSettings();
    fireEvent.click(screen.getByText("予約導線"));
    fireEvent.click(screen.getAllByText(/リンクを追加/)[1]);
    expect(screen.getByText("URLを入力してください")).toBeInTheDocument();

    const urlInput = screen.getByPlaceholderText(/WebサイトのURL/);
    fireEvent.change(urlInput, { target: { value: "https://example.com" } });
    expect(screen.queryByText("URLを入力してください")).not.toBeInTheDocument();
  });

  it("ゴミ箱ボタンでリンクを削除できる", () => {
    renderSettings(existingSalonPage, existingLinks);
    fireEvent.click(screen.getByText("予約導線"));
    expect(screen.getByDisplayValue("https://lin.ee/xxx")).toBeInTheDocument();
    fireEvent.click(screen.getByText("trash"));
    expect(screen.queryByDisplayValue("https://lin.ee/xxx")).not.toBeInTheDocument();
  });
});

// ─── Step 4: 公開設定 ───
describe("公開設定", () => {
  it("既存ページがある場合にURLが表示される", () => {
    renderSettings(existingSalonPage);
    fireEvent.click(screen.getByText("公開設定"));
    expect(screen.getByText(/voicehub\.jp\/salon\/existing123/)).toBeInTheDocument();
  });

  it("新規作成時はURLが表示されない", () => {
    renderSettings();
    fireEvent.click(screen.getByText("公開設定"));
    expect(screen.queryByText(/voicehub\.jp\/salon\//)).not.toBeInTheDocument();
  });

  it("公開中の既存ページに「ページを確認する」リンクが表示される", () => {
    renderSettings(existingSalonPage);
    fireEvent.click(screen.getByText("公開設定"));
    expect(screen.getByText(/ページを確認する/)).toBeInTheDocument();
  });
});

// ─── 保存処理 ───
describe("保存処理", () => {
  it("サロン名が空で保存するとエラーが表示される", async () => {
    renderSettings();
    const nameInput = screen.getByDisplayValue("テストワークスペース");
    fireEvent.change(nameInput, { target: { value: "" } });

    fireEvent.click(screen.getByText("公開設定"));
    fireEvent.click(screen.getByText("保存する"));

    expect(screen.getByText("サロン名を入力してください")).toBeInTheDocument();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("正常な入力で保存するとSupabaseのupsertが呼ばれる", async () => {
    renderSettings();
    fireEvent.click(screen.getByText("公開設定"));
    fireEvent.click(screen.getByText("保存する"));

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith("salon_pages");
    });
    expect(mockChain.upsert).toHaveBeenCalledTimes(1);

    const upsertArgs = mockChain.upsert.mock.calls[0][0];
    expect(upsertArgs.workspace_id).toBe("ws-1");
    expect(upsertArgs.salon_name).toBe("テストワークスペース");
    expect(upsertArgs.slug).toBe("testslug123");
  });

  it("既存リンクがある場合、保存時にdelete→insertが呼ばれる", async () => {
    renderSettings(existingSalonPage, existingLinks);
    fireEvent.click(screen.getByText("公開設定"));
    fireEvent.click(screen.getByText("保存する"));

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith("salon_page_links");
    });
    // delete + insertの2回呼ばれる
    const linkCalls = mockFrom.mock.calls.filter((c: string[]) => c[0] === "salon_page_links");
    expect(linkCalls.length).toBeGreaterThanOrEqual(2);
  });

  it("upsertエラー時にエラーメッセージが表示される", async () => {
    mockChain.single = vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } });

    renderSettings();
    fireEvent.click(screen.getByText("公開設定"));
    fireEvent.click(screen.getByText("保存する"));

    await waitFor(() => {
      expect(screen.getByText("DB error")).toBeInTheDocument();
    });
  });
});
