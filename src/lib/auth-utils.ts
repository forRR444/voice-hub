export function preserveTemplate() {
  const template = new URLSearchParams(window.location.search).get("template");
  if (template) {
    localStorage.setItem("voicehub_template", template);
  }
}

export function translateOAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("popup_closed_by_user") || lower.includes("popup_closed")) {
    return "ログインがキャンセルされました";
  }
  if (lower.includes("access_denied")) {
    return "アクセスが拒否されました";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "ネットワークエラーが発生しました";
  }
  return "ログインに失敗しました。もう一度お試しください";
}
