import { describe, expect, it } from "vitest";
import { ColineApiError, isColineApiError } from "./errors";

describe("ColineApiError", () => {
  it("captures API error metadata", () => {
    const error = new ColineApiError({
      message: "No access.",
      type: "api",
      status: 403,
      code: "FORBIDDEN",
    });

    expect(error.message).toBe("No access.");
    expect(error.type).toBe("api");
    expect(error.status).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
    expect(isColineApiError(error)).toBe(true);
  });
});
