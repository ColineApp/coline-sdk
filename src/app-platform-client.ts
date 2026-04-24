import createClient from "openapi-fetch";
import type { paths } from "./generated/app-platform-v1";
import type { ColineApiClientOptions } from "./client";

function createAuthenticatedFetch(options: ColineApiClientOptions): typeof fetch {
  return async (input, init = {}) => {
    const headers = new Headers(options.headers);
    const requestHeaders = new Headers(init.headers);
    requestHeaders.forEach((value, key) => headers.set(key, value));

    if (!headers.has("Content-Type") && init.body) {
      headers.set("Content-Type", "application/json");
    }

    const bearerCredential = options.apiKey ?? options.accessToken;
    if (bearerCredential && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${bearerCredential}`);
    }

    return (options.fetch ?? fetch)(input, {
      ...init,
      headers,
    });
  };
}

export function createAppPlatformClient(options: ColineApiClientOptions) {
  return createClient<paths>({
    baseUrl: options.baseUrl,
    fetch: createAuthenticatedFetch(options),
  });
}

export type AppPlatformClient = ReturnType<typeof createAppPlatformClient>;
