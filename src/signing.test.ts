import { describe, expect, it } from "vitest";
import {
  buildSigningPayload,
  COLINE_DELIVERY_HEADER,
  COLINE_SIGNATURE_HEADER,
  COLINE_TIMESTAMP_HEADER,
  createSignedAppRequestHeaders,
  signAppRequest,
  verifyAppRequestSignature,
} from "./signing";

describe("app signing helpers", () => {
  it("builds the canonical signing payload", () => {
    expect(
      buildSigningPayload({
        timestamp: "2026-03-08T12:00:00.000Z",
        body: "{\"ok\":true}",
      }),
    ).toBe("2026-03-08T12:00:00.000Z.{\"ok\":true}");
  });

  it("signs and verifies a request body", async () => {
    const signature = await signAppRequest({
      secret: "test-signing-secret-with-at-least-16",
      timestamp: "2026-03-08T12:00:00.000Z",
      body: "{\"type\":\"app.home.render.requested\"}",
    });

    expect(signature).toMatch(/^[a-f0-9]+$/);
    await expect(
      verifyAppRequestSignature({
        secret: "test-signing-secret-with-at-least-16",
        timestamp: "2026-03-08T12:00:00.000Z",
        body: "{\"type\":\"app.home.render.requested\"}",
        signature,
      }),
    ).resolves.toBe(true);
  });

  it("creates a full header map for outbound delivery", async () => {
    const headers = await createSignedAppRequestHeaders({
      secret: "test-signing-secret-with-at-least-16",
      body: "{\"id\":\"delivery_1\"}",
      deliveryId: "delivery_1",
      timestamp: "2026-03-08T12:00:00.000Z",
    });

    expect(headers[COLINE_DELIVERY_HEADER]).toBe("delivery_1");
    expect(headers[COLINE_TIMESTAMP_HEADER]).toBe("2026-03-08T12:00:00.000Z");
    expect(headers[COLINE_SIGNATURE_HEADER]).toBeDefined();
  });
});
