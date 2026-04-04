import { describe, expect, it } from "vitest";
import {
  colineHostedActionRequestSchema,
  hostedActionResults,
  parseSignedColineRequest,
} from "./hosted-runtime";
import { createSignedAppRequestHeaders } from "./signing";

describe("hosted runtime helpers", () => {
  it("builds typed hosted action responses", () => {
    expect(hostedActionResults.ok()).toEqual({ type: "ok" });
    expect(hostedActionResults.refresh()).toEqual({ type: "refresh" });
    expect(hostedActionResults.navigate("/acme")).toEqual({
      type: "navigate",
      href: "/acme",
    });
    expect(hostedActionResults.openFile("file_123")).toEqual({
      type: "open_file",
      fileId: "file_123",
    });
  });

  it("verifies and parses signed hosted runtime requests", async () => {
    const secret = "1234567890abcdef1234567890abcdef";
    const body = JSON.stringify({
      workspace: {
        id: "workspace_123",
        slug: "acme",
        name: "Acme",
      },
      app: {
        appInstallId: "install_123",
        appId: "app_123",
        appKey: "acme-crm",
        name: "CRM",
      },
      actor: {
        userId: "user_123",
        email: "user@example.com",
      },
      action: {
        type: "crm.sync",
      },
    });

    const headers = await createSignedAppRequestHeaders({
      secret,
      body,
      deliveryId: "delivery_123",
    });

    const result = await parseSignedColineRequest({
      request: new Request("https://example.com/coline/actions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body,
      }),
      secret,
      schema: colineHostedActionRequestSchema,
    });

    expect(result.deliveryId).toBe("delivery_123");
    expect(result.data.action.type).toBe("crm.sync");
  });
});
