import { describe, it, expect } from "vitest";
import { getStripeCustomerId, getStripeSubscriptionId } from "@/lib/stripe-utils";

describe("getStripeCustomerId", () => {
  it("null の場合 undefined を返す", () => {
    expect(getStripeCustomerId(null)).toBeUndefined();
  });

  it("文字列の場合そのまま返す", () => {
    expect(getStripeCustomerId("cus_123")).toBe("cus_123");
  });

  it("Customerオブジェクトの場合 id を返す", () => {
    expect(getStripeCustomerId({ id: "cus_456" } as any)).toBe("cus_456");
  });

  it("DeletedCustomerオブジェクトの場合 id を返す", () => {
    expect(getStripeCustomerId({ id: "cus_789", deleted: true } as any)).toBe("cus_789");
  });
});

describe("getStripeSubscriptionId", () => {
  it("null の場合 undefined を返す", () => {
    expect(getStripeSubscriptionId(null)).toBeUndefined();
  });

  it("文字列の場合そのまま返す", () => {
    expect(getStripeSubscriptionId("sub_123")).toBe("sub_123");
  });

  it("Subscriptionオブジェクトの場合 id を返す", () => {
    expect(getStripeSubscriptionId({ id: "sub_456" } as any)).toBe("sub_456");
  });
});
