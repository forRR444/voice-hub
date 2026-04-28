import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { WorkspaceRow, SubscriptionStatus } from "@/types/database";

// IS_BETA を制御可能にする
vi.mock("@/lib/plan", async () => {
  const actual = await vi.importActual<typeof import("@/lib/plan")>("@/lib/plan");
  return {
    ...actual,
    get IS_BETA() {
      return (globalThis as { __IS_BETA__?: boolean }).__IS_BETA__ ?? false;
    },
  };
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { updateUser: vi.fn() },
    from: () => ({
      update: () => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import SettingsClient from "@/app/dashboard/settings/settings-client";

beforeEach(() => {
  (globalThis as { __IS_BETA__?: boolean }).__IS_BETA__ = false;
  vi.clearAllMocks();
});

function setBeta(on: boolean) {
  (globalThis as { __IS_BETA__?: boolean }).__IS_BETA__ = on;
}

const defaultWorkspace: WorkspaceRow = {
  id: "ws-1",
  user_id: "user-1",
  name: "テストサロン",
  onboarding_completed: true,
  subscription_status: null,
  stripe_customer_id: null,
  stripe_subscription_id: null,
  created_at: "2026-01-01T00:00:00Z",
};

const defaultProps = {
  workspace: defaultWorkspace,
  subscriptionStatus: "free" as SubscriptionStatus,
  hasPassword: false,
  usage: { testimonials: 0, forms: 0, widgets: 0 },
};

describe("SettingsClient", () => {
  it("ページタイトルとワークスペース見出し・入力欄が表示される", () => {
    const { container } = render(<SettingsClient {...defaultProps} />);

    expect(screen.getByRole("heading", { name: "設定", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ワークスペース", level: 3 })).toBeInTheDocument();

    const nameInput = container.querySelector<HTMLInputElement>('input[type="text"]');
    expect(nameInput).not.toBeNull();
    expect(nameInput?.value).toBe("テストサロン");
  });

  it("利用状況セクションが表示される", () => {
    render(<SettingsClient {...defaultProps} />);
    expect(screen.getByRole("heading", { name: "利用状況", level: 3 })).toBeInTheDocument();
  });

  it("通常時（IS_BETA=false）はFreeプランバッジが表示される", () => {
    setBeta(false);
    render(<SettingsClient {...defaultProps} />);
    expect(screen.getByText("Freeプラン")).toBeInTheDocument();
    expect(screen.queryByText("初期サポーター")).not.toBeInTheDocument();
  });

  it("通常時でPro契約ならProプランバッジが表示される", () => {
    setBeta(false);
    render(<SettingsClient {...defaultProps} subscriptionStatus="pro" />);
    expect(screen.getByText("Proプラン")).toBeInTheDocument();
  });

  it("ベータ時は初期サポーターバッジが表示される", () => {
    setBeta(true);
    render(<SettingsClient {...defaultProps} />);
    // ベータ時はヘッダーの利用状況バッジが「初期サポーター」になる
    expect(screen.getByText("初期サポーター")).toBeInTheDocument();
  });

  it("ベータ時は正式リリース後のプラン案内と disabled ボタンが表示される", () => {
    setBeta(true);
    render(<SettingsClient {...defaultProps} />);

    expect(
      screen.getByRole("heading", { name: "正式リリース後のプラン", level: 3 })
    ).toBeInTheDocument();

    const disabledButton = screen.getByRole("button", { name: "正式リリース後に利用可能" });
    expect(disabledButton).toBeInTheDocument();
    expect(disabledButton).toBeDisabled();
  });

  it("通常時は正式リリース後のプラン案内が表示されない", () => {
    setBeta(false);
    render(<SettingsClient {...defaultProps} />);
    expect(
      screen.queryByRole("heading", { name: "正式リリース後のプラン" })
    ).not.toBeInTheDocument();
  });

  it("アカウント削除ボタンが可視で、初期状態ではモーダルは非表示", () => {
    render(<SettingsClient {...defaultProps} />);

    expect(screen.getByRole("button", { name: "アカウントを削除する" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "アカウントの削除" })).not.toBeInTheDocument();
  });
});
