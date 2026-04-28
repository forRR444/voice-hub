import { describe, it, expect } from "vitest";
import { SALON_THEMES } from "@/lib/salon-themes";

describe("SALON_THEMES", () => {
  it("natural, modern, elegant の3テーマが定義されている", () => {
    expect(Object.keys(SALON_THEMES)).toEqual(["natural", "modern", "elegant"]);
  });

  it.each(["natural", "modern", "elegant"])(
    "%s テーマに必要なスタイル値が全て存在する",
    (themeId) => {
      const theme = SALON_THEMES[themeId];
      expect(theme.id).toBe(themeId);
      expect(theme.defaultAccent).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.headerBg).toBeTruthy();
      expect(theme.bodyBg).toBeTruthy();
      expect(theme.cardBg).toBeTruthy();
      expect(theme.cardBorder).toBeTruthy();
      expect(theme.textPrimary).toBeTruthy();
      expect(theme.textSecondary).toBeTruthy();
      expect(theme.borderRadius).toBeTruthy();
    }
  );
});
