import { describe, expect, it } from "vitest";
import {
  createOauthState,
  createPkceCodeChallenge,
  createPkcePair,
  generatePkceCodeVerifier,
} from "./oauth";

describe("oauth helpers", () => {
  it("generates PKCE verifiers in the expected length range", () => {
    const verifier = generatePkceCodeVerifier();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
  });

  it("creates deterministic S256 code challenges", async () => {
    const challenge = await createPkceCodeChallenge("test-verifier");
    expect(challenge).toBe("JBbiqONGWPaAmwXk_8bT6UnlPfrn65D32eZlJS-zGG0");
  });

  it("creates PKCE pairs and oauth state values", async () => {
    const pkce = await createPkcePair();
    expect(pkce.method).toBe("S256");
    expect(pkce.verifier.length).toBeGreaterThan(40);
    expect(pkce.challenge.length).toBeGreaterThan(40);

    const state = createOauthState();
    expect(state.length).toBeGreaterThan(20);
  });
});
