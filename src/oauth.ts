const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function generatePkceCodeVerifier(byteLength = 48): string {
  if (!Number.isInteger(byteLength) || byteLength < 32 || byteLength > 96) {
    throw new Error("byteLength must be an integer between 32 and 96.");
  }

  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return toBase64Url(bytes);
}

export async function createPkceCodeChallenge(
  verifier: string,
): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(verifier));
  return toBase64Url(new Uint8Array(digest));
}

export async function createPkcePair(byteLength = 48): Promise<{
  verifier: string;
  challenge: string;
  method: "S256";
}> {
  const verifier = generatePkceCodeVerifier(byteLength);
  const challenge = await createPkceCodeChallenge(verifier);

  return {
    verifier,
    challenge,
    method: "S256",
  };
}

export function createOauthState(byteLength = 24): string {
  if (!Number.isInteger(byteLength) || byteLength < 16 || byteLength > 96) {
    throw new Error("byteLength must be an integer between 16 and 96.");
  }

  return toBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}
