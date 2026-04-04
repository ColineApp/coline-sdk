import {
  appIndexDocumentSchema,
  batchDeleteAppIndexDocumentsSchema,
  batchUpsertAppIndexDocumentsSchema,
  colineAppManifestSchema,
  colineKairoIntegrationSchema,
  colineAppRegistrationPayloadSchema,
  colineFileTypeSchema,
  createNotificationInputSchema,
  emitAmbientEventsInputSchema,
  type AppIndexDocument,
  type AppIndexDocumentInput,
  type BatchDeleteAppIndexDocuments,
  type BatchDeleteAppIndexDocumentsInput,
  type BatchUpsertAppIndexDocuments,
  type BatchUpsertAppIndexDocumentsInput,
  type ColineAppManifest,
  type ColineAppManifestInput,
  type ColineFileTypeDefinition,
  type ColineFileTypeDefinitionInput,
  type ColineKairoIntegration,
  type ColineKairoIntegrationInput,
  type ColineAppRegistrationPayload,
  type EmitAmbientEventsInput,
  type EmitAmbientEventsInputInput,
  type CreateNotificationInput,
  type CreateNotificationInputInput,
  type NotificationChannelDefinition,
  type NotificationChannelDefinitionInput,
  notificationChannelDefinitionSchema,
} from "./manifest";
import type {
  FileRenderContext,
  FileRenderResult,
  HomeRenderContext,
  HomeRenderResult,
  IndexSyncContext,
} from "./contexts";

export type HomeRenderHandler = (
  context: HomeRenderContext,
) => HomeRenderResult | Promise<HomeRenderResult>;
export type FileRenderHandler = (
  context: FileRenderContext,
) => FileRenderResult | Promise<FileRenderResult>;
export type IndexSyncHandler = (context: IndexSyncContext) => unknown | Promise<unknown>;

export interface ColineAppDefinition {
  manifest: ColineAppManifest;
  fileTypes: ColineFileTypeDefinition[];
  notificationChannels: NotificationChannelDefinition[];
  handlers: {
    homeRender?: HomeRenderHandler;
    fileRender?: FileRenderHandler;
    indexSync?: IndexSyncHandler;
  };
}

class ColineAmbientHelper {
  emit(input: EmitAmbientEventsInputInput): EmitAmbientEventsInput {
    return emitAmbientEventsInputSchema.parse(input);
  }
}

class ColineSearchHelper {
  document(input: AppIndexDocumentInput): AppIndexDocument {
    return appIndexDocumentSchema.parse(input);
  }

  upsert(input: BatchUpsertAppIndexDocumentsInput): BatchUpsertAppIndexDocuments {
    return batchUpsertAppIndexDocumentsSchema.parse(input);
  }

  delete(input: BatchDeleteAppIndexDocumentsInput): BatchDeleteAppIndexDocuments {
    return batchDeleteAppIndexDocumentsSchema.parse(input);
  }
}

export class ColineApp {
  readonly ambient = new ColineAmbientHelper();
  readonly search = new ColineSearchHelper();
  private readonly fileTypes = new Map<string, ColineFileTypeDefinition>();
  private readonly notificationChannels = new Map<string, NotificationChannelDefinition>();
  private readonly handlers: ColineAppDefinition["handlers"] = {};
  private manifestConfig: ColineAppManifest;

  constructor(manifest: ColineAppManifestInput) {
    this.manifestConfig = colineAppManifestSchema.parse(manifest);
  }

  defineFileType(fileType: ColineFileTypeDefinitionInput): this {
    const parsed = colineFileTypeSchema.parse(fileType);
    this.fileTypes.set(parsed.typeKey, parsed);
    return this;
  }

  defineNotificationChannel(channel: NotificationChannelDefinitionInput): this {
    const parsed = notificationChannelDefinitionSchema.parse(channel);
    this.notificationChannels.set(parsed.key, parsed);
    return this;
  }

  defineKairo(config: ColineKairoIntegrationInput): this {
    const parsed = colineKairoIntegrationSchema.parse(config);
    this.manifestConfig = colineAppManifestSchema.parse({
      ...this.manifestConfig,
      kairo: parsed,
    });
    return this;
  }

  onHomeRender(handler: HomeRenderHandler): this {
    this.handlers.homeRender = handler;
    return this;
  }

  onFileRender(handler: FileRenderHandler): this {
    this.handlers.fileRender = handler;
    return this;
  }

  onIndexSync(handler: IndexSyncHandler): this {
    this.handlers.indexSync = handler;
    return this;
  }

  get manifest(): ColineAppManifest {
    return this.manifestConfig;
  }

  get kairo(): ColineKairoIntegration | undefined {
    return this.manifestConfig.kairo;
  }

  getDefinition(): ColineAppDefinition {
    const notificationChannels = [...this.notificationChannels.values()];

    return {
      manifest: {
        ...this.manifestConfig,
        notificationChannels,
      },
      fileTypes: [...this.fileTypes.values()],
      notificationChannels,
      handlers: { ...this.handlers },
    };
  }

  getRegistrationPayload(version: string): ColineAppRegistrationPayload {
    const notificationChannels = [...this.notificationChannels.values()];

    return colineAppRegistrationPayloadSchema.parse({
      version,
      manifest: {
        ...this.manifestConfig,
        notificationChannels,
      },
      fileTypes: [...this.fileTypes.values()],
    });
  }

  createNotification(input: CreateNotificationInputInput): CreateNotificationInput {
    return createNotificationInputSchema.parse(input);
  }

  createAmbientEvents(input: EmitAmbientEventsInputInput): EmitAmbientEventsInput {
    return this.ambient.emit(input);
  }

  /**
   * Returns a Response for `GET /coline/manifest`.
   * Mount this on your server so the Coline developer console can
   * auto-import your app's manifest instead of manual JSON entry.
   *
   * @example
   * ```ts
   * // Hono
   * app.get("/coline/manifest", (c) => c.body(myColineApp.handleManifestRequest()));
   *
   * // Next.js route handler
   * export function GET() { return myColineApp.handleManifestRequest(); }
   *
   * // Plain fetch handler
   * if (url.pathname === "/coline/manifest") return myColineApp.handleManifestRequest();
   * ```
   */
  handleManifestRequest(): Response {
    const definition = this.getDefinition();
    const payload = {
      manifest: {
        key: definition.manifest.key,
        name: definition.manifest.name,
        ...(definition.manifest.description
          ? { description: definition.manifest.description }
          : {}),
        ...(definition.manifest.iconUrl
          ? { iconUrl: definition.manifest.iconUrl }
          : {}),
        permissions: definition.manifest.permissions,
        notificationChannels: definition.manifest.notificationChannels,
        ...(definition.manifest.kairo
          ? { kairo: definition.manifest.kairo }
          : {}),
        hosting: definition.manifest.hosting,
      },
      fileTypes: definition.fileTypes,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Cache-Control": "no-store",
      },
    });
  }
}
