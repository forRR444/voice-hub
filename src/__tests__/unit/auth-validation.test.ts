import { validateEmail, validatePassword, validatePasswordMatch, generatePassword } from "@/lib/validation";

describe("validateEmail", () => {
  it("空文字でエラーを返す", () => {
    expect(validateEmail("")).toBe("メールアドレスを入力してください");
  });

  it("不正な形式でエラーを返す", () => {
    expect(validateEmail("invalid")).toBe("メールアドレスの形式が正しくありません");
    expect(validateEmail("foo@")).toBe("メールアドレスの形式が正しくありません");
    expect(validateEmail("@bar.com")).toBe("メールアドレスの形式が正しくありません");
  });

  it("有効なメールアドレスでnullを返す", () => {
    expect(validateEmail("test@example.com")).toBeNull();
    expect(validateEmail("user+tag@domain.co.jp")).toBeNull();
  });
});

describe("validatePassword", () => {
  it("空文字でエラーを返す", () => {
    expect(validatePassword("")).toBe("パスワードを入力してください");
  });

  it("8文字未満でエラーを返す", () => {
    expect(validatePassword("1234567")).toBe("パスワードは8文字以上で入力してください");
  });

  it("8文字でnullを返す", () => {
    expect(validatePassword("12345678")).toBeNull();
  });

  it("8文字超でnullを返す", () => {
    expect(validatePassword("longpassword123")).toBeNull();
  });
});

describe("validatePasswordMatch", () => {
  it("不一致でエラーを返す", () => {
    expect(validatePasswordMatch("password1", "password2")).toBe("パスワードが一致しません");
  });

  it("一致でnullを返す", () => {
    expect(validatePasswordMatch("password1", "password1")).toBeNull();
  });
});

describe("generatePassword", () => {
  it("デフォルトで16文字のパスワードを生成する", () => {
    expect(generatePassword()).toHaveLength(16);
  });

  it("指定した長さのパスワードを生成する", () => {
    expect(generatePassword(8)).toHaveLength(8);
    expect(generatePassword(32)).toHaveLength(32);
  });

  it("毎回異なるパスワードを生成する", () => {
    const passwords = new Set(Array.from({ length: 20 }, () => generatePassword()));
    expect(passwords.size).toBe(20);
  });

  it("バリデーションを通過するパスワードを生成する", () => {
    for (let i = 0; i < 10; i++) {
      expect(validatePassword(generatePassword())).toBeNull();
    }
  });
});
