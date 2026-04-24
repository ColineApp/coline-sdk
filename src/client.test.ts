import { describe, expect, it, vi } from "vitest";
import { ColineApiClient } from "./client";
import { ColineApiError } from "./errors";
import { createAppPlatformClient } from "./app-platform-client";

function createJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("ColineApiClient", () => {
  it("creates a raw generated app-platform client with auth headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        data: {
          apps: [],
        },
      }),
    );

    const client = createAppPlatformClient({
      baseUrl: "https://api.coline.app",
      apiKey: "test-key",
      fetch: fetchMock,
    });

    const result = await client.GET("/api/v1/apps");
    expect(result.data?.data.apps).toEqual([]);

    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-key");
  });

  it("creates a raw generated app-platform client with oauth access tokens", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        data: {
          apps: [],
        },
      }),
    );

    const client = createAppPlatformClient({
      baseUrl: "https://api.coline.app",
      accessToken: "col_at_123",
      fetch: fetchMock,
    });

    const result = await client.GET("/api/v1/apps");
    expect(result.data?.data.apps).toEqual([]);

    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer col_at_123");
  });

  it("registers apps and creates new versions through the v1 app publisher routes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            appId: "app_123",
            appKey: "com.coline.notes",
            versionId: "ver_123",
            version: "0.1.0",
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            appId: "app_123",
            appKey: "com.coline.notes",
            versionId: "ver_124",
            version: "0.1.1",
          },
        }),
      );

    const client = new ColineApiClient({
      baseUrl: "https://api.coline.app",
      apiKey: "test-key",
      fetch: fetchMock,
    });

    await client.registerApp({
      version: "0.1.0",
      manifest: {
        key: "com.coline.notes",
        name: "Notes",
        permissions: ["app.home.read"],
        notificationChannels: [],
        hosting: {
          mode: "external",
          baseUrl: "https://notes.example.com",
        },
      },
      fileTypes: [],
    });

    await client.createAppVersion("com.coline.notes", {
      version: "0.1.1",
      manifest: {
        key: "com.coline.notes",
        name: "Notes",
        permissions: ["app.home.read"],
        notificationChannels: [],
        hosting: {
          mode: "external",
          baseUrl: "https://notes.example.com",
        },
      },
      fileTypes: [],
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.any(Request),
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    expect((fetchMock.mock.calls[0]?.[0] as Request).url).toBe(
      "https://api.coline.app/api/v1/apps",
    );
    expect((fetchMock.mock.calls[0]?.[0] as Request).method).toBe("POST");

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.any(Request),
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    expect((fetchMock.mock.calls[1]?.[0] as Request).url).toBe(
      "https://api.coline.app/api/v1/apps/com.coline.notes/versions",
    );
    expect((fetchMock.mock.calls[1]?.[0] as Request).method).toBe("POST");
  });

  it("installs a workspace app with explicit granted permissions", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        data: {
          installId: "install_123",
          appId: "app_123",
          appKey: "com.coline.notes",
          version: "0.1.0",
          grantedPermissions: ["app.home.read"],
        },
      }),
    );

    const client = new ColineApiClient({
      baseUrl: "https://api.coline.app",
      apiKey: "test-key",
      fetch: fetchMock,
    });

    const result = await client.installWorkspaceApp("acme", {
      appId: "app_123",
      grantedPermissions: ["app.home.read"],
    });

    expect(result.installId).toBe("install_123");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    expect((fetchMock.mock.calls[0]?.[0] as Request).url).toBe(
      "https://api.coline.app/api/v1/workspaces/acme/apps",
    );
    expect((fetchMock.mock.calls[0]?.[0] as Request).method).toBe("POST");

    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-key");
  });

  it("loads and updates workspace app permissions", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            install: {
              installId: "install_123",
              appId: "app_123",
              appKey: "com.coline.notes",
              name: "Notes",
              description: null,
              iconUrl: null,
              status: "active",
              installScope: "workspace",
              scopeSubjectId: "workspace_123",
              version: "0.1.0",
            },
            availablePermissions: ["app.home.read", "files.write"],
            grantedPermissions: ["app.home.read"],
            permissions: {
              canManageApps: true,
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            install: {
              installId: "install_123",
              appId: "app_123",
              appKey: "com.coline.notes",
              name: "Notes",
              description: null,
              iconUrl: null,
              status: "active",
              installScope: "workspace",
              scopeSubjectId: "workspace_123",
              version: "0.1.0",
            },
            availablePermissions: ["app.home.read", "files.write"],
            grantedPermissions: ["app.home.read", "files.write"],
            permissions: {
              canManageApps: true,
            },
          },
        }),
      );

    const client = new ColineApiClient({
      baseUrl: "https://api.coline.app",
      fetch: fetchMock,
    });

    const currentPermissions = await client.getWorkspaceAppPermissions(
      "acme",
      "com.coline.notes",
    );
    expect(currentPermissions.grantedPermissions).toEqual(["app.home.read"]);

    const updatedPermissions = await client.updateWorkspaceAppPermissions(
      "acme",
      "com.coline.notes",
      {
        grantedPermissions: ["app.home.read", "files.write"],
      },
    );

    expect(updatedPermissions.grantedPermissions).toEqual([
      "app.home.read",
      "files.write",
    ]);
  });

  it("lists and creates app-backed files through the app runtime routes", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            files: [],
            availableFileTypes: [
              {
                typeKey: "acme.customer",
                name: "Customer",
                description: null,
              },
            ],
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            file: {
              id: "file_123",
              driveId: "drive_123",
              parentId: null,
              name: "Acme Corp",
              fileType: "acme.customer",
              typeLabel: "Customer",
              appKey: "acme-crm",
              appName: "Acme CRM",
              openHref: "/acme/acme-crm/files/file_123",
              updatedAt: "2026-04-02T00:00:00.000Z",
              createdAt: "2026-04-02T00:00:00.000Z",
              version: 1,
              capabilities: {
                canRead: true,
                canWrite: true,
                canManage: false,
              },
            },
            document: {
              status: "lead",
            },
            version: 1,
          },
        }),
      );

    const client = new ColineApiClient({
      baseUrl: "https://api.coline.app",
      apiKey: "test-key",
      fetch: fetchMock,
    });

    const files = await client.listAppFiles("acme", "acme-crm", {
      limit: 20,
    });
    expect(files.availableFileTypes[0]?.typeKey).toBe("acme.customer");

    const created = await client.createAppFile("acme", "acme-crm", {
      name: "Acme Corp",
      typeKey: "acme.customer",
      document: { status: "lead" },
    });
    expect(created.file.id).toBe("file_123");

    expect((fetchMock.mock.calls[0]?.[0] as Request).url).toBe(
      "https://api.coline.app/api/v1/workspaces/acme/apps/acme-crm/files?limit=20",
    );
    expect((fetchMock.mock.calls[1]?.[0] as Request).url).toBe(
      "https://api.coline.app/api/v1/workspaces/acme/apps/acme-crm/files",
    );
  });

  it("executes hosted app actions through the public app runtime route", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        data: {
          type: "navigate",
          href: "/acme/acme-crm/files/file_123",
        },
      }),
    );

    const client = new ColineApiClient({
      baseUrl: "https://api.coline.app",
      apiKey: "test-key",
      fetch: fetchMock,
    });

    const result = await client.executeAppAction("acme", "acme-crm", {
      action: {
        type: "crm.sync",
        payload: { mode: "delta" },
      },
      fileId: "file_123",
    });

    expect(result).toEqual({
      type: "navigate",
      href: "/acme/acme-crm/files/file_123",
    });
    expect((fetchMock.mock.calls[0]?.[0] as Request).url).toBe(
      "https://api.coline.app/api/v1/workspaces/acme/apps/acme-crm/actions",
    );
  });

  it("manages workspace app secrets, oauth connections, deliveries, and review submission", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            install: {
              installId: "install_123",
              appId: "app_123",
              appKey: "com.coline.notes",
              name: "Notes",
              description: null,
              iconUrl: null,
              status: "active",
              installScope: "workspace",
              scopeSubjectId: "workspace_123",
              version: "1.0.0",
            },
            secrets: [],
            permissions: { canManageApps: true },
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            secret: {
              id: "secret_123",
              key: "OPENAI_API_KEY",
              createdAt: "2026-04-02T00:00:00.000Z",
              updatedAt: "2026-04-02T00:00:00.000Z",
            },
            value: "sk-test",
          },
        }),
      )
      .mockResolvedValueOnce(createJsonResponse({ data: { ok: true } }))
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            install: {
              installId: "install_123",
              appId: "app_123",
              appKey: "com.coline.notes",
              name: "Notes",
              description: null,
              iconUrl: null,
              status: "active",
              installScope: "workspace",
              scopeSubjectId: "workspace_123",
              version: "1.0.0",
            },
            connections: [],
            permissions: { canManageApps: true },
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            connection: {
              id: "conn_123",
              providerKey: "github",
              externalAccountId: "octocat",
              scopes: ["repo"],
              tokenExpiresAt: null,
              createdAt: "2026-04-02T00:00:00.000Z",
              updatedAt: "2026-04-02T00:00:00.000Z",
            },
          },
        }),
      )
      .mockResolvedValueOnce(createJsonResponse({ data: { ok: true } }))
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            install: {
              installId: "install_123",
              appId: "app_123",
              appKey: "com.coline.notes",
              name: "Notes",
              description: null,
              iconUrl: null,
              status: "active",
              installScope: "workspace",
              scopeSubjectId: "workspace_123",
              version: "1.0.0",
            },
            deliveries: [],
            permissions: { canManageApps: true },
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            delivery: {
              id: "delivery_123",
              eventType: "app.test",
              targetUrl: "https://notes.example.com/coline/events",
              status: "delivered",
              attemptCount: 1,
              lastStatusCode: 200,
              createdAt: "2026-04-02T00:00:00.000Z",
              updatedAt: "2026-04-02T00:00:00.000Z",
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            delivery: {
              id: "delivery_123",
              eventType: "app.test",
              targetUrl: "https://notes.example.com/coline/events",
              status: "delivered",
              attemptCount: 2,
              lastStatusCode: 200,
              createdAt: "2026-04-02T00:00:00.000Z",
              updatedAt: "2026-04-02T00:01:00.000Z",
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            appId: "app_123",
            appKey: "com.coline.notes",
            versionId: "ver_123",
            version: "1.0.0",
            reviewStatus: "submitted",
            storeListed: true,
          },
        }),
      );

    const client = new ColineApiClient({
      baseUrl: "https://api.coline.app",
      fetch: fetchMock,
    });

    await client.listWorkspaceAppSecrets("acme", "com.coline.notes");
    await client.createWorkspaceAppSecret("acme", "com.coline.notes", {
      key: "OPENAI_API_KEY",
      value: "sk-test",
    });
    await client.deleteWorkspaceAppSecret(
      "acme",
      "com.coline.notes",
      "secret_123",
    );

    await client.listWorkspaceAppOauthConnections("acme", "com.coline.notes");
    await client.createWorkspaceAppOauthConnection("acme", "com.coline.notes", {
      providerKey: "github",
      accessToken: "gho_test",
      scopes: ["repo"],
      externalAccountId: "octocat",
    });
    await client.deleteWorkspaceAppOauthConnection(
      "acme",
      "com.coline.notes",
      "conn_123",
    );

    await client.listWorkspaceAppDeliveries("acme", "com.coline.notes");
    await client.sendWorkspaceAppTestDelivery("acme", "com.coline.notes", {
      eventType: "app.test",
      payload: { ok: true },
    });
    await client.replayWorkspaceAppDelivery(
      "acme",
      "com.coline.notes",
      "delivery_123",
    );

    await client.submitAppVersionForReview("com.coline.notes", "ver_123", {
      storeListed: true,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      expect.any(Request),
      expect.any(Object),
    );
    expect((fetchMock.mock.calls[0]?.[0] as Request).url).toBe(
      "https://api.coline.app/api/v1/workspaces/acme/apps/com.coline.notes/secrets",
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      5,
      expect.any(Request),
      expect.any(Object),
    );
    expect((fetchMock.mock.calls[4]?.[0] as Request).url).toBe(
      "https://api.coline.app/api/v1/workspaces/acme/apps/com.coline.notes/oauth-connections",
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      8,
      expect.any(Request),
      expect.any(Object),
    );
    expect((fetchMock.mock.calls[7]?.[0] as Request).url).toBe(
      "https://api.coline.app/api/v1/workspaces/acme/apps/com.coline.notes/deliveries",
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      9,
      expect.any(Request),
      expect.any(Object),
    );
    expect((fetchMock.mock.calls[8]?.[0] as Request).url).toBe(
      "https://api.coline.app/api/v1/workspaces/acme/apps/com.coline.notes/deliveries/delivery_123/replay",
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      10,
      expect.any(Request),
      expect.any(Object),
    );
    expect((fetchMock.mock.calls[9]?.[0] as Request).url).toBe(
      "https://api.coline.app/api/v1/apps/com.coline.notes/versions/ver_123/submit",
    );
  });

  it("loads app detail, app versions, installed app, and uninstalls it", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            app: {
              appId: "app_123",
              appKey: "com.coline.notes",
              name: "Notes",
              description: null,
              iconUrl: null,
              status: "active",
              ownerUserId: "user_123",
              latestPublishedVersion: "0.1.0",
              latestPublishedVersionId: "ver_123",
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            versions: [
              {
                versionId: "ver_123",
                version: "0.1.0",
                status: "published",
                apiBaseUrl: "https://notes.example.com",
                permissions: ["app.home.read"],
                kairo: {
                  enabled: true,
                  description: "Notes documents can be searched by Kairo.",
                  instructions: "Search notes before answering document questions.",
                  documentTypes: [
                    {
                      documentType: "note",
                      name: "Note",
                      metadata: [],
                    },
                  ],
                },
                fileTypes: [],
                createdAt: "2026-04-01T00:00:00.000Z",
                updatedAt: "2026-04-01T00:00:00.000Z",
              },
            ],
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            install: {
              installId: "install_123",
              appId: "app_123",
              appKey: "com.coline.notes",
              name: "Notes",
              description: null,
              iconUrl: null,
              status: "active",
              installScope: "workspace",
              scopeSubjectId: "workspace_123",
              version: "0.1.0",
            },
            permissions: {
              canManageApps: true,
            },
          },
        }),
      )
      .mockResolvedValueOnce(createJsonResponse({ data: { ok: true } }));

    const client = new ColineApiClient({
      baseUrl: "https://api.coline.app",
      fetch: fetchMock,
    });

    const app = await client.getApp("com.coline.notes");
    expect(app.app.appKey).toBe("com.coline.notes");

    const versions = await client.listAppVersions("com.coline.notes");
    expect(versions.versions[0]?.version).toBe("0.1.0");
    const kairo = versions.versions[0]?.kairo as
      | { documentTypes?: Array<{ documentType?: string }> }
      | null
      | undefined;
    expect(kairo?.documentTypes?.[0]?.documentType).toBe("note");

    const installed = await client.getWorkspaceInstalledApp("acme", "com.coline.notes");
    expect(installed.install.installId).toBe("install_123");

    const uninstallResult = await client.uninstallWorkspaceApp(
      "acme",
      "com.coline.notes",
    );
    expect(uninstallResult.ok).toBe(true);
  });

  it("loads and updates app file documents through the public runtime API", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            file: {
              id: "file_123",
              name: "Customer",
              fileType: "com.acme.customer",
              appKey: "acme-crm",
              appName: "Acme CRM",
              typeLabel: "Customer",
              openHref: "/acme/acme-crm/files/file_123",
              updatedAt: "2026-03-18T08:00:00.000Z",
            },
            document: { status: "active" },
            version: 2,
            capabilities: {
              canRead: true,
              canWrite: true,
              canManage: false,
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            document: { status: "archived" },
            version: 3,
            updatedAt: "2026-03-18T09:00:00.000Z",
          },
        }),
      );

    const client = new ColineApiClient({
      baseUrl: "https://api.coline.app",
      fetch: fetchMock,
    });

    const file = await client.getAppFileDocument("acme", "acme-crm", "file_123");
    expect(file.file.id).toBe("file_123");
    expect(file.version).toBe(2);

    const updated = await client.updateAppFileDocument(
      "acme",
      "acme-crm",
      "file_123",
      { status: "archived" },
    );
    expect(updated.version).toBe(3);
  });

  it("scopes publisher routes through fluent app handles", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            app: {
              appId: "app_123",
              appKey: "com.coline.notes",
              name: "Notes",
              description: null,
              iconUrl: null,
              status: "active",
              ownerUserId: "user_123",
              latestPublishedVersion: "0.1.0",
              latestPublishedVersionId: "ver_123",
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            versions: [],
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            appId: "app_123",
            appKey: "com.coline.notes",
            versionId: "ver_124",
            version: "0.1.1",
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            appId: "app_123",
            appKey: "com.coline.notes",
            versionId: "ver_124",
            version: "0.1.1",
            reviewStatus: "submitted",
            storeListed: true,
          },
        }),
      );

    const client = new ColineApiClient({
      baseUrl: "https://api.coline.app",
      fetch: fetchMock,
    });

    const app = client.app("com.coline.notes");
    await app.get();
    await app.listVersions();
    await app.createVersion({
      version: "0.1.1",
      manifest: {
        key: "com.coline.notes",
        name: "Notes",
        permissions: ["app.home.read"],
        notificationChannels: [],
        hosting: {
          mode: "external",
          baseUrl: "https://notes.example.com",
        },
      },
      fileTypes: [],
    });
    await app.submitVersionForReview("ver_124", { storeListed: true });

    expect((fetchMock.mock.calls[0]?.[0] as Request).url).toBe(
      "https://api.coline.app/api/v1/apps/com.coline.notes",
    );
    expect((fetchMock.mock.calls[1]?.[0] as Request).url).toBe(
      "https://api.coline.app/api/v1/apps/com.coline.notes/versions",
    );
    expect((fetchMock.mock.calls[2]?.[0] as Request).url).toBe(
      "https://api.coline.app/api/v1/apps/com.coline.notes/versions",
    );
    expect((fetchMock.mock.calls[3]?.[0] as Request).url).toBe(
      "https://api.coline.app/api/v1/apps/com.coline.notes/versions/ver_124/submit",
    );
  });

  it("scopes workspace app runtime routes through fluent handles", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            installedApps: [],
            availableApps: [],
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            installId: "install_123",
            appId: "app_123",
            appKey: "acme-crm",
            version: "0.1.0",
            grantedPermissions: ["files.write"],
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            install: {
              installId: "install_123",
              appId: "app_123",
              appKey: "acme-crm",
              name: "Acme CRM",
              description: null,
              iconUrl: null,
              status: "active",
              installScope: "workspace",
              scopeSubjectId: "workspace_123",
              version: "0.1.0",
            },
            permissions: {
              canManageApps: true,
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            files: [],
            availableFileTypes: [],
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            file: {
              id: "file_123",
              driveId: "drive_123",
              parentId: null,
              name: "Acme Corp",
              fileType: "acme.customer",
              typeLabel: "Customer",
              appKey: "acme-crm",
              appName: "Acme CRM",
              openHref: "/acme/acme-crm/files/file_123",
              updatedAt: "2026-04-02T00:00:00.000Z",
              createdAt: "2026-04-02T00:00:00.000Z",
              version: 1,
              capabilities: {
                canRead: true,
                canWrite: true,
                canManage: false,
              },
            },
            document: {
              status: "lead",
            },
            version: 1,
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            file: {
              id: "file_123",
              name: "Customer",
              fileType: "acme.customer",
              appKey: "acme-crm",
              appName: "Acme CRM",
              typeLabel: "Customer",
              openHref: "/acme/acme-crm/files/file_123",
              updatedAt: "2026-03-18T08:00:00.000Z",
            },
            document: { status: "active" },
            version: 2,
            capabilities: {
              canRead: true,
              canWrite: true,
              canManage: false,
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            document: { status: "archived" },
            version: 3,
            updatedAt: "2026-03-18T09:00:00.000Z",
          },
        }),
      );

    const client = new ColineApiClient({
      baseUrl: "https://api.coline.app",
      fetch: fetchMock,
    });

    const ws = client.workspace("acme");
    await ws.listApps();
    await ws.installApp({ appId: "app_123", grantedPermissions: ["files.write"] });

    const app = ws.app("acme-crm");
    await app.get();
    await app.listFiles({ limit: 20 });
    await app.createFile({
      name: "Acme Corp",
      typeKey: "acme.customer",
      document: { status: "lead" },
    });
    await app.file("file_123").get();
    await app.file("file_123").updateDocument({ status: "archived" });

    expect((fetchMock.mock.calls[0]?.[0] as Request).url).toBe(
      "https://api.coline.app/api/v1/workspaces/acme/apps",
    );
    expect((fetchMock.mock.calls[1]?.[0] as Request).url).toBe(
      "https://api.coline.app/api/v1/workspaces/acme/apps",
    );
    expect((fetchMock.mock.calls[2]?.[0] as Request).url).toBe(
      "https://api.coline.app/api/v1/workspaces/acme/apps/acme-crm",
    );
    expect((fetchMock.mock.calls[3]?.[0] as Request).url).toBe(
      "https://api.coline.app/api/v1/workspaces/acme/apps/acme-crm/files?limit=20",
    );
    expect((fetchMock.mock.calls[4]?.[0] as Request).url).toBe(
      "https://api.coline.app/api/v1/workspaces/acme/apps/acme-crm/files",
    );
    expect((fetchMock.mock.calls[5]?.[0] as Request).url).toBe(
      "https://api.coline.app/api/v1/workspaces/acme/apps/acme-crm/files/file_123",
    );
    expect((fetchMock.mock.calls[6]?.[0] as Request).url).toBe(
      "https://api.coline.app/api/v1/workspaces/acme/apps/acme-crm/files/file_123",
    );
  });

  it("lists Tab models and creates OpenAI-compatible Tab completions", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            object: "list",
            data: [
              {
                id: "tab-v1",
                object: "model",
                created: 1775200000,
                owned_by: "coline",

                pricing: {
                  inputPerMillionUsd: 0.2,
                  outputPerMillionUsd: 0.5,
                },
                capabilities: {
                  streaming: true,
                  surfaces: ["notes", "docs"],
                },
              },
            ],
          },
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          data: {
            id: "chatcmpl_123",
            object: "chat.completion",
            created: 1775200001,
            model: "tab-v1",
            choices: [
              {
                index: 0,
                message: {
                  role: "assistant",
                  content: " world",
                },
                finish_reason: "stop",
              },
            ],
            usage: {
              prompt_tokens: 10,
              completion_tokens: 2,
              total_tokens: 12,
            },
          },
        }),
      );

    const client = new ColineApiClient({
      baseUrl: "https://api.coline.app",
      fetch: fetchMock,
    });

    const models = await client.listTabModels();
    expect(models.data[0]?.id).toBe("tab-v1");

    const completion = await client.createTabChatCompletion({
      model: "tab-v1",
      tab_context: {
        surface: "notes",
        workspace_slug: "acme",
        entity_id: "note_123",
        document_type: "markdown",
        active_text_before_cursor: "Hello",
        active_text_after_cursor: "",
        surrounding_context: "Title: Roadmap",
      },
    });

    expect(completion.choices[0]?.message.content).toBe(" world");
  });

  it("builds Login with Coline authorize URLs and exchanges OAuth tokens", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        createJsonResponse({
          access_token: "col_at_123",
          token_type: "Bearer",
          expires_in: 3600,
          refresh_token: "col_rt_123",
          scope: "openid profile email",
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          sub: "user_123",
          email: "radin@example.com",
          email_verified: true,
          name: "Radin",
          given_name: "Radin",
          family_name: null,
          picture: null,
          preferred_username: "radin",
          scope: "openid profile email",
        }),
      );

    const client = new ColineApiClient({
      baseUrl: "https://api.coline.app",
      fetch: fetchMock,
    });

    const authorizeUrl = client.buildLoginWithColineAuthorizeUrl({
      clientId: "col_client_123",
      redirectUri: "https://example.com/callback",
      scope: "openid profile email",
      state: "state_123",
    });
    expect(authorizeUrl).toContain("/api/v1/oauth/authorize");
    expect(authorizeUrl).toContain("client_id=col_client_123");

    const token = await client.exchangeOAuthCode({
      clientId: "col_client_123",
      clientSecret: "col_secret_123",
      code: "col_code_123",
      redirectUri: "https://example.com/callback",
    });
    expect(token.access_token).toBe("col_at_123");

    const userInfo = await client.getOAuthUserInfo("col_at_123");
    expect(userInfo.sub).toBe("user_123");
  });

  it("supports client cloning with headers and api keys", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        data: {
          apps: [],
        },
      }),
    );

    const baseClient = new ColineApiClient({
      baseUrl: "https://api.coline.app",
      fetch: fetchMock,
      headers: {
        "X-Test": "base",
      },
    });

    const client = baseClient.withApiKey("test-key").withHeaders({
      "X-Request-Source": "sdk-test",
    });

    await client.listApps();

    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-key");
    expect(headers.get("X-Test")).toBe("base");
    expect(headers.get("X-Request-Source")).toBe("sdk-test");
  });

  it("supports client cloning with oauth access tokens", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        data: {
          apps: [],
        },
      }),
    );

    const baseClient = new ColineApiClient({
      baseUrl: "https://api.coline.app",
      fetch: fetchMock,
    });

    const client = baseClient.withAccessToken("col_at_123");

    await client.listApps();

    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer col_at_123");
  });

  it("throws structured api errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createJsonResponse({
        error: {
          code: "FORBIDDEN",
          message: "No access.",
        },
      }, 403),
    );

    const client = new ColineApiClient({
      baseUrl: "https://api.coline.app",
      fetch: fetchMock,
    });

    await expect(client.listApps()).rejects.toBeInstanceOf(ColineApiError);
  });
});
