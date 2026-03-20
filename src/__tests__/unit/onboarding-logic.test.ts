import { describe, it, expect } from "vitest";

/**
 * Tests for onboarding step logic.
 *
 * These are pure logic tests that verify the step-initialization and
 * progress-bar mapping rules used by OnboardingClient without rendering
 * React components.
 */

// ---------------------------------------------------------------------------
// Extracted logic mirrors from onboarding-client.tsx
// ---------------------------------------------------------------------------

/** Determines the initial step based on whether a template param exists. */
function getInitialStep(template: string | null): number {
  return template ? 2 : 1;
}

/** Determines total visible progress-bar steps. */
function getTotalSteps(template: string | null): number {
  return template ? 2 : 4;
}

/** Maps the internal step number to a progress-bar index (1-based). */
function getProgressIndex(
  currentStep: number,
  template: string | null
): number {
  if (!template) return currentStep;
  if (currentStep === 2) return 1;
  if (currentStep === 4) return 2;
  return currentStep;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("オンボーディング ステップロジック", () => {
  describe("templateパラメータなしの場合", () => {
    const template = null;

    it("step 1から開始する", () => {
      expect(getInitialStep(template)).toBe(1);
    });

    it("TOTAL_STEPSは4になる", () => {
      expect(getTotalSteps(template)).toBe(4);
    });

    it("progressIndexはstepと同じ値を返す", () => {
      expect(getProgressIndex(1, template)).toBe(1);
      expect(getProgressIndex(2, template)).toBe(2);
      expect(getProgressIndex(3, template)).toBe(3);
      expect(getProgressIndex(4, template)).toBe(4);
    });
  });

  describe("templateパラメータありの場合", () => {
    const template = "coaching";

    it("step 2から開始する", () => {
      expect(getInitialStep(template)).toBe(2);
    });

    it("TOTAL_STEPSは2になる", () => {
      expect(getTotalSteps(template)).toBe(2);
    });

    it("step 2のprogressIndexは1を返す", () => {
      expect(getProgressIndex(2, template)).toBe(1);
    });

    it("step 4のprogressIndexは2を返す", () => {
      expect(getProgressIndex(4, template)).toBe(2);
    });
  });
});
