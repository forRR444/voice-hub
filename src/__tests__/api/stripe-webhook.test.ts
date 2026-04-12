import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

const mockConstructEvent = vi.fn();
vi.mock("@/lib/stripe", () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
  }),
}));

const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockFrom = vi.fn();

function setupSupabaseMock(
  result: { data: unknown; error: unknown } = { data: null, error: null }
) {
  mockEq.mockResolvedValue(result);
  mockUpdate.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ update: mockUpdate });
}

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

vi.mock("@/lib/logger", () => ({
  logError: vi.fn(),
}));

// ---------------------------------------------------------------------------
// ヘルパー
// ---------------------------------------------------------------------------

function makeWebhookRequest(body: string, signature?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (signature) {
    headers["stripe-signature"] = signature;
  }
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers,
    body,
  });
}

function makeStripeEvent(type: string, dataObject: Record<string, unknown>) {
  return {
    type,
    data: { object: dataObject },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test_secret");
  setupSupabaseMock();
});

describe("POST /api/stripe/webhook", () => {
  it("stripe-signatureヘッダー欠落で400を返す", async () => {
    const { POST } = await import("@/app/api/stripe/webhook/route");

    const response = await POST(makeWebhookRequest("{}"));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Missing stripe-signature header");
    expect(mockConstructEvent).not.toHaveBeenCalled();
  });

  it("署名検証失敗で400を返す", async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Signature verification failed");
    });

    const { POST } = await import("@/app/api/stripe/webhook/route");

    const response = await POST(makeWebhookRequest("{}", "invalid_sig"));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid signature");
  });

  describe("checkout.session.completed", () => {
    it("ワークスペースをproに更新しsubscription_idを保存する", async () => {
      mockConstructEvent.mockReturnValue(
        makeStripeEvent("checkout.session.completed", {
          customer: "cus_123",
          subscription: "sub_456",
        })
      );

      const { POST } = await import("@/app/api/stripe/webhook/route");
      const response = await POST(makeWebhookRequest("{}", "valid_sig"));
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual({ received: true });
      expect(mockFrom).toHaveBeenCalledWith("workspaces");
      expect(mockUpdate).toHaveBeenCalledWith({
        subscription_status: "pro",
        stripe_subscription_id: "sub_456",
      });
      expect(mockEq).toHaveBeenCalledWith("stripe_customer_id", "cus_123");
    });

    it("customerがオブジェクト形式でも処理できる", async () => {
      mockConstructEvent.mockReturnValue(
        makeStripeEvent("checkout.session.completed", {
          customer: { id: "cus_obj_789" },
          subscription: { id: "sub_obj_101" },
        })
      );

      const { POST } = await import("@/app/api/stripe/webhook/route");
      const response = await POST(makeWebhookRequest("{}", "valid_sig"));

      expect(response.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalledWith({
        subscription_status: "pro",
        stripe_subscription_id: "sub_obj_101",
      });
      expect(mockEq).toHaveBeenCalledWith("stripe_customer_id", "cus_obj_789");
    });

    it("customerIDがnullの場合DBを更新しない", async () => {
      mockConstructEvent.mockReturnValue(
        makeStripeEvent("checkout.session.completed", {
          customer: null,
          subscription: "sub_no_cust",
        })
      );

      const { POST } = await import("@/app/api/stripe/webhook/route");
      const response = await POST(makeWebhookRequest("{}", "valid_sig"));

      expect(response.status).toBe(200);
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it("subscriptionがnullの場合nullを保存する", async () => {
      mockConstructEvent.mockReturnValue(
        makeStripeEvent("checkout.session.completed", {
          customer: "cus_no_sub",
          subscription: null,
        })
      );

      const { POST } = await import("@/app/api/stripe/webhook/route");
      const response = await POST(makeWebhookRequest("{}", "valid_sig"));

      expect(response.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalledWith({
        subscription_status: "pro",
        stripe_subscription_id: null,
      });
    });

    it("DB更新エラーで500を返す", async () => {
      setupSupabaseMock({ data: null, error: { message: "DB error" } });
      mockConstructEvent.mockReturnValue(
        makeStripeEvent("checkout.session.completed", {
          customer: "cus_123",
          subscription: "sub_456",
        })
      );

      const { POST } = await import("@/app/api/stripe/webhook/route");
      const response = await POST(makeWebhookRequest("{}", "valid_sig"));
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe("DB update failed");
    });
  });

  describe("customer.subscription.updated", () => {
    it.each([
      ["active", "pro"],
      ["trialing", "pro"],
      ["canceled", "canceled"],
      ["unpaid", "canceled"],
      ["past_due", "canceled"],
      ["incomplete", "free"],
    ] as const)(
      "status '%s' のときsubscription_statusを '%s' に設定する",
      async (stripeStatus, expectedDbStatus) => {
        mockConstructEvent.mockReturnValue(
          makeStripeEvent("customer.subscription.updated", {
            id: `sub_${stripeStatus}`,
            customer: "cus_200",
            status: stripeStatus,
          })
        );

        const { POST } = await import("@/app/api/stripe/webhook/route");
        const response = await POST(makeWebhookRequest("{}", "valid_sig"));

        expect(response.status).toBe(200);
        expect(mockUpdate).toHaveBeenCalledWith({
          subscription_status: expectedDbStatus,
          stripe_subscription_id: `sub_${stripeStatus}`,
        });
        expect(mockEq).toHaveBeenCalledWith("stripe_customer_id", "cus_200");
      }
    );

    it("DB更新エラーで500を返す", async () => {
      setupSupabaseMock({ data: null, error: { message: "DB error" } });
      mockConstructEvent.mockReturnValue(
        makeStripeEvent("customer.subscription.updated", {
          id: "sub_err",
          customer: "cus_200",
          status: "active",
        })
      );

      const { POST } = await import("@/app/api/stripe/webhook/route");
      const response = await POST(makeWebhookRequest("{}", "valid_sig"));
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe("DB update failed");
    });
  });

  describe("customer.subscription.deleted", () => {
    it("canceledに設定しsubscription_idをクリアする", async () => {
      mockConstructEvent.mockReturnValue(
        makeStripeEvent("customer.subscription.deleted", {
          id: "sub_deleted",
          customer: "cus_500",
        })
      );

      const { POST } = await import("@/app/api/stripe/webhook/route");
      const response = await POST(makeWebhookRequest("{}", "valid_sig"));

      expect(response.status).toBe(200);
      expect(mockUpdate).toHaveBeenCalledWith({
        subscription_status: "canceled",
        stripe_subscription_id: null,
      });
      expect(mockEq).toHaveBeenCalledWith("stripe_customer_id", "cus_500");
    });

    it("DB更新エラーで500を返す", async () => {
      setupSupabaseMock({ data: null, error: { message: "DB error" } });
      mockConstructEvent.mockReturnValue(
        makeStripeEvent("customer.subscription.deleted", {
          id: "sub_del_err",
          customer: "cus_500",
        })
      );

      const { POST } = await import("@/app/api/stripe/webhook/route");
      const response = await POST(makeWebhookRequest("{}", "valid_sig"));
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe("DB update failed");
    });
  });

  it("未処理のイベントタイプではDB更新なしで200を返す", async () => {
    mockConstructEvent.mockReturnValue(
      makeStripeEvent("invoice.payment_succeeded", { id: "inv_123" })
    );

    const { POST } = await import("@/app/api/stripe/webhook/route");
    const response = await POST(makeWebhookRequest("{}", "valid_sig"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ received: true });
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
