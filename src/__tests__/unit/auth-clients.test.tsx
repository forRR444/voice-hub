import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
  }),
}));

vi.mock("@/lib/auth-utils", () => ({
  preserveTemplate: vi.fn(),
}));

vi.mock("@/hooks/use-google-oauth", () => ({
  useGoogleOAuth: () => ({ handleGoogleLogin: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// next/image: return a plain <img> ignoring SSR-only props
vi.mock("next/image", () => ({
  default: ({ src, alt, ...rest }: { src: string; alt: string } & Record<string, unknown>) => {
    const { priority, ...safeRest } = rest as Record<string, unknown>;
    void priority;
    // eslint-disable-next-line @next/next/no-img-element -- mocking next/image in test
    return <img src={src} alt={alt} {...safeRest} />;
  },
}));

import LoginClient from "@/app/login/login-client";
import SignupClient from "@/app/signup/signup-client";
import ResetPasswordClient from "@/app/reset-password/reset-password-client";

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── LoginClient ──────────────────────────────────────────────────────

describe("LoginClient", () => {
  it("初期表示でGoogleログインとメールログインボタンが表示される", () => {
    render(<LoginClient />);
    expect(screen.getByRole("button", { name: /Googleでログイン/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "メールアドレスでログイン" })).toBeInTheDocument();
  });

  it("「メールアドレスでログイン」を押すとメール/パスワード入力欄が表示される", () => {
    render(<LoginClient />);
    fireEvent.click(screen.getByRole("button", { name: "メールアドレスでログイン" }));
    expect(screen.getByPlaceholderText("メールアドレス")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("パスワード")).toBeInTheDocument();
  });

  it("空のメールアドレスでログインするとバリデーションエラーが表示される", () => {
    render(<LoginClient />);
    fireEvent.click(screen.getByRole("button", { name: "メールアドレスでログイン" }));
    fireEvent.click(screen.getByRole("button", { name: "ログイン" }));
    expect(screen.getByText("メールアドレスを入力してください")).toBeInTheDocument();
  });

  it("新規登録リンクがhref=/signupを持つ", () => {
    render(<LoginClient />);
    const links = screen.getAllByRole("link", { name: "新規登録" });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toHaveAttribute("href", "/signup");
  });

  it("「戻る」ボタンでメールフォームを閉じて初期ビューに戻る", () => {
    render(<LoginClient />);
    fireEvent.click(screen.getByRole("button", { name: "メールアドレスでログイン" }));
    fireEvent.click(screen.getByRole("button", { name: /戻る/ }));
    expect(screen.queryByPlaceholderText("メールアドレス")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "メールアドレスでログイン" })).toBeInTheDocument();
  });

  it("パスワードを忘れた方リンクがhref=/reset-passwordを持つ", () => {
    render(<LoginClient />);
    fireEvent.click(screen.getByRole("button", { name: "メールアドレスでログイン" }));
    const link = screen.getByRole("link", { name: "パスワードを忘れた方" });
    expect(link).toHaveAttribute("href", "/reset-password");
  });
});

// ─── SignupClient ─────────────────────────────────────────────────────

describe("SignupClient", () => {
  it("初期表示でGoogle登録とメール登録ボタンが表示される", () => {
    render(<SignupClient />);
    expect(screen.getByRole("button", { name: /Googleで登録/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "メールアドレスで登録" })).toBeInTheDocument();
  });

  it("ログインリンクがhref=/loginを持つ", () => {
    render(<SignupClient />);
    const links = screen.getAllByRole("link", { name: "ログイン" });
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toHaveAttribute("href", "/login");
  });

  it("パスワード不一致でバリデーションエラーが表示される", () => {
    render(<SignupClient />);
    fireEvent.click(screen.getByRole("button", { name: "メールアドレスで登録" }));

    fireEvent.change(screen.getByPlaceholderText("メールアドレス"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("パスワード（8文字以上）"), {
      target: { value: "securepass1" },
    });
    fireEvent.change(screen.getByPlaceholderText("パスワード（確認）"), {
      target: { value: "differentpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "無料で登録" }));

    expect(screen.getByText("パスワードが一致しません")).toBeInTheDocument();
  });

  it("短いパスワードでバリデーションエラーが表示される", () => {
    render(<SignupClient />);
    fireEvent.click(screen.getByRole("button", { name: "メールアドレスで登録" }));

    fireEvent.change(screen.getByPlaceholderText("メールアドレス"), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("パスワード（8文字以上）"), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByPlaceholderText("パスワード（確認）"), {
      target: { value: "short" },
    });
    fireEvent.click(screen.getByRole("button", { name: "無料で登録" }));

    expect(screen.getByText("パスワードは8文字以上で入力してください")).toBeInTheDocument();
  });

  it("空メールアドレスでバリデーションエラーが表示される", () => {
    render(<SignupClient />);
    fireEvent.click(screen.getByRole("button", { name: "メールアドレスで登録" }));
    fireEvent.click(screen.getByRole("button", { name: "無料で登録" }));
    expect(screen.getByText("メールアドレスを入力してください")).toBeInTheDocument();
  });
});

// ─── ResetPasswordClient ──────────────────────────────────────────────

describe("ResetPasswordClient", () => {
  it("パスワードリセットフォームが表示される", () => {
    render(<ResetPasswordClient />);
    expect(screen.getByText("パスワードをリセット")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("登録済みのメールアドレス")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "リセットメールを送信" })).toBeInTheDocument();
  });

  it("空メールで送信するとバリデーションエラーが表示される", () => {
    render(<ResetPasswordClient />);
    fireEvent.click(screen.getByRole("button", { name: "リセットメールを送信" }));
    expect(screen.getByText("メールアドレスを入力してください")).toBeInTheDocument();
  });

  it("ログインに戻るリンクがhref=/loginを持つ", () => {
    render(<ResetPasswordClient />);
    const link = screen.getByRole("link", { name: "ログインに戻る" });
    expect(link).toHaveAttribute("href", "/login");
  });
});
