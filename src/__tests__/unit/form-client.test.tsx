import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { createRef } from "react";
import type { FormRow, FormQuestion } from "@/types/database";
import {
  IMAGE_MAX_SIZE_BYTES,
  IMAGE_RESIZED_MAX_BYTES,
} from "@/lib/constants";

// ─── Mocks ─────────────────────────────────────────────────────────────

const fetchMock = vi.fn();
const uploadMock = vi.fn();
const getPublicUrlMock = vi.fn();
const removeMock = vi.fn();
const resizeImageMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: uploadMock,
        getPublicUrl: getPublicUrlMock,
        remove: removeMock,
      }),
    },
  }),
}));

vi.mock("@/lib/image-utils", () => ({
  resizeImage: (...args: unknown[]) => resizeImageMock(...args),
}));

vi.mock("@/app/components/star-rating-input", () => ({
  StarRatingInput: ({
    value,
    onChange,
    brandColor,
  }: {
    value: number;
    onChange: (v: number) => void;
    brandColor: string;
  }) => (
    <button
      type="button"
      data-testid="star"
      data-value={value}
      data-brand={brandColor}
      onClick={() => onChange(5)}
    >
      star
    </button>
  ),
}));

import { FormClient, type FormClientHandle } from "@/app/form/[slug]/form-client";

// ─── Fixtures ──────────────────────────────────────────────────────────

function makeForm(
  overrides: Partial<FormRow> = {},
  questions?: FormQuestion[]
): FormRow {
  return {
    id: "f-1",
    workspace_id: "ws-1",
    slug: "demo-slug",
    title: "テストフォーム",
    description: null,
    brand_color: "#635BFF",
    logo_url: null,
    thank_you_message: "ありがとう",
    questions:
      questions ?? [
        { id: "rating", label: "評価", type: "star_rating", required: true },
        { id: "content", label: "感想", type: "textarea", required: true },
        { id: "name", label: "名前", type: "text", required: true },
        { id: "permission", label: "許可", type: "checkbox", required: true },
      ],
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeFile(name: string, type: string, size: number): File {
  const f = new File([new Uint8Array(1)], name, { type });
  Object.defineProperty(f, "size", { value: size, writable: false });
  return f;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBody(body: unknown): Record<string, unknown> {
  if (typeof body !== "string") {
    throw new Error("expected body to be a JSON string");
  }
  const parsed: unknown = JSON.parse(body);
  if (!isPlainRecord(parsed)) {
    throw new Error("expected body to be a JSON object");
  }
  return parsed;
}

type FetchInit = { method?: unknown; body?: unknown; headers?: unknown };

function isFetchInit(value: unknown): value is FetchInit {
  return typeof value === "object" && value !== null;
}

function getFetchInit(call: unknown): FetchInit {
  if (!Array.isArray(call) || call.length < 2) {
    throw new Error("expected fetch call args");
  }
  const init = call[1];
  if (!isFetchInit(init)) {
    throw new Error("expected fetch init");
  }
  return init;
}

// ─── Setup ─────────────────────────────────────────────────────────────

class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = "";
  readonly thresholds: readonly number[] = [];
  private callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  observe(el: Element) {
    const entry: IntersectionObserverEntry = {
      isIntersecting: true,
      target: el,
      boundingClientRect: el.getBoundingClientRect(),
      intersectionRatio: 1,
      intersectionRect: el.getBoundingClientRect(),
      rootBounds: null,
      time: 0,
    };
    this.callback([entry], this);
  }
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("URL", {
    createObjectURL: () => "blob:preview",
    revokeObjectURL: vi.fn(),
  });
  vi.stubGlobal("crypto", { randomUUID: () => "uuid-1" });
  // Re-stub IntersectionObserver because afterEach's unstubAllGlobals() strips setup.ts's stub
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  uploadMock.mockReset();
  getPublicUrlMock.mockReset();
  removeMock.mockReset();
  resizeImageMock.mockReset();
  fetchMock.mockReset();
  uploadMock.mockResolvedValue({ error: null });
  getPublicUrlMock.mockReturnValue({
    data: { publicUrl: "https://cdn/x.jpg" },
  });
  removeMock.mockResolvedValue({ data: null, error: null });
  resizeImageMock.mockResolvedValue(new Blob(["x"], { type: "image/jpeg" }));
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({}),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// ─── Helpers ───────────────────────────────────────────────────────────

function getNextButton(): HTMLButtonElement {
  const btn = screen.getByRole("button", { name: /次へ|送信する|送信中/ });
  if (!(btn instanceof HTMLButtonElement)) {
    throw new Error("next button not found");
  }
  return btn;
}

// ─── Tests ─────────────────────────────────────────────────────────────

describe("FormClient - バリデーション", () => {
  it("rating 必須: 未選択で次へボタンが無効", () => {
    render(<FormClient form={makeForm()} />);
    expect(getNextButton()).toBeDisabled();
  });

  it("rating 必須: 星クリック後に次へボタンが有効", () => {
    render(<FormClient form={makeForm()} />);
    fireEvent.click(screen.getByTestId("star"));
    expect(getNextButton()).not.toBeDisabled();
  });

  it("textarea 必須: 空白のみで無効、文字入力で有効", () => {
    const form = makeForm({}, [
      { id: "content", label: "感想", type: "textarea", required: true },
    ]);
    const { container } = render(<FormClient form={form} />);
    const textarea = container.querySelector("textarea");
    if (!(textarea instanceof HTMLTextAreaElement)) {
      throw new Error("textarea not found");
    }
    fireEvent.change(textarea, { target: { value: "   " } });
    expect(getNextButton()).toBeDisabled();
    fireEvent.change(textarea, { target: { value: "本当に素晴らしい" } });
    expect(getNextButton()).not.toBeDisabled();
  });

  it("text 必須: trim で空なら無効", () => {
    const form = makeForm({}, [
      { id: "name", label: "名前", type: "text", required: true },
    ]);
    const { container } = render(<FormClient form={form} />);
    // NB: there is a honeypot input[type="text"] — pick the non-hidden one by maxLength
    const textInputs = container.querySelectorAll('input[type="text"]');
    let input: HTMLInputElement | null = null;
    textInputs.forEach((el) => {
      if (el instanceof HTMLInputElement && el.maxLength === 100) {
        input = el;
      }
    });
    if (!input) {
      throw new Error("text input not found");
    }
    fireEvent.change(input, { target: { value: "   " } });
    expect(getNextButton()).toBeDisabled();
    fireEvent.change(input, { target: { value: "田中" } });
    expect(getNextButton()).not.toBeDisabled();
  });

  it("checkbox(permission) 必須: チェックなしで無効、チェックで有効", () => {
    const form = makeForm({}, [
      { id: "permission", label: "許可", type: "checkbox", required: true },
    ]);
    const { container } = render(<FormClient form={form} />);
    expect(getNextButton()).toBeDisabled();
    const checkbox = container.querySelector('input[type="checkbox"]');
    if (!(checkbox instanceof HTMLInputElement)) {
      throw new Error("checkbox not found");
    }
    fireEvent.click(checkbox);
    expect(getNextButton()).not.toBeDisabled();
  });

  it("非必須のtextareaは常に有効", () => {
    const form = makeForm({}, [
      { id: "content", label: "感想", type: "textarea", required: false },
    ]);
    render(<FormClient form={form} />);
    expect(getNextButton()).not.toBeDisabled();
  });

  it("カスタム select 必須: 未選択で無効、選択で有効", () => {
    const form = makeForm({}, [
      {
        id: "custom_select",
        label: "好きな色",
        type: "select",
        required: true,
        options: ["赤", "青"],
      },
    ]);
    const { container } = render(<FormClient form={form} />);
    expect(getNextButton()).toBeDisabled();
    const select = container.querySelector("select");
    if (!(select instanceof HTMLSelectElement)) {
      throw new Error("select not found");
    }
    fireEvent.change(select, { target: { value: "赤" } });
    expect(getNextButton()).not.toBeDisabled();
  });

  it("カスタム checkbox 必須: 未チェックで無効、チェックで有効", () => {
    const form = makeForm({}, [
      {
        id: "custom_agree",
        label: "同意する",
        type: "checkbox",
        required: true,
      },
    ]);
    const { container } = render(<FormClient form={form} />);
    expect(getNextButton()).toBeDisabled();
    const checkbox = container.querySelector('input[type="checkbox"]');
    if (!(checkbox instanceof HTMLInputElement)) {
      throw new Error("checkbox not found");
    }
    fireEvent.click(checkbox);
    expect(getNextButton()).not.toBeDisabled();
  });
});

describe("FormClient - ナビゲーション", () => {
  it("step=0 では戻るボタンが非表示", () => {
    render(<FormClient form={makeForm()} />);
    expect(
      screen.queryByRole("button", { name: /戻る/ })
    ).not.toBeInTheDocument();
  });

  it("step>0 で戻るボタンが表示され step を戻す", () => {
    render(<FormClient form={makeForm()} />);
    // Advance to step 1 via star click + next
    fireEvent.click(screen.getByTestId("star"));
    fireEvent.click(getNextButton());
    // now step=1 (textarea: 感想)
    expect(screen.getByText("感想")).toBeInTheDocument();
    const back = screen.getByRole("button", { name: /戻る/ });
    fireEvent.click(back);
    // back to step 0 — rating label visible
    expect(screen.getByText("評価")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /戻る/ })
    ).not.toBeInTheDocument();
  });

  it("ref.skip() で step が1つ進む", () => {
    const ref = createRef<FormClientHandle>();
    render(<FormClient ref={ref} form={makeForm()} />);
    expect(screen.getByText("評価")).toBeInTheDocument();
    act(() => {
      ref.current?.skip();
    });
    expect(screen.getByText("感想")).toBeInTheDocument();
  });

  it("ref.skip() は最終 step では何もしない", () => {
    const ref = createRef<FormClientHandle>();
    const form = makeForm({}, [
      { id: "name", label: "名前", type: "text", required: false },
    ]);
    render(<FormClient ref={ref} form={form} />);
    // single-step form, skip should not advance nor crash
    act(() => {
      ref.current?.skip();
    });
    // Still on the name step (label is rendered)
    expect(screen.getByText("名前")).toBeInTheDocument();
  });
});

describe("FormClient - 画像アップロード", () => {
  function renderImageForm() {
    const form = makeForm({}, [
      { id: "avatar", label: "写真", type: "image", required: false },
    ]);
    return render(<FormClient form={form} />);
  }

  it("非画像MIMEでエラーメッセージが表示される", async () => {
    const { container } = renderImageForm();
    const input = container.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("file input not found");
    }
    const file = makeFile("a.txt", "text/plain", 1024);
    fireEvent.change(input, { target: { files: [file] } });
    expect(
      await screen.findByText(/画像ファイルを選択/)
    ).toBeInTheDocument();
  });

  it("10MB超でサイズエラーが表示される", async () => {
    const { container } = renderImageForm();
    const input = container.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("file input not found");
    }
    const file = makeFile("big.jpg", "image/jpeg", IMAGE_MAX_SIZE_BYTES + 1);
    fireEvent.change(input, { target: { files: [file] } });
    expect(
      await screen.findByText(/ファイルサイズが大きすぎます/)
    ).toBeInTheDocument();
  });

  it("リサイズ結果が2MB超で圧縮エラーが表示される", async () => {
    const hugeBlob = new Blob(["x"], { type: "image/jpeg" });
    Object.defineProperty(hugeBlob, "size", {
      value: IMAGE_RESIZED_MAX_BYTES + 1,
      writable: false,
    });
    resizeImageMock.mockResolvedValueOnce(hugeBlob);
    const { container } = renderImageForm();
    const input = container.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("file input not found");
    }
    const file = makeFile("ok.jpg", "image/jpeg", 1024);
    fireEvent.change(input, { target: { files: [file] } });
    expect(
      await screen.findByText(/圧縮後もサイズが大きすぎます/)
    ).toBeInTheDocument();
  });

  it("resizeImage が throw すると「画像の処理に失敗しました」が表示される", async () => {
    resizeImageMock.mockRejectedValueOnce(new Error("boom"));
    const { container } = renderImageForm();
    const input = container.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("file input not found");
    }
    const file = makeFile("ok.jpg", "image/jpeg", 1024);
    fireEvent.change(input, { target: { files: [file] } });
    expect(
      await screen.findByText(/画像の処理に失敗しました/)
    ).toBeInTheDocument();
  });

  it("正常アップロード: プレビュー img が表示される", async () => {
    const { container } = renderImageForm();
    const input = container.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("file input not found");
    }
    const file = makeFile("ok.jpg", "image/jpeg", 1024);
    fireEvent.change(input, { target: { files: [file] } });
    const preview = await screen.findByAltText("プレビュー");
    expect(preview).toBeInTheDocument();
    if (!(preview instanceof HTMLImageElement)) {
      throw new Error("preview not HTMLImageElement");
    }
    expect(preview.src).toContain("blob:preview");
  });
});

describe("FormClient - 送信フロー", () => {
  function singleQuestionForm(): FormRow {
    return makeForm({}, [
      { id: "content", label: "感想", type: "textarea", required: true },
    ]);
  }

  async function fillAndSubmit(
    container: HTMLElement,
    value = "とても良い体験でした"
  ): Promise<void> {
    const textarea = container.querySelector("textarea");
    if (!(textarea instanceof HTMLTextAreaElement)) {
      throw new Error("textarea not found");
    }
    fireEvent.change(textarea, { target: { value } });
    fireEvent.click(getNextButton());
  }

  it("demo モード: fetch を呼ばず 800ms 後に送信完了画面に遷移", async () => {
    vi.useFakeTimers();
    try {
      const { container } = render(
        <FormClient form={singleQuestionForm()} demo />
      );
      await fillAndSubmit(container);
      expect(fetchMock).not.toHaveBeenCalled();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(800);
      });
      expect(screen.getByText("ありがとうございます！")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("real モード avatar なし: /api/testimonials へ POST が呼ばれる", async () => {
    const { container } = render(<FormClient form={singleQuestionForm()} />);
    await fillAndSubmit(container, "ハッピー");
    // Wait microtasks to flush
    await act(async () => {
      await Promise.resolve();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    if (!Array.isArray(call) || call[0] !== "/api/testimonials") {
      throw new Error("fetch not called with /api/testimonials");
    }
    const init = getFetchInit(call);
    expect(init.method).toBe("POST");
    const body = parseBody(init.body);
    expect(body.form_id).toBe("f-1");
    expect(body.content).toBe("ハッピー");
    expect(body.avatar_url).toBeNull();
    expect(uploadMock).not.toHaveBeenCalled();
  });

  it("real モード avatar あり: upload→getPublicUrl→fetch の順で呼ばれる", async () => {
    const form = makeForm({}, [
      { id: "avatar", label: "写真", type: "image", required: true },
    ]);
    const { container } = render(<FormClient form={form} />);
    const input = container.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("file input not found");
    }
    const file = makeFile("ok.jpg", "image/jpeg", 1024);
    fireEvent.change(input, { target: { files: [file] } });
    // Wait preview render (resize promise resolved)
    await screen.findByAltText("プレビュー");
    fireEvent.click(getNextButton());
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(uploadMock).toHaveBeenCalledTimes(1);
    expect(getPublicUrlMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // Upload must precede fetch
    const uploadOrder = uploadMock.mock.invocationCallOrder[0];
    const fetchOrder = fetchMock.mock.invocationCallOrder[0];
    expect(uploadOrder).toBeLessThan(fetchOrder);
    const init = getFetchInit(fetchMock.mock.calls[0]);
    const body = parseBody(init.body);
    expect(body.avatar_url).toBe("https://cdn/x.jpg");
  });

  it("upload エラーで storage.remove が呼ばれエラーバナー表示", async () => {
    uploadMock.mockResolvedValueOnce({ error: new Error("network") });
    const form = makeForm({}, [
      { id: "avatar", label: "写真", type: "image", required: true },
    ]);
    const { container } = render(<FormClient form={form} />);
    const input = container.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("file input not found");
    }
    fireEvent.change(input, {
      target: { files: [makeFile("ok.jpg", "image/jpeg", 1024)] },
    });
    await screen.findByAltText("プレビュー");
    fireEvent.click(getNextButton());
    expect(
      await screen.findByText(/写真のアップロードに失敗しました/)
    ).toBeInTheDocument();
    expect(removeMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("APIが!okでerror JSONからメッセージ表示", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "レート制限に達しました" }),
    });
    const { container } = render(<FormClient form={singleQuestionForm()} />);
    await fillAndSubmit(container, "最高でした");
    expect(
      await screen.findByText("レート制限に達しました")
    ).toBeInTheDocument();
  });

  it("fetch が reject するとデフォルトエラーメッセージ表示", async () => {
    fetchMock.mockRejectedValueOnce(new Error("offline"));
    const { container } = render(<FormClient form={singleQuestionForm()} />);
    await fillAndSubmit(container, "最高でした");
    expect(await screen.findByText("offline")).toBeInTheDocument();
  });
});
