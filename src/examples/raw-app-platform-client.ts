import { createAppPlatformClient } from "../app-platform-client";

const client = createAppPlatformClient({
  baseUrl: "https://coline.app",
  apiKey: "col_sk_example",
});

async function main() {
  const apps = await client.GET("/api/v1/apps");
  if (!apps.data) {
    throw new Error("Failed to load apps.");
  }

  const install = await client.POST("/api/v1/workspaces/{workspaceSlug}/apps", {
    params: {
      path: {
        workspaceSlug: "acme",
      },
    },
    body: {
      appId: "app_123",
    },
  });

  if (!install.data) {
    throw new Error("Failed to install app.");
  }

  console.log(apps.data.data.apps);
  console.log(install.data.data.installId);
}

void main();
