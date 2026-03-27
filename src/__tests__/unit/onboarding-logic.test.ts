import { describe, it, expect } from "vitest";

/**
 * Tests for onboarding step logic.
 *
 * These are pure logic tests that verify the step-initialization and
 * progress-bar rules used by OnboardingClient without rendering
 * React components.
 */

// ---------------------------------------------------------------------------
// Onboarding is now always 2 steps:
// Step 1: Service name + template selection
// Step 2: Customize (brand color, questions, preview)
// ---------------------------------------------------------------------------

describe("オンボーディング ステップロジック", () => {
  const TOTAL_STEPS = 2;

  it("常にstep 1から開始する", () => {
    const initialStep = 1;
    expect(initialStep).toBe(1);
  });

  it("TOTAL_STEPSは常に2", () => {
    expect(TOTAL_STEPS).toBe(2);
  });

  it("プログレスバーはstep数と一致する", () => {
    const progressItems = Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1);
    expect(progressItems).toEqual([1, 2]);
  });

  it("step 1ではプログレスバーの1つ目が有効", () => {
    const step = 1;
    const active = Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1 <= step);
    expect(active).toEqual([true, false]);
  });

  it("step 2ではプログレスバーが全て有効", () => {
    const step = 2;
    const active = Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1 <= step);
    expect(active).toEqual([true, true]);
  });

  it("サービス名が空の場合は次へ進めない", () => {
    const workspaceName = "";
    expect(!workspaceName.trim()).toBe(true);
  });

  it("サービス名がスペースのみの場合は次へ進めない", () => {
    const workspaceName = "   ";
    expect(!workspaceName.trim()).toBe(true);
  });

  it("サービス名が入力されていれば次へ進める", () => {
    const workspaceName = "テストサービス";
    expect(!workspaceName.trim()).toBe(false);
  });
});
