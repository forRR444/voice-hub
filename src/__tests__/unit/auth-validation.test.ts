import { validateEmail, validatePassword, validatePasswordMatch } from "@/lib/validation";

// ─── validateEmail ─────────────────────────────────────────────────

describe("validateEmail", () => {
  it("空文字でエラーを返す", () => {
    expect(validateEmail("")).toBe("メールアドレスを入力してください");
  });

  it.each([
    ["@なし", "invalid"],
    ["@のみ", "@"],
    ["ドメインなし", "foo@"],
    ["ユーザーなし", "@bar.com"],
    ["TLDなし", "foo@bar"],
    ["スペース含む", "foo @bar.com"],
    ["複数@", "foo@@bar.com"],
  ])("不正な形式でエラーを返す: %s", (_label, email) => {
    expect(validateEmail(email)).toBe("メールアドレスの形式が正しくありません");
  });

  it.each([
    ["基本形", "test@example.com"],
    ["+タグ付き", "user+tag@domain.co.jp"],
    ["サブドメイン", "user@sub.domain.com"],
    ["数字ドメイン", "user@123.456.com"],
    ["ハイフン含む", "first-last@example.com"],
    ["ドット含む", "first.last@example.com"],
  ])("有効なメールアドレスでnullを返す: %s", (_label, email) => {
    expect(validateEmail(email)).toBeNull();
  });
});

// ─── validatePassword ──────────────────────────────────────────────

describe("validatePassword", () => {
  it("空文字でエラーを返す", () => {
    expect(validatePassword("")).toBe("パスワードを入力してください");
  });

  it.each([
    ["1文字", "a"],
    ["7文字", "1234567"],
  ])("8文字未満でエラーを返す: %s", (_label, pw) => {
    expect(validatePassword(pw)).toBe("パスワードは8文字以上で入力してください");
  });

  it("8文字ちょうどでnullを返す（境界値）", () => {
    expect(validatePassword("12345678")).toBeNull();
  });

  it("長いパスワードでnullを返す", () => {
    expect(validatePassword("a".repeat(100))).toBeNull();
  });

  it("記号を含むパスワードでnullを返す", () => {
    expect(validatePassword("p@ssw0rd!")).toBeNull();
  });

  it("日本語を含むパスワードでnullを返す", () => {
    expect(validatePassword("パスワード12345")).toBeNull();
  });
});

// ─── validatePasswordMatch ─────────────────────────────────────────

describe("validatePasswordMatch", () => {
  it("不一致でエラーを返す", () => {
    expect(validatePasswordMatch("password1", "password2")).toBe("パスワードが一致しません");
  });

  it("一致でnullを返す", () => {
    expect(validatePasswordMatch("password1", "password1")).toBeNull();
  });

  it("空文字同士は一致としてnullを返す", () => {
    expect(validatePasswordMatch("", "")).toBeNull();
  });

  it("大文字小文字が異なると不一致", () => {
    expect(validatePasswordMatch("Password", "password")).toBe("パスワードが一致しません");
  });
});
