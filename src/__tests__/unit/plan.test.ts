import { describe, it, expect, vi, beforeEach } from "vitest";

describe("plan", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  async function importPlanWithBeta(betaMode: string | undefined) {
    vi.stubEnv("NEXT_PUBLIC_BETA_MODE", betaMode as string);
    return await import("@/lib/plan");
  }

  describe("IS_BETA", () => {
    it("NEXT_PUBLIC_BETA_MODE=true のとき IS_BETA は true", async () => {
      const { IS_BETA } = await importPlanWithBeta("true");
      expect(IS_BETA).toBe(true);
    });

    it("NEXT_PUBLIC_BETA_MODE=false のとき IS_BETA は false", async () => {
      const { IS_BETA } = await importPlanWithBeta("false");
      expect(IS_BETA).toBe(false);
    });

    it("NEXT_PUBLIC_BETA_MODE が未設定のとき IS_BETA は false", async () => {
      const { IS_BETA } = await importPlanWithBeta(undefined);
      expect(IS_BETA).toBe(false);
    });
  });

  describe("getEffectivePlan (ベータON)", () => {
    it("free ユーザーでも pro を返す", async () => {
      const { getEffectivePlan } = await importPlanWithBeta("true");
      expect(getEffectivePlan("free")).toBe("pro");
    });

    it("canceled ユーザーでも pro を返す", async () => {
      const { getEffectivePlan } = await importPlanWithBeta("true");
      expect(getEffectivePlan("canceled")).toBe("pro");
    });
  });

  describe("getEffectivePlan (ベータOFF)", () => {
    it("free → free", async () => {
      const { getEffectivePlan } = await importPlanWithBeta("false");
      expect(getEffectivePlan("free")).toBe("free");
    });

    it("pro → pro", async () => {
      const { getEffectivePlan } = await importPlanWithBeta("false");
      expect(getEffectivePlan("pro")).toBe("pro");
    });

    it("canceled → free", async () => {
      const { getEffectivePlan } = await importPlanWithBeta("false");
      expect(getEffectivePlan("canceled")).toBe("free");
    });
  });

  describe("canCreateForm (ベータOFF)", () => {
    it("free: 0個 → 作成可能", async () => {
      const { canCreateForm } = await importPlanWithBeta("false");
      expect(canCreateForm(0, "free")).toBe(true);
    });

    it("free: 100個 → 作成可能（制限なし）", async () => {
      const { canCreateForm } = await importPlanWithBeta("false");
      expect(canCreateForm(100, "free")).toBe(true);
    });

    it("pro: 100個 → 作成可能", async () => {
      const { canCreateForm } = await importPlanWithBeta("false");
      expect(canCreateForm(100, "pro")).toBe(true);
    });
  });

  describe("canCreateWidget (ベータOFF)", () => {
    it("free: 100個 → 作成可能（制限なし）", async () => {
      const { canCreateWidget } = await importPlanWithBeta("false");
      expect(canCreateWidget(100, "free")).toBe(true);
    });

    it("pro: 100個 → 作成可能", async () => {
      const { canCreateWidget } = await importPlanWithBeta("false");
      expect(canCreateWidget(100, "pro")).toBe(true);
    });
  });

  describe("shouldShowBadge (ベータOFF)", () => {
    it("free → true", async () => {
      const { shouldShowBadge } = await importPlanWithBeta("false");
      expect(shouldShowBadge("free")).toBe(true);
    });

    it("pro → false", async () => {
      const { shouldShowBadge } = await importPlanWithBeta("false");
      expect(shouldShowBadge("pro")).toBe(false);
    });
  });

  describe("getDashboardViewLimit / getTestimonialDisplayLimit", () => {
    it("free: ダッシュボード10件、表示5件", async () => {
      const { getDashboardViewLimit, getTestimonialDisplayLimit } = await importPlanWithBeta("false");
      expect(getDashboardViewLimit("free")).toBe(10);
      expect(getTestimonialDisplayLimit("free")).toBe(5);
    });

    it("pro: 両方 Infinity", async () => {
      const { getDashboardViewLimit, getTestimonialDisplayLimit } = await importPlanWithBeta("false");
      expect(getDashboardViewLimit("pro")).toBe(Infinity);
      expect(getTestimonialDisplayLimit("pro")).toBe(Infinity);
    });
  });
});
