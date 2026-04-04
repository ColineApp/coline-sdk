import { describe, expect, it } from "vitest";
import { ColineApp, colineAppManifestSchema, ui } from "./index";

describe("ColineApp", () => {
  it("validates manifest configuration", () => {
    const manifest = colineAppManifestSchema.parse({
      key: "com.coline.notes",
      name: "Notes",
      permissions: ["app.home.read", "files.write", "index.write"],
      kairo: {
        description: "Notes documents can be searched by Kairo.",
        documentTypes: [
          {
            documentType: "note",
            name: "Note",
            metadata: [{ key: "tags", description: "Note tags" }],
          },
        ],
      },
      notificationChannels: [
        {
          key: "updates",
          name: "Updates",
          defaultDeliveries: ["in_app", "desktop"],
        },
      ],
      hosting: {
        mode: "external",
        baseUrl: "https://notes.example.com",
      },
    });

    expect(manifest.hosting.baseUrl).toBe("https://notes.example.com");
    expect(manifest.kairo?.documentTypes[0]?.documentType).toBe("note");
  });

  it("registers file types and handlers in the app definition", () => {
    const app = new ColineApp({
      key: "com.coline.notes",
      name: "Notes",
      permissions: ["app.home.read", "files.read", "files.write"],
      hosting: {
        mode: "external",
        baseUrl: "https://notes.example.com",
      },
    })
      .defineFileType({
        typeKey: "com.coline.notes.note",
        name: "Note",
        storage: "coline_document",
      })
      .defineNotificationChannel({
        key: "updates",
        name: "Updates",
        defaultDeliveries: ["in_app", "desktop"],
      })
      .onHomeRender(async () =>
        ui.stack([
          ui.heading("Notes"),
          ui.button("New note", {
            action: { type: "create_note" },
          }),
        ]),
      )
      .onIndexSync(() => []);

    const definition = app.getDefinition();

    expect(definition.fileTypes).toHaveLength(1);
    expect(definition.notificationChannels).toHaveLength(1);
    expect(definition.fileTypes[0]?.typeKey).toBe("com.coline.notes.note");
    expect(typeof definition.handlers.homeRender).toBe("function");
    expect(typeof definition.handlers.indexSync).toBe("function");
  });

  it("builds a typed registration payload for API submission", () => {
    const app = new ColineApp({
      key: "com.coline.notes",
      name: "Notes",
      permissions: ["app.home.read"],
      hosting: {
        mode: "external",
        baseUrl: "https://notes.example.com",
      },
    })
      .defineFileType({
        typeKey: "com.coline.notes.note",
        name: "Note",
        storage: "coline_document",
      })
      .defineNotificationChannel({
        key: "updates",
        name: "Updates",
        defaultDeliveries: ["in_app"],
      });

    const payload = app.getRegistrationPayload("0.1.0");

    expect(payload.version).toBe("0.1.0");
    expect(payload.manifest.key).toBe("com.coline.notes");
    expect(payload.fileTypes[0]?.homeRenderMode).toBe("cached");
    expect(payload.manifest.notificationChannels[0]?.key).toBe("updates");
  });

  it("builds typed search and Kairo configuration", () => {
    const app = new ColineApp({
      key: "com.coline.notes",
      name: "Notes",
      permissions: ["index.write"],
      hosting: {
        mode: "external",
        baseUrl: "https://notes.example.com",
      },
    }).defineKairo({
      description: "Indexed notes for Kairo.",
      documentTypes: [
        {
          documentType: "note",
          name: "Note",
          instructions: "Read note bodies as canonical content.",
          metadata: [{ key: "tags" }],
        },
      ],
    });

    const document = app.search.document({
      documentKey: "note:file_123",
      documentType: "note",
      fileId: "file_123",
      title: "Roadmap",
      body: "Quarterly roadmap",
      metadata: { tags: ["planning"] },
    });

    expect(app.kairo?.documentTypes[0]?.name).toBe("Note");
    expect(document.documentType).toBe("note");
    expect(app.search.upsert({ documents: [document] }).documents).toHaveLength(1);
  });

  it("rejects invalid external hosting urls", () => {
    expect(() => {
      new ColineApp({
        key: "com.coline.invalid",
        name: "Invalid",
        permissions: [],
        hosting: {
          mode: "external",
          baseUrl: "not-a-url",
        },
      });
    }).toThrow();
  });

  it("builds typed notification payloads", () => {
    const app = new ColineApp({
      key: "com.coline.notes",
      name: "Notes",
      permissions: ["notifications.write"],
      hosting: {
        mode: "external",
        baseUrl: "https://notes.example.com",
      },
    }).defineNotificationChannel({
      key: "updates",
      name: "Updates",
      defaultDeliveries: ["in_app", "desktop"],
    });

    const payload = app.createNotification({
      channelKey: "updates",
      typeKey: "note.shared",
      recipients: [{ userId: "user_123" }],
      title: "A note was shared",
      metadata: { noteId: "note_123" },
    });

    expect(payload.priority).toBe("default");
    expect(payload.recipients[0]?.userId).toBe("user_123");
  });

  it("builds typed ambient event batches", () => {
    const app = new ColineApp({
      key: "com.coline.notes",
      name: "Notes",
      permissions: ["ambient.events.write"],
      hosting: {
        mode: "external",
        baseUrl: "https://notes.example.com",
      },
    });

    const payload = app.createAmbientEvents({
      events: [
        {
          action: "synced",
          entityType: "app_document",
          entityId: "note_123",
          dedupeKey: "sync:note_123:v1",
          payload: { title: "Roadmap" },
        },
      ],
    });

    expect(payload.events[0]?.sourceKind).toBe("app_signal");
    expect(payload.events[0]?.payload).toEqual({ title: "Roadmap" });
  });
});
