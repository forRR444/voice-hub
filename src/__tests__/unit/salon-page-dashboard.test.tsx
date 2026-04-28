import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ─── fetch mock ───
// salon-page-client は /api/salon-page (PUT) と /api/salon-page/upload (POST) を叩くので、
// global.fetch をモック化して URL ごとにレスポンスを切り替える。
type FetchInit = RequestInit | undefined;

const defaultSaveResponse = { ok: true, data: { id: "sp-new", slug: "testslug123" } };
const defaultUploadResponse = {
  ok: true,
  data: { url: "https://example.com/uploaded.jpg" },
};

let saveResponseQueue: Array<{ status: number; body: unknown }> = [];
let uploadResponseQueue: Array<{ status: number; body: unknown }> = [];

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function nextResponse(
  queue: Array<{ status: number; body: unknown }>,
  fallback: { status: number; body: unknown }
): Response {
  const entry = queue.shift() ?? fallback;
  return jsonResponse(entry.status, entry.body);
}

const mockFetch = vi.fn(async (input: RequestInfo | URL, _init?: FetchInit) => {
  const url = typeof input === "string" ? input : input.toString();
  if (url.includes("/api/salon-page/upload")) {
    return nextResponse(uploadResponseQueue, { status: 200, body: defaultUploadResponse });
  }
  if (url.includes("/api/salon-page")) {
    return nextResponse(saveResponseQueue, { status: 200, body: defaultSaveResponse });
  }
  return jsonResponse(404, { ok: false, error: "not found" });
});

function getCallsTo(
  path: "/api/salon-page" | "/api/salon-page/upload"
): Array<[string, FetchInit]> {
  return mockFetch.mock.calls
    .map((call): [string, FetchInit] => {
      const input = call[0];
      const init = call[1];
      const url = typeof input === "string" ? input : input.toString();
      return [url, init];
    })
    .filter(([url]) => {
      if (path === "/api/salon-page/upload") return url.includes("/api/salon-page/upload");
      // /api/salon-page そのものを呼ぶケースは upload を除外
      return url.includes("/api/salon-page") && !url.includes("/api/salon-page/upload");
    });
}

async function getSavePayload(): Promise<Record<string, unknown>> {
  const calls = getCallsTo("/api/salon-page");
  expect(calls.length).toBeGreaterThan(0);
  const [, init] = calls[0];
  expect(init?.method).toBe("PUT");
  const body = init?.body;
  expect(typeof body).toBe("string");
  return JSON.parse(typeof body === "string" ? body : "");
}

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
  Sparkles: () => <span>sparkles</span>,
  FileText: () => <span>filetext</span>,
  ClipboardList: () => <span>clipboard</span>,
  MapPin: () => <span>mappin</span>,
  Clock: () => <span>clock</span>,
  ChevronDown: () => <span>chevron</span>,
}));

import SalonPageSettingsClient from "@/app/dashboard/salon-page/salon-page-client";
import type { WorkspaceRow, SalonPageRow, SalonPageLinkRow } from "@/types/database";

const workspace: WorkspaceRow = {
  id: "ws-1",
  user_id: "user-1",
  name: "テストワークスペース",
  onboarding_completed: true,
  created_at: "2026-01-01T00:00:00Z",
  subscription_status: null,
  stripe_customer_id: null,
  stripe_subscription_id: null,
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
  description: null,
  address: null,
  google_map_url: null,
  business_hours: null,
  closed_days: null,
  menu_items: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const existingLinks: SalonPageLinkRow[] = [
  {
    id: "l-1",
    salon_page_id: "sp-1",
    label: "LINE",
    url: "https://lin.ee/xxx",
    icon: "line",
    display_order: 0,
    created_at: "2026-01-01T00:00:00Z",
  },
];

function renderSettings(salonPage: SalonPageRow | null = null, links: SalonPageLinkRow[] = []) {
  return render(
    <SalonPageSettingsClient
      workspace={workspace}
      initialSalonPage={salonPage}
      initialLinks={links}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  saveResponseQueue = [];
  uploadResponseQueue = [];
  vi.stubGlobal("fetch", mockFetch);
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
    fireEvent.click(screen.getAllByText("保存する")[0]);

    expect(screen.getAllByText("サロン名を入力してください").length).toBeGreaterThanOrEqual(1);
    expect(getCallsTo("/api/salon-page")).toHaveLength(0);
  });

  it("正常な入力で保存するとSupabaseのupsertが呼ばれる", async () => {
    renderSettings();
    fireEvent.click(screen.getByText("公開設定"));
    fireEvent.click(screen.getAllByText("保存する")[0]);

    await waitFor(() => {
      expect(getCallsTo("/api/salon-page")).toHaveLength(1);
    });

    const payload = await getSavePayload();
    expect(payload.salon_name).toBe("テストワークスペース");
  });

  it("既存リンクがある場合、保存時にdelete→insertが呼ばれる", async () => {
    renderSettings(existingSalonPage, existingLinks);
    fireEvent.click(screen.getByText("公開設定"));
    fireEvent.click(screen.getAllByText("保存する")[0]);

    await waitFor(() => {
      expect(getCallsTo("/api/salon-page")).toHaveLength(1);
    });
    // API ルート側で delete→insert を担当するため、クライアントは links 配列を payload に載せて送るだけ。
    const payload = await getSavePayload();
    expect(Array.isArray(payload.links)).toBe(true);
    const linksPayload = payload.links;
    if (!Array.isArray(linksPayload)) throw new Error("links must be array");
    expect(linksPayload).toHaveLength(1);
    const first = linksPayload[0];
    if (typeof first !== "object" || first === null) throw new Error("link entry must be object");
    expect(Reflect.get(first, "url")).toBe("https://lin.ee/xxx");
  });

  it("upsertエラー時にエラーメッセージが表示される", async () => {
    saveResponseQueue.push({ status: 500, body: { ok: false, error: "DB error" } });

    renderSettings();
    fireEvent.click(screen.getByText("公開設定"));
    fireEvent.click(screen.getAllByText("保存する")[0]);

    await waitFor(() => {
      expect(screen.getAllByText("DB error").length).toBeGreaterThanOrEqual(1);
    });
  });
});

// ─── ヘルパー ───
function fireFileChange(input: HTMLInputElement, file: File) {
  Object.defineProperty(input, "files", { value: [file], configurable: true });
  fireEvent.change(input);
}

function getFileInputs(container: HTMLElement): HTMLInputElement[] {
  return Array.from(container.querySelectorAll<HTMLInputElement>('input[type="file"]'));
}

// ─── ロゴ・カバー画像のファイル選択 ───
describe("画像ファイル選択ハンドラ", () => {
  beforeEach(() => {
    const createObjectURL = vi.fn(() => "blob:mock-url");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", Object.assign(globalThis.URL ?? {}, { createObjectURL, revokeObjectURL }));
  });

  it("画像ファイルを選択するとロゴプレビューが表示される", () => {
    const { container } = renderSettings();
    const [logoInput] = getFileInputs(container);
    const file = new File(["x"], "logo.png", { type: "image/png" });
    fireFileChange(logoInput, file);

    const img = container.querySelector('img[alt="ロゴ"]');
    expect(img).toBeInstanceOf(HTMLImageElement);
    if (img instanceof HTMLImageElement) {
      expect(img.src).toContain("blob:mock-url");
    }
  });

  it("非画像ファイルを選択してもロゴプレビューは変わらない", () => {
    const { container } = renderSettings();
    const [logoInput] = getFileInputs(container);
    const file = new File(["x"], "note.txt", { type: "text/plain" });
    fireFileChange(logoInput, file);

    // プレビュー用のimgは出ず、イニシャル表示のまま
    expect(container.querySelector('img[alt="ロゴ"]')).toBeNull();
  });

  it("カバー画像を選択するとプレビューが表示される", () => {
    const { container } = renderSettings();
    const inputs = getFileInputs(container);
    const coverInput = inputs[1]; // 2つ目はカバー
    const file = new File(["x"], "cover.jpg", { type: "image/jpeg" });
    fireFileChange(coverInput, file);

    const img = container.querySelector('img[alt="カバー"]');
    expect(img).toBeInstanceOf(HTMLImageElement);
  });

  it("カバー画像の位置スライダーを動かすとobjectPositionが更新される", () => {
    const { container } = renderSettings();
    const inputs = getFileInputs(container);
    const coverInput = inputs[1];
    fireFileChange(coverInput, new File(["x"], "cover.jpg", { type: "image/jpeg" }));

    const slider = container.querySelector<HTMLInputElement>('input[type="range"]');
    expect(slider).not.toBeNull();
    if (!slider) return;
    fireEvent.change(slider, { target: { value: "25" } });

    const img = container.querySelector('img[alt="カバー"]');
    expect(img).toBeInstanceOf(HTMLImageElement);
    if (img instanceof HTMLImageElement) {
      expect(img.style.objectPosition).toContain("25%");
    }
  });

  it("カバー画像の「削除」ボタンでプレビューが消える", () => {
    const { container } = renderSettings();
    const inputs = getFileInputs(container);
    const coverInput = inputs[1];
    fireFileChange(coverInput, new File(["x"], "cover.jpg", { type: "image/jpeg" }));

    expect(container.querySelector('img[alt="カバー"]')).not.toBeNull();
    fireEvent.click(screen.getByText("削除"));
    expect(container.querySelector('img[alt="カバー"]')).toBeNull();
  });
});

// ─── 詳細情報ビュー (アコーディオン) ───
describe("詳細情報ビュー", () => {
  it("「詳細情報」ボタンで詳細ビューに切り替わる", () => {
    renderSettings();
    fireEvent.click(screen.getByText("詳細情報"));
    expect(screen.getByText("サロン紹介文")).toBeInTheDocument();
    expect(screen.getByText("メニュー・料金表")).toBeInTheDocument();
    expect(screen.getByText("アクセス")).toBeInTheDocument();
    expect(screen.getByText("営業時間・定休日")).toBeInTheDocument();
  });

  it("「基本情報に戻る」ボタンで基本ビューに戻る", () => {
    renderSettings();
    fireEvent.click(screen.getByText("詳細情報"));
    fireEvent.click(screen.getByText("基本情報に戻る"));
    expect(screen.queryByText("サロン紹介文")).not.toBeInTheDocument();
  });

  it("サロン紹介文アコーディオンを開くとtextareaが表示される", () => {
    renderSettings();
    fireEvent.click(screen.getByText("詳細情報"));
    fireEvent.click(screen.getByText("サロン紹介文"));
    expect(screen.getByPlaceholderText(/サロンの特徴やこだわり/)).toBeInTheDocument();
  });

  it("紹介文を入力すると文字数カウンターが更新される", () => {
    renderSettings();
    fireEvent.click(screen.getByText("詳細情報"));
    fireEvent.click(screen.getByText("サロン紹介文"));
    const textarea = screen.getByPlaceholderText(/サロンの特徴やこだわり/);
    fireEvent.change(textarea, { target: { value: "こんにちは" } });
    expect(screen.getByText(/5 \/ /)).toBeInTheDocument();
  });

  it("サロン紹介文を入力するとヘッダに「入力済み」バッジが出る", () => {
    renderSettings();
    fireEvent.click(screen.getByText("詳細情報"));
    fireEvent.click(screen.getByText("サロン紹介文"));
    const textarea = screen.getByPlaceholderText(/サロンの特徴やこだわり/);
    fireEvent.change(textarea, { target: { value: "Hello" } });
    expect(screen.getAllByText("入力済み").length).toBeGreaterThanOrEqual(1);
  });
});

// ─── メニュー項目 CRUD ───
describe("メニュー項目CRUD", () => {
  it("メニューセクションを開くと「メニューを追加」ボタンが表示される", () => {
    renderSettings();
    fireEvent.click(screen.getByText("詳細情報"));
    fireEvent.click(screen.getByText("メニュー・料金表"));
    expect(screen.getByText("メニューを追加")).toBeInTheDocument();
  });

  it("「メニューを追加」で入力欄が1つ追加される", () => {
    renderSettings();
    fireEvent.click(screen.getByText("詳細情報"));
    fireEvent.click(screen.getByText("メニュー・料金表"));
    fireEvent.click(screen.getByText("メニューを追加"));
    expect(screen.getByPlaceholderText("メニュー名")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("¥0,000")).toBeInTheDocument();
  });

  it("メニュー名・価格・説明を入力できる", () => {
    renderSettings();
    fireEvent.click(screen.getByText("詳細情報"));
    fireEvent.click(screen.getByText("メニュー・料金表"));
    fireEvent.click(screen.getByText("メニューを追加"));

    fireEvent.change(screen.getByPlaceholderText("メニュー名"), { target: { value: "カット" } });
    fireEvent.change(screen.getByPlaceholderText("¥0,000"), { target: { value: "¥4,500" } });
    fireEvent.change(screen.getByPlaceholderText("簡単な説明（任意）"), {
      target: { value: "シャンプー込み" },
    });

    expect(screen.getByDisplayValue("カット")).toBeInTheDocument();
    expect(screen.getByDisplayValue("¥4,500")).toBeInTheDocument();
    expect(screen.getByDisplayValue("シャンプー込み")).toBeInTheDocument();
  });

  it("メニュー項目の件数バッジが更新される", () => {
    renderSettings();
    fireEvent.click(screen.getByText("詳細情報"));
    fireEvent.click(screen.getByText("メニュー・料金表"));
    fireEvent.click(screen.getByText("メニューを追加"));
    fireEvent.change(screen.getByPlaceholderText("メニュー名"), { target: { value: "カット" } });
    expect(screen.getByText("1件")).toBeInTheDocument();
  });

  it("ゴミ箱ボタンでメニュー項目を削除できる", () => {
    renderSettings();
    fireEvent.click(screen.getByText("詳細情報"));
    fireEvent.click(screen.getByText("メニュー・料金表"));
    fireEvent.click(screen.getByText("メニューを追加"));
    fireEvent.change(screen.getByPlaceholderText("メニュー名"), { target: { value: "カット" } });
    expect(screen.getByDisplayValue("カット")).toBeInTheDocument();

    // trashボタン（メニュー項目のゴミ箱）
    fireEvent.click(screen.getByText("trash"));
    expect(screen.queryByDisplayValue("カット")).not.toBeInTheDocument();
  });
});

// ─── アクセス情報 ───
describe("アクセス情報入力", () => {
  it("アクセスセクションを開くと住所とGoogleマップURL入力が表示される", () => {
    renderSettings();
    fireEvent.click(screen.getByText("詳細情報"));
    fireEvent.click(screen.getByText("アクセス"));
    expect(screen.getByPlaceholderText(/東京都渋谷区/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/maps\.google\.com/)).toBeInTheDocument();
  });

  it("住所を入力できて「入力済み」バッジが出る", () => {
    renderSettings();
    fireEvent.click(screen.getByText("詳細情報"));
    fireEvent.click(screen.getByText("アクセス"));
    fireEvent.change(screen.getByPlaceholderText(/東京都渋谷区/), {
      target: { value: "東京都渋谷区1-1-1" },
    });
    expect(screen.getByDisplayValue("東京都渋谷区1-1-1")).toBeInTheDocument();
    expect(screen.getAllByText("入力済み").length).toBeGreaterThanOrEqual(1);
  });

  it("GoogleマップURLを入力できる", () => {
    renderSettings();
    fireEvent.click(screen.getByText("詳細情報"));
    fireEvent.click(screen.getByText("アクセス"));
    fireEvent.change(screen.getByPlaceholderText(/maps\.google\.com/), {
      target: { value: "https://maps.google.com/abc" },
    });
    expect(screen.getByDisplayValue("https://maps.google.com/abc")).toBeInTheDocument();
  });
});

// ─── 営業時間・定休日 ───
describe("営業時間・定休日入力", () => {
  it("営業時間セクションを開くとtextareaと定休日入力が表示される", () => {
    renderSettings();
    fireEvent.click(screen.getByText("詳細情報"));
    fireEvent.click(screen.getByText("営業時間・定休日"));
    expect(screen.getByPlaceholderText(/平日 10:00/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/毎週月曜日/)).toBeInTheDocument();
  });

  it("営業時間を入力できる", () => {
    renderSettings();
    fireEvent.click(screen.getByText("詳細情報"));
    fireEvent.click(screen.getByText("営業時間・定休日"));
    fireEvent.change(screen.getByPlaceholderText(/平日 10:00/), {
      target: { value: "平日 10-20" },
    });
    expect(screen.getByDisplayValue("平日 10-20")).toBeInTheDocument();
  });

  it("定休日を入力すると「入力済み」バッジが出る", () => {
    renderSettings();
    fireEvent.click(screen.getByText("詳細情報"));
    fireEvent.click(screen.getByText("営業時間・定休日"));
    fireEvent.change(screen.getByPlaceholderText(/毎週月曜日/), {
      target: { value: "毎週火曜日" },
    });
    expect(screen.getByDisplayValue("毎週火曜日")).toBeInTheDocument();
    expect(screen.getAllByText("入力済み").length).toBeGreaterThanOrEqual(1);
  });
});

// ─── Step 2: アクセントカラー ───
describe("アクセントカラー入力", () => {
  it("カラーピッカーで色を変更できる", () => {
    const { container } = renderSettings();
    fireEvent.click(screen.getByText("デザイン"));
    const colorInput = container.querySelector<HTMLInputElement>('input[type="color"]');
    expect(colorInput).not.toBeNull();
    if (!colorInput) return;
    fireEvent.change(colorInput, { target: { value: "#ff0000" } });
    expect(colorInput.value).toBe("#ff0000");
  });

  it("HEXテキスト入力で有効な値は反映される", () => {
    const { container } = renderSettings();
    fireEvent.click(screen.getByText("デザイン"));
    const hexInput = Array.from(container.querySelectorAll<HTMLInputElement>("input")).find(
      (el) => el.type !== "color" && typeof el.value === "string" && el.value.startsWith("#")
    );
    expect(hexInput).toBeDefined();
    if (!hexInput) return;
    fireEvent.change(hexInput, { target: { value: "#abcdef" } });
    expect(hexInput.value).toBe("#abcdef");
  });

  it("HEXテキスト入力で不正フォーマットは反映されない", () => {
    const { container } = renderSettings();
    fireEvent.click(screen.getByText("デザイン"));
    const hexInput = Array.from(container.querySelectorAll<HTMLInputElement>("input")).find(
      (el) => el.type !== "color" && typeof el.value === "string" && el.value.startsWith("#")
    );
    expect(hexInput).toBeDefined();
    if (!hexInput) return;
    const before = hexInput.value;
    fireEvent.change(hexInput, { target: { value: "zzz" } });
    expect(hexInput.value).toBe(before);
  });
});

// ─── Step 2: レイアウト選択の切替挙動 ───
describe("レイアウト選択切替", () => {
  it("グリッドレイアウトを選択できる", () => {
    renderSettings();
    fireEvent.click(screen.getByText("デザイン"));
    fireEvent.click(screen.getByText("グリッド"));
    // 選択後、再度「次へ」で遷移できることを確認
    fireEvent.click(screen.getByText("次へ"));
    expect(screen.getByText(/リンクを追加できます/)).toBeInTheDocument();
  });

  it("Wallレイアウトを選択できる", () => {
    renderSettings();
    fireEvent.click(screen.getByText("デザイン"));
    fireEvent.click(screen.getByText("Wall"));
    fireEvent.click(screen.getByText("次へ"));
    expect(screen.getByText(/リンクを追加できます/)).toBeInTheDocument();
  });

  it("リストレイアウトを選択できる", () => {
    renderSettings();
    fireEvent.click(screen.getByText("デザイン"));
    fireEvent.click(screen.getByText("リスト"));
    fireEvent.click(screen.getByText("次へ"));
    expect(screen.getByText(/リンクを追加できます/)).toBeInTheDocument();
  });
});

// ─── Step 3: リンクアイコン選択 ───
describe("リンクアイコン選択", () => {
  it("LINEアイコンボタンでURL入力のプレースホルダーがLINE用に切り替わる", () => {
    renderSettings();
    fireEvent.click(screen.getByText("予約導線"));
    fireEvent.click(screen.getAllByText(/リンクを追加/)[1]);

    // 切替前は web 用プレースホルダ
    expect(screen.getByPlaceholderText(/WebサイトのURL/)).toBeInTheDocument();

    // LINE ボタンをクリック
    const lineButtons = screen.getAllByTitle("LINE");
    fireEvent.click(lineButtons[0]);

    // プレースホルダが LINE 用に切り替わる
    expect(screen.getByPlaceholderText(/公式LINEのURL/)).toBeInTheDocument();
  });
});

// ─── Step 4: 公開トグル ───
describe("公開トグル", () => {
  it("非公開→公開に切り替えると保存データのis_publishedがtrueになる", async () => {
    renderSettings();
    fireEvent.click(screen.getByText("公開設定"));

    // トグルボタンを探す (w-11 h-6 rounded-full のbutton)
    const toggles = screen
      .getAllByRole("button")
      .filter((b) => b.className.includes("w-11") && b.className.includes("rounded-full"));
    expect(toggles.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(toggles[0]);

    fireEvent.click(screen.getAllByText("保存する")[0]);

    await waitFor(() => {
      expect(getCallsTo("/api/salon-page")).toHaveLength(1);
    });
    const payload = await getSavePayload();
    expect(payload.is_published).toBe(true);
  });

  it("既存公開中ページでトグルをオフにするとis_publishedがfalseで保存される", async () => {
    renderSettings(existingSalonPage);
    fireEvent.click(screen.getByText("公開設定"));

    const toggles = screen
      .getAllByRole("button")
      .filter((b) => b.className.includes("w-11") && b.className.includes("rounded-full"));
    fireEvent.click(toggles[0]);

    fireEvent.click(screen.getAllByText("保存する")[0]);

    await waitFor(() => {
      expect(getCallsTo("/api/salon-page")).toHaveLength(1);
    });
    const payload = await getSavePayload();
    expect(payload.is_published).toBe(false);
  });
});

// ─── handleSave: ロゴ・カバーアップロード ───
describe("保存処理での画像アップロード", () => {
  beforeEach(() => {
    const createObjectURL = vi.fn(() => "blob:mock-url");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", Object.assign(globalThis.URL ?? {}, { createObjectURL, revokeObjectURL }));
  });

  it("ロゴ画像選択後に保存するとstorage.uploadが呼ばれる", async () => {
    const { container } = renderSettings();
    const [logoInput] = getFileInputs(container);
    fireFileChange(logoInput, new File(["x"], "logo.png", { type: "image/png" }));

    fireEvent.click(screen.getByText("公開設定"));
    fireEvent.click(screen.getAllByText("保存する")[0]);

    await waitFor(() => {
      expect(getCallsTo("/api/salon-page/upload")).toHaveLength(1);
    });
    // upload リクエストは multipart/form-data (FormData)
    const [, init] = getCallsTo("/api/salon-page/upload")[0];
    expect(init?.method).toBe("POST");
    expect(init?.body).toBeInstanceOf(FormData);
    if (init?.body instanceof FormData) {
      expect(init.body.get("kind")).toBe("logo");
    }

    // 保存時にlogo_urlにアップロードAPIから返ったURLが入る
    await waitFor(() => {
      expect(getCallsTo("/api/salon-page")).toHaveLength(1);
    });
    const payload = await getSavePayload();
    expect(payload.logo_url).toBe("https://example.com/uploaded.jpg");
  });

  it("ロゴアップロード失敗時にエラーメッセージが表示される", async () => {
    uploadResponseQueue.push({ status: 500, body: { ok: false, error: "disk full" } });

    const { container } = renderSettings();
    const [logoInput] = getFileInputs(container);
    fireFileChange(logoInput, new File(["x"], "logo.png", { type: "image/png" }));

    fireEvent.click(screen.getByText("公開設定"));
    fireEvent.click(screen.getAllByText("保存する")[0]);

    await waitFor(() => {
      expect(screen.getAllByText(/ロゴのアップロードに失敗/).length).toBeGreaterThanOrEqual(1);
    });
    expect(getCallsTo("/api/salon-page")).toHaveLength(0);
  });

  it("カバー画像選択後に保存するとstorage.uploadが呼ばれる", async () => {
    const { container } = renderSettings();
    const inputs = getFileInputs(container);
    fireFileChange(inputs[1], new File(["x"], "cover.jpg", { type: "image/jpeg" }));

    fireEvent.click(screen.getByText("公開設定"));
    fireEvent.click(screen.getAllByText("保存する")[0]);

    await waitFor(() => {
      expect(getCallsTo("/api/salon-page/upload")).toHaveLength(1);
    });
    const [, init] = getCallsTo("/api/salon-page/upload")[0];
    expect(init?.method).toBe("POST");
    expect(init?.body).toBeInstanceOf(FormData);
    if (init?.body instanceof FormData) {
      expect(init.body.get("kind")).toBe("cover");
    }

    await waitFor(() => {
      expect(getCallsTo("/api/salon-page")).toHaveLength(1);
    });
    const payload = await getSavePayload();
    expect(payload.cover_image_url).toBe("https://example.com/uploaded.jpg");
  });

  it("カバーアップロード失敗時にエラーメッセージが表示される", async () => {
    uploadResponseQueue.push({ status: 500, body: { ok: false, error: "upload failed" } });

    const { container } = renderSettings();
    const inputs = getFileInputs(container);
    fireFileChange(inputs[1], new File(["x"], "cover.jpg", { type: "image/jpeg" }));

    fireEvent.click(screen.getByText("公開設定"));
    fireEvent.click(screen.getAllByText("保存する")[0]);

    await waitFor(() => {
      expect(screen.getAllByText(/カバー画像のアップロードに失敗/).length).toBeGreaterThanOrEqual(
        1
      );
    });
    expect(getCallsTo("/api/salon-page")).toHaveLength(0);
  });
});

// ─── 保存データにStep1詳細が反映される ───
describe("保存データに詳細情報が反映される", () => {
  it("紹介文・住所・営業時間・定休日が保存ペイロードに含まれる", async () => {
    renderSettings();
    fireEvent.click(screen.getByText("詳細情報"));

    fireEvent.click(screen.getByText("サロン紹介文"));
    fireEvent.change(screen.getByPlaceholderText(/サロンの特徴やこだわり/), {
      target: { value: "こだわり説明" },
    });
    fireEvent.click(screen.getByText("アクセス"));
    fireEvent.change(screen.getByPlaceholderText(/東京都渋谷区/), {
      target: { value: "東京都渋谷区A" },
    });
    fireEvent.change(screen.getByPlaceholderText(/maps\.google\.com/), {
      target: { value: "https://maps.google.com/z" },
    });
    fireEvent.click(screen.getByText("営業時間・定休日"));
    fireEvent.change(screen.getByPlaceholderText(/平日 10:00/), {
      target: { value: "平日 10-20" },
    });
    fireEvent.change(screen.getByPlaceholderText(/毎週月曜日/), {
      target: { value: "毎週月曜日" },
    });

    fireEvent.click(screen.getByText("公開設定"));
    fireEvent.click(screen.getAllByText("保存する")[0]);

    await waitFor(() => {
      expect(getCallsTo("/api/salon-page")).toHaveLength(1);
    });
    const payload = await getSavePayload();
    expect(payload.description).toBe("こだわり説明");
    expect(payload.address).toBe("東京都渋谷区A");
    expect(payload.google_map_url).toBe("https://maps.google.com/z");
    expect(payload.business_hours).toEqual({ text: "平日 10-20" });
    expect(payload.closed_days).toBe("毎週月曜日");
  });

  it("メニュー項目が保存ペイロードに配列として含まれる", async () => {
    renderSettings();
    fireEvent.click(screen.getByText("詳細情報"));
    fireEvent.click(screen.getByText("メニュー・料金表"));
    fireEvent.click(screen.getByText("メニューを追加"));
    fireEvent.change(screen.getByPlaceholderText("メニュー名"), { target: { value: "カット" } });
    fireEvent.change(screen.getByPlaceholderText("¥0,000"), { target: { value: "¥4,500" } });

    fireEvent.click(screen.getByText("公開設定"));
    fireEvent.click(screen.getAllByText("保存する")[0]);

    await waitFor(() => {
      expect(getCallsTo("/api/salon-page")).toHaveLength(1);
    });
    const payload = await getSavePayload();
    expect(Array.isArray(payload.menu_items)).toBe(true);
    const items = payload.menu_items;
    if (!Array.isArray(items)) throw new Error("menu_items must be array");
    const first = items[0];
    if (typeof first !== "object" || first === null) throw new Error("menu item must be object");
    expect(Reflect.get(first, "name")).toBe("カット");
    expect(Reflect.get(first, "price")).toBe("¥4,500");
  });

  it("アクセントカラーとレイアウトが保存ペイロードに含まれる", async () => {
    const { container } = renderSettings();
    fireEvent.click(screen.getByText("デザイン"));
    const colorInput = container.querySelector<HTMLInputElement>('input[type="color"]');
    if (colorInput) {
      fireEvent.change(colorInput, { target: { value: "#112233" } });
    }
    fireEvent.click(screen.getByText("グリッド"));

    fireEvent.click(screen.getByText("公開設定"));
    fireEvent.click(screen.getAllByText("保存する")[0]);

    await waitFor(() => {
      expect(getCallsTo("/api/salon-page")).toHaveLength(1);
    });
    const payload = await getSavePayload();
    expect(payload.accent_color).toBe("#112233");
    expect(payload.review_layout).toBe("grid");
  });
});
