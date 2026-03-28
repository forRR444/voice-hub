export function validateEmail(email: string): string | null {
  if (!email) return "メールアドレスを入力してください";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "メールアドレスの形式が正しくありません";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "パスワードを入力してください";
  if (password.length < 8) return "パスワードは8文字以上で入力してください";
  return null;
}

export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (password !== confirm) return "パスワードが一致しません";
  return null;
}
