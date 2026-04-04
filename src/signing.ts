const encoder = new TextEncoder();

export const COLINE_SIGNATURE_HEADER = "x-coline-signature";
export const COLINE_TIMESTAMP_HEADER = "x-coline-timestamp";
export const COLINE_DELIVERY_HEADER = "x-coline-delivery-id";

function normalizeSecret(secret: string): string {
  if (!secret || secret.trim().length < 16) {
    throw new Error("Signing secret must be at least 16 characters.");
  }

  return secret;
}

async function importHmacKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(normalizeSecret(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function buildSigningPayload(params: {
  timestamp: string;
  body: string;
}): string {
  return `${params.timestamp}.${params.body}`;
}

export async function signAppRequest(params: {
  secret: string;
  timestamp: string;
  body: string;
}): Promise<string> {
  const key = await importHmacKey(params.secret);
  const payload = buildSigningPayload({
    timestamp: params.timestamp,
    body: params.body,
  });

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return toHex(signature);
}

export async function createSignedAppRequestHeaders(params: {
  secret: string;
  body: string;
  deliveryId: string;
  timestamp?: string;
}): Promise<Record<string, string>> {
  const timestamp = params.timestamp ?? new Date().toISOString();
  const signature = await signAppRequest({
    secret: params.secret,
    timestamp,
    body: params.body,
  });

  return {
    [COLINE_SIGNATURE_HEADER]: signature,
    [COLINE_TIMESTAMP_HEADER]: timestamp,
    [COLINE_DELIVERY_HEADER]: params.deliveryId,
  };
}

export async function verifyAppRequestSignature(params: {
  secret: string;
  timestamp: string;
  body: string;
  signature: string;
}): Promise<boolean> {
  const expected = await signAppRequest({
    secret: params.secret,
    timestamp: params.timestamp,
    body: params.body,
  });

  return expected === params.signature;
}
