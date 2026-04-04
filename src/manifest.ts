import { z } from "zod/v4";

export const appPermissionValues = [
  "app.home.read",
  "ambient.events.write",
  "files.read",
  "files.write",
  "index.write",
  "notifications.read_own",
  "notifications.write",
  "profile.read",
  "tasks.read",
  "tasks.write",
] as const;

export const appPermissionSchema = z.enum(appPermissionValues);
export type AppPermission = z.infer<typeof appPermissionSchema>;

export const appHomeRenderModeValues = ["cached", "live", "hybrid"] as const;
export const appHomeRenderModeSchema = z.enum(appHomeRenderModeValues);
export type AppHomeRenderMode = z.infer<typeof appHomeRenderModeSchema>;

export const appIndexVisibilityModeValues = ["workspace", "scoped"] as const;
export const appIndexVisibilityModeSchema = z.enum(appIndexVisibilityModeValues);
export type AppIndexVisibilityMode = z.infer<typeof appIndexVisibilityModeSchema>;

export const appIndexSubjectTypeValues = ["user", "role", "workspace"] as const;
export const appIndexSubjectTypeSchema = z.enum(appIndexSubjectTypeValues);
export type AppIndexSubjectType = z.infer<typeof appIndexSubjectTypeSchema>;

export const appHostingSchema = z.object({
  mode: z.literal("external"),
  baseUrl: z.url(),
});
export type AppHostingConfig = z.infer<typeof appHostingSchema>;

export const appUiModeValues = ["hosted_native", "hosted_web"] as const;
export const appUiModeSchema = z.enum(appUiModeValues);
export type AppUiMode = z.infer<typeof appUiModeSchema>;

export const colineAppUiSchema = z.object({
  mode: appUiModeSchema.optional(),
  homePath: z.string().trim().min(1).max(2000).optional(),
  filePath: z.string().trim().min(1).max(2000).optional(),
}).default({});
export type ColineAppUiConfigInput = z.input<typeof colineAppUiSchema>;
export type ColineAppUiConfig = z.infer<typeof colineAppUiSchema>;

export const colineKairoDocumentFieldSchema = z.object({
  key: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500).optional(),
});
export type ColineKairoDocumentFieldInput = z.input<
  typeof colineKairoDocumentFieldSchema
>;
export type ColineKairoDocumentField = z.infer<typeof colineKairoDocumentFieldSchema>;

export const colineKairoDocumentTypeSchema = z.object({
  documentType: z.string().trim().min(1).max(160),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500).optional(),
  instructions: z.string().trim().min(1).max(4000).optional(),
  metadata: z.array(colineKairoDocumentFieldSchema).max(30).default([]),
});
export type ColineKairoDocumentTypeInput = z.input<
  typeof colineKairoDocumentTypeSchema
>;
export type ColineKairoDocumentType = z.infer<typeof colineKairoDocumentTypeSchema>;

export const colineKairoIntegrationSchema = z.object({
  enabled: z.boolean().default(true),
  description: z.string().trim().min(1).max(500).optional(),
  instructions: z.string().trim().min(1).max(4000).optional(),
  documentTypes: z.array(colineKairoDocumentTypeSchema).max(50).default([]),
});
export type ColineKairoIntegrationInput = z.input<
  typeof colineKairoIntegrationSchema
>;
export type ColineKairoIntegration = z.infer<typeof colineKairoIntegrationSchema>;

export const notificationDeliveryChannelValues = [
  "in_app",
  "desktop",
] as const;
export const notificationDeliveryChannelSchema = z.enum(
  notificationDeliveryChannelValues,
);
export type NotificationDeliveryChannel = z.infer<
  typeof notificationDeliveryChannelSchema
>;

export const notificationPriorityValues = ["low", "default", "high"] as const;
export const notificationPrioritySchema = z.enum(notificationPriorityValues);
export type NotificationPriority = z.infer<typeof notificationPrioritySchema>;

export const notificationChannelDefinitionSchema = z.object({
  key: z.string().trim().min(1).max(160),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500).optional(),
  defaultDeliveries: z
    .array(notificationDeliveryChannelSchema)
    .min(1)
    .max(notificationDeliveryChannelValues.length)
    .refine(
      (values) => new Set(values).size === values.length,
      "Notification channel deliveries must be unique.",
    ),
  defaultPriority: notificationPrioritySchema.default("default"),
});
export type NotificationChannelDefinitionInput = z.input<
  typeof notificationChannelDefinitionSchema
>;
export type NotificationChannelDefinition = z.infer<
  typeof notificationChannelDefinitionSchema
>;

export const notificationRecipientInputSchema = z.object({
  userId: z.string().trim().min(1).max(200),
});
export type NotificationRecipientInput = z.infer<
  typeof notificationRecipientInputSchema
>;

export const createNotificationInputSchema = z.object({
  channelKey: z.string().trim().min(1).max(160),
  typeKey: z.string().trim().min(1).max(160),
  recipients: z.array(notificationRecipientInputSchema).min(1).max(100),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(4000).optional(),
  targetUrl: z.string().trim().min(1).max(2000).optional(),
  icon: z.string().trim().min(1).max(200).optional(),
  priority: notificationPrioritySchema.default("default"),
  dedupeKey: z.string().trim().min(1).max(200).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type CreateNotificationInputInput = z.input<typeof createNotificationInputSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationInputSchema>;

export const ambientEventSourceKindValues = [
  "message",
  "calendar",
  "file",
  "app_signal",
  "scheduled_trigger",
] as const;
export const ambientEventSourceKindSchema = z.enum(ambientEventSourceKindValues);
export type AmbientEventSourceKind = z.infer<typeof ambientEventSourceKindSchema>;

export const ambientEventActionValues = [
  "created",
  "updated",
  "deleted",
  "responded",
  "approaching",
  "synced",
] as const;
export const ambientEventActionSchema = z.enum(ambientEventActionValues);
export type AmbientEventAction = z.infer<typeof ambientEventActionSchema>;

export const ambientEntityTypeValues = [
  "message",
  "calendar_event",
  "file",
  "app_document",
  "scheduled_trigger",
] as const;
export const ambientEntityTypeSchema = z.enum(ambientEntityTypeValues);
export type AmbientEntityType = z.infer<typeof ambientEntityTypeSchema>;

export const ambientContainerTypeValues = ["channel", "dm", "event"] as const;
export const ambientContainerTypeSchema = z.enum(ambientContainerTypeValues);
export type AmbientContainerType = z.infer<typeof ambientContainerTypeSchema>;

export const ambientContentEventInputSchema = z.object({
  sourceKind: ambientEventSourceKindSchema.default("app_signal"),
  action: ambientEventActionSchema,
  entityType: ambientEntityTypeSchema,
  entityId: z.string().trim().min(1).max(200),
  actorUserId: z.string().trim().min(1).max(200).optional(),
  containerType: ambientContainerTypeSchema.optional(),
  containerId: z.string().trim().min(1).max(200).optional(),
  occurredAt: z.coerce.date().optional(),
  dedupeKey: z.string().trim().min(1).max(240),
  payload: z.record(z.string(), z.unknown()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
  schemaVersion: z.number().int().min(1).default(1),
});
export type AmbientContentEventInputInput = z.input<
  typeof ambientContentEventInputSchema
>;
export type AmbientContentEventInput = z.infer<typeof ambientContentEventInputSchema>;

export const emitAmbientEventsInputSchema = z.object({
  events: z.array(ambientContentEventInputSchema).min(1).max(100),
});
export type EmitAmbientEventsInputInput = z.input<typeof emitAmbientEventsInputSchema>;
export type EmitAmbientEventsInput = z.infer<typeof emitAmbientEventsInputSchema>;

export const colineAppManifestSchema = z.object({
  key: z.string().trim().min(3).max(120),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500).optional(),
  iconUrl: z.url().optional(),
  permissions: z.array(appPermissionSchema).default([]),
  notificationChannels: z.array(notificationChannelDefinitionSchema).default([]),
  kairo: colineKairoIntegrationSchema.optional(),
  hosting: appHostingSchema,
  ui: colineAppUiSchema.default({}),
});
export type ColineAppManifestInput = z.input<typeof colineAppManifestSchema>;
export type ColineAppManifest = z.infer<typeof colineAppManifestSchema>;

export const colineFileTypeSchema = z.object({
  typeKey: z.string().trim().min(3).max(160),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(500).optional(),
  storage: z.enum(["coline_document"]),
  indexable: z.boolean().default(true),
  homeRenderMode: appHomeRenderModeSchema.default("cached"),
});
export type ColineFileTypeDefinitionInput = z.input<typeof colineFileTypeSchema>;
export type ColineFileTypeDefinition = z.infer<typeof colineFileTypeSchema>;

export const colineAppRegistrationPayloadSchema = z.object({
  version: z.string().trim().min(1).max(64),
  manifest: colineAppManifestSchema,
  fileTypes: z.array(colineFileTypeSchema).default([]),
});
export type ColineAppRegistrationPayloadInput = z.input<
  typeof colineAppRegistrationPayloadSchema
>;
export type ColineAppRegistrationPayload = z.infer<
  typeof colineAppRegistrationPayloadSchema
>;

export const appIndexVisibilityGrantSchema = z.object({
  subjectType: appIndexSubjectTypeSchema,
  subjectId: z.string().trim().min(1).max(200),
});
export type AppIndexVisibilityGrantInput = z.input<
  typeof appIndexVisibilityGrantSchema
>;
export type AppIndexVisibilityGrant = z.infer<typeof appIndexVisibilityGrantSchema>;

export const appIndexDocumentSchema = z.object({
  documentKey: z.string().trim().min(1).max(200),
  documentType: z.string().trim().min(1).max(160),
  fileId: z.string().trim().min(1).max(200).optional(),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(100_000).default(""),
  url: z.string().trim().min(1).max(2_000).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  visibilityMode: appIndexVisibilityModeSchema.default("workspace"),
  visibility: z.array(appIndexVisibilityGrantSchema).default([]),
});
export type AppIndexDocumentInput = z.input<typeof appIndexDocumentSchema>;
export type AppIndexDocument = z.infer<typeof appIndexDocumentSchema>;

export const batchUpsertAppIndexDocumentsSchema = z.object({
  documents: z.array(appIndexDocumentSchema).min(1).max(100),
});
export type BatchUpsertAppIndexDocumentsInput = z.input<
  typeof batchUpsertAppIndexDocumentsSchema
>;
export type BatchUpsertAppIndexDocuments = z.infer<
  typeof batchUpsertAppIndexDocumentsSchema
>;

export const batchDeleteAppIndexDocumentsSchema = z.object({
  documentKeys: z.array(z.string().trim().min(1).max(200)).min(1).max(100),
});
export type BatchDeleteAppIndexDocumentsInput = z.input<
  typeof batchDeleteAppIndexDocumentsSchema
>;
export type BatchDeleteAppIndexDocuments = z.infer<
  typeof batchDeleteAppIndexDocumentsSchema
>;
