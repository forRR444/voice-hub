import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// embed.js のソースコードをテキストとして読み込み、内容を検証する
// ブラウザ環境のDOMが必要な部分はE2Eに任せ、ここではコード構造を検証
// ---------------------------------------------------------------------------

const embedSource = readFileSync(
  join(process.cwd(), "public/widget/v1/embed.js"),
  "utf-8"
);

describe("embed.js コード構造", () => {
  // ============================
  // ウィジェットタイプ対応
  // ============================
  describe("ウィジェットタイプのサポート", () => {
    it.each([
      "carousel",
      "marquee",
      "list",
      "single",
      "wall",
      "badge",
      "grid",
    ])("タイプ '%s' がswitch文で処理される", (type) => {
      expect(embedSource).toContain(`case "${type}"`);
    });

    it("全7タイプのレンダー関数が定義されている", () => {
      expect(embedSource).toContain("function renderCarousel");
      expect(embedSource).toContain("function renderGrid");
      expect(embedSource).toContain("function renderMarquee");
      expect(embedSource).toContain("function renderList");
      expect(embedSource).toContain("function renderSingle");
      expect(embedSource).toContain("function renderWall");
      expect(embedSource).toContain("function renderBadgeWidget");
    });

    it("marqueeがgridにフォールスルーしない（独立したcase）", () => {
      const marqueeIndex = embedSource.indexOf('case "marquee"');
      const gridIndex = embedSource.indexOf('case "grid"');
      // marqueeのcaseがgridより前にあること
      expect(marqueeIndex).toBeLessThan(gridIndex);
      // marqueeの直後にbreakがあること（gridにフォールスルーしない）
      const afterMarquee = embedSource.substring(
        marqueeIndex,
        marqueeIndex + 200
      );
      expect(afterMarquee).toContain("break");
    });
  });

  // ============================
  // CSS定義
  // ============================
  describe("CSS定義", () => {
    it("ライトモードとダークモードのCSS変数が定義されている", () => {
      expect(embedSource).toContain(".vh-root.vh-dark");
      expect(embedSource).toContain(".vh-root.vh-light");
    });

    it("各ウィジェットタイプのCSSクラスが定義されている", () => {
      expect(embedSource).toContain(".vh-grid");
      expect(embedSource).toContain(".vh-carousel");
      expect(embedSource).toContain(".vh-marquee");
      expect(embedSource).toContain(".vh-list");
      expect(embedSource).toContain(".vh-single");
      expect(embedSource).toContain(".vh-wall");
      expect(embedSource).toContain(".vh-badge-widget");
    });

    it("マーキーのアニメーションが定義されている", () => {
      expect(embedSource).toContain("@keyframes vh-marquee-scroll");
      expect(embedSource).toContain("translateX(-50%)");
    });

    it("スケルトンローダーのアニメーションが定義されている", () => {
      expect(embedSource).toContain("@keyframes vh-shimmer");
      expect(embedSource).toContain(".vh-skeleton");
    });

    it("Powered byバッジのCSSが定義されている", () => {
      expect(embedSource).toContain(".vh-powered");
    });
  });

  // ============================
  // Shadow DOM
  // ============================
  describe("Shadow DOM", () => {
    it("attachShadowを使用している", () => {
      expect(embedSource).toContain("attachShadow");
    });

    it("renderWidgetで既存のshadowRootを再利用する", () => {
      expect(embedSource).toContain(
        "container.shadowRoot || container.attachShadow"
      );
    });
  });

  // ============================
  // API通信
  // ============================
  describe("API通信", () => {
    it("正しいAPIエンドポイントにfetchする", () => {
      expect(embedSource).toContain('/api/widgets/"');
    });

    it("widgetIdをencodeURIComponentでエンコードする", () => {
      expect(embedSource).toContain("encodeURIComponent(widgetId)");
    });

    it("エラー時にウィジェットを非表示にする", () => {
      expect(embedSource).toContain('el.style.display = "none"');
    });
  });

  // ============================
  // 遅延読み込み
  // ============================
  describe("遅延読み込み", () => {
    it("IntersectionObserverを使用している", () => {
      expect(embedSource).toContain("IntersectionObserver");
    });

    it("rootMarginが設定されている", () => {
      expect(embedSource).toContain("rootMargin");
    });

    it("スケルトンを最初に表示する", () => {
      expect(embedSource).toContain("showSkeleton");
    });
  });

  // ============================
  // XSS対策
  // ============================
  describe("XSS対策", () => {
    it("escapeHtml関数が定義されている", () => {
      expect(embedSource).toContain("function escapeHtml");
    });

    it("HTMLエンティティをエスケープしている", () => {
      expect(embedSource).toContain("&amp;");
      expect(embedSource).toContain("&lt;");
      expect(embedSource).toContain("&gt;");
      expect(embedSource).toContain("&quot;");
    });
  });

  // ============================
  // カルーセル機能
  // ============================
  describe("カルーセル機能", () => {
    it("ナビゲーションボタン（前へ/次へ）がある", () => {
      expect(embedSource).toContain("vh-prev");
      expect(embedSource).toContain("vh-next");
    });

    it("ドットナビゲーションがある", () => {
      expect(embedSource).toContain("vh-dots");
      expect(embedSource).toContain("vh-dot");
    });

    it("自動再生が実装されている", () => {
      expect(embedSource).toContain("autoplay");
      expect(embedSource).toContain("setInterval");
    });

    it("ホバーで自動再生が停止する", () => {
      expect(embedSource).toContain("mouseenter");
      expect(embedSource).toContain("mouseleave");
      expect(embedSource).toContain("clearInterval");
    });

    it("MutationObserverでクリーンアップする", () => {
      expect(embedSource).toContain("MutationObserver");
      expect(embedSource).toContain("isConnected");
    });
  });

  // ============================
  // シングルタイプ機能
  // ============================
  describe("シングルタイプ機能", () => {
    it("フェードトランジションが実装されている", () => {
      expect(embedSource).toContain("vh-single-fade");
      expect(embedSource).toContain("opacity");
    });

    it("複数テスティモニアルで自動切替する", () => {
      const singleFunc = embedSource.substring(
        embedSource.indexOf("function renderSingle")
      );
      expect(singleFunc).toContain("setInterval");
    });
  });

  // ============================
  // マーキー機能
  // ============================
  describe("マーキー機能", () => {
    it("カードを複製してシームレスループする", () => {
      const marqueeFunc = embedSource.substring(
        embedSource.indexOf("function renderMarquee"),
        embedSource.indexOf("function renderGrid")
      );
      // 2つのforループがある（オリジナル+複製）
      const forCount = (marqueeFunc.match(/for \(var/g) || []).length;
      expect(forCount).toBe(2);
    });

    it("ホバーで停止するCSS設定がある", () => {
      expect(embedSource).toContain("animation-play-state: paused");
    });

    it("アイテム数に応じたduration計算がある", () => {
      expect(embedSource).toContain("--vh-marquee-duration");
    });
  });

  // ============================
  // バッジウィジェット機能
  // ============================
  describe("バッジウィジェット機能", () => {
    it("平均評価を計算している", () => {
      const badgeFunc = embedSource.substring(
        embedSource.indexOf("function renderBadgeWidget"),
        embedSource.indexOf("function renderCarousel")
      );
      expect(badgeFunc).toContain("toFixed");
    });

    it("件数を表示している", () => {
      expect(embedSource).toContain("vh-badge-info");
    });
  });

  // ============================
  // 初期化
  // ============================
  describe("初期化", () => {
    it("data-testimonial-widget属性でウィジェットを検出する", () => {
      expect(embedSource).toContain("[data-testimonial-widget]");
    });

    it("DOMContentLoadedで初期化する", () => {
      expect(embedSource).toContain("DOMContentLoaded");
    });

    it("baseUrlをscriptのsrcから取得する", () => {
      expect(embedSource).toContain("document.currentScript");
      expect(embedSource).toContain("new URL(scriptUrl).origin");
    });
  });

  // ============================
  // ブランドカラー
  // ============================
  describe("ブランドカラー", () => {
    it("デフォルトブランドカラーが#635BFFである", () => {
      expect(embedSource).toContain("#635BFF");
    });

    it("テーマからブランドカラーを取得する", () => {
      expect(embedSource).toContain("theme.brandColor");
    });
  });
});
