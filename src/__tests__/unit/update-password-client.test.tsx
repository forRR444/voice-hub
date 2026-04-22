import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { updateUser: vi.fn() },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string } & Record<string, unknown>) => {
    const { priority, ...safeRest } = rest as Record<string, unknown>;
    void priority;
    return <img src={src} alt={alt} {...safeRest} />;
  },
}));

import UpdatePasswordClient from "@/app/update-password/update-password-client";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UpdatePasswordClient", () => {
  it("新しいパスワード入力フォームが表示される", () => {
    render(<UpdatePasswordClient />);
    expect(screen.getByText("新しいパスワードを設定")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("新しいパスワード（8文字以上）")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("新しいパスワード（確認）")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "パスワードを更新" })).toBeInTheDocument();
  });

  it("短いパスワードを入力するとバリデーションエラーが表示される", () => {
    render(<UpdatePasswordClient />);

    fireEvent.change(screen.getByPlaceholderText("新しいパスワード（8文字以上）"), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByPlaceholderText("新しいパスワード（確認）"), {
      target: { value: "short" },
    });
    fireEvent.click(screen.getByRole("button", { name: "パスワードを更新" }));

    expect(screen.getByText("パスワードは8文字以上で入力してください")).toBeInTheDocument();
  });

  it("パスワードが一致しないとバリデーションエラーが表示される", () => {
    render(<UpdatePasswordClient />);

    fireEvent.change(screen.getByPlaceholderText("新しいパスワード（8文字以上）"), {
      target: { value: "securepass1" },
    });
    fireEvent.change(screen.getByPlaceholderText("新しいパスワード（確認）"), {
      target: { value: "differentpass1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "パスワードを更新" }));

    expect(screen.getByText("パスワードが一致しません")).toBeInTheDocument();
  });
});
