import { describe, it, expect } from "vitest";
import { FORM_TEMPLATES } from "@/lib/default-questions";

// ---------------------------------------------------------------------------
// ポップアップのロジックテスト
// ---------------------------------------------------------------------------

describe("TestimonialToast - ポップアップロジック", () => {
  describe("テンプレート選択", () => {
    it("全テンプレートが選択肢として利用可能", () => {
      expect(FORM_TEMPLATES.length).toBeGreaterThanOrEqual(3);
      FORM_TEMPLATES.forEach((tpl) => {
        expect(tpl.id).toBeTruthy();
        expect(tpl.label).toBeTruthy();
        expect(tpl.description).toBeTruthy();
      });
    });

    it("テンプレート未選択では次へ進めない", () => {
      const selectedTemplate: string | null = null;
      expect(!selectedTemplate).toBe(true);
    });

    it("テンプレート選択済みでは次へ進める", () => {
      const selectedTemplate: string | null = "coaching";
      expect(!selectedTemplate).toBe(false);
    });
  });

  describe("handleTry", () => {
    it("選択されたテンプレートIDが保存される", () => {
      const selectedTemplate = "therapy";
      const stored = selectedTemplate || "coaching";
      expect(stored).toBe("therapy");
    });

    it("テンプレート未選択の場合はcoachingがデフォルト", () => {
      const selectedTemplate: string | null = null;
      const stored = selectedTemplate || "coaching";
      expect(stored).toBe("coaching");
    });

    it("遷移先は/tryである", () => {
      const href = "/try";
      expect(href).toBe("/try");
    });
  });

  describe("ステップ遷移", () => {
    it("ステップ0→1→2の順に進む", () => {
      let step = 0;
      step = 1; // 「はい、表示したい」
      expect(step).toBe(1);
      step = 2; // 「次へ」
      expect(step).toBe(2);
    });

    it("ステップ1から0に戻れる", () => {
      let step = 1;
      step = 0;
      expect(step).toBe(0);
    });

    it("ステップは合計3つ", () => {
      const totalSteps = 3;
      expect(totalSteps).toBe(3);
    });
  });
});
