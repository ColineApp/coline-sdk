import {
  batchDeleteAppIndexDocumentsSchema,
  batchUpsertAppIndexDocumentsSchema,
  colineAppRegistrationPayloadSchema,
  createNotificationInputSchema,
  emitAmbientEventsInputSchema,
  appPermissionSchema,
  type AppPermission,
  type BatchDeleteAppIndexDocumentsInput,
  type BatchUpsertAppIndexDocumentsInput,
  type ColineAppRegistrationPayload,
  type ColineAppRegistrationPayloadInput,
  type CreateNotificationInputInput,
  type EmitAmbientEventsInputInput,
} from "./manifest";
import { ColineApiError } from "./errors";
import type { components as AppPlatformComponents } from "./generated/app-platform-v1";
import {
  createAppPlatformClient,
  type AppPlatformClient,
} from "./app-platform-client";

interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as T | null;

  if (!response.ok) {
    const errorMessage =
      payload &&
      typeof payload === "object" &&
      "error_description" in payload &&
      typeof (payload as Record<string, unknown>)["error_description"] === "string"
        ? ((payload as Record<string, unknown>)["error_description"] as string)
        : `Request failed (${response.status}).`;

    throw new ColineApiError({
      message: errorMessage,
      type: "oauth",
      status: response.status,
      code:
        payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof (payload as Record<string, unknown>)["error"] === "string"
          ? ((payload as Record<string, unknown>)["error"] as string)
          : null,
    });
  }

  if (!payload) {
    throw new ColineApiError({
      message: "Invalid JSON response.",
      type: "oauth",
      status: response.status,
    });
  }

  return payload;
}

export interface ColineApiClientOptions {
  baseUrl: string;
  apiKey?: string;
  fetch?: typeof fetch;
  headers?: HeadersInit;
  /** Maximum number of automatic retries on 429 / 5xx responses (default: 0). */
  maxRetries?: number;
  /** Log requests and responses to console for debugging. */
  debug?: boolean;
}

type Schemas = AppPlatformComponents["schemas"];
type UnwrapData<TKey extends keyof Schemas> =
  Schemas[TKey] extends { data: infer T } ? T : never;

export type RegisteredAppDetail = Schemas["RegisteredAppDetail"];
export type RegisteredAppRecord = Omit<
  RegisteredAppDetail,
  "latestPublishedVersionId"
>;
export type RegisteredAppVersionSummary = Schemas["RegisteredAppVersionSummary"];
export type WorkspaceInstalledApp = Schemas["InstalledAppSummary"];
export type WorkspaceAppCatalogItem = Schemas["AppCatalogItem"];
export type WorkspaceAppsResponse = UnwrapData<"WorkspaceAppsResponse">;

export interface InstallWorkspaceAppInput {
  appId: string;
  pinnedVersionId?: string;
  grantedPermissions?: AppPermission[];
}

export type InstallWorkspaceAppResponse = UnwrapData<"InstallWorkspaceAppResponse">;

export interface SubmitAppVersionForReviewInput {
  storeListed?: boolean;
}

export type SubmitAppVersionForReviewResponse = UnwrapData<
  "SubmitAppVersionForReviewResponse"
>;
export type WorkspaceAppPermissionsResponse = UnwrapData<
  "WorkspaceAppPermissionsResponse"
>;
export type WorkspaceInstalledAppResponse = UnwrapData<
  "WorkspaceInstalledAppResponse"
>;
export type WorkspaceAppSecretsResponse = UnwrapData<
  "WorkspaceAppSecretsResponse"
>;
export type WorkspaceAppSecretSummary = WorkspaceAppSecretsResponse["secrets"][number];
export type CreateWorkspaceAppSecretResponse = UnwrapData<
  "CreateWorkspaceAppSecretResponse"
>;
export type WorkspaceAppOauthConnectionsResponse = UnwrapData<
  "WorkspaceAppOauthConnectionsResponse"
>;
export type WorkspaceAppOauthConnectionSummary =
  WorkspaceAppOauthConnectionsResponse["connections"][number];
export type CreateWorkspaceAppOauthConnectionResponse = UnwrapData<
  "CreateWorkspaceAppOauthConnectionResponse"
>;
export type WorkspaceAppDeliveriesResponse = UnwrapData<
  "WorkspaceAppDeliveriesResponse"
>;
export type WorkspaceAppDeliverySummary =
  WorkspaceAppDeliveriesResponse["deliveries"][number];
export type SendWorkspaceAppTestDeliveryResponse = UnwrapData<
  "SendWorkspaceAppTestDeliveryResponse"
>;
export type AppFilesListResponse = UnwrapData<"AppFilesListResponse">;
export type AppFileDocumentResponse = UnwrapData<"AppFileDocumentResponse">;
export type AppFileDocumentUpdateResponse = UnwrapData<
  "AppFileDocumentUpdateResponse"
>;
export type CreateAppFileResponse = UnwrapData<"CreateAppFileResponse">;
export type ExecuteAppActionResponse = UnwrapData<"ExecuteAppActionResponse">;
export type OkResponse = UnwrapData<"OkResponse">;
export type TabModelRecord = Schemas["TabModelRecord"];
export type TabModelsResponse = UnwrapData<"TabModelsResponse">;
export type TabChatCompletionResponse = UnwrapData<
  "TabChatCompletionResponseEnvelope"
>;
export type UpsertAppIndexDocumentsResponse = UnwrapData<
  "UpsertAppIndexDocumentsResponse"
>;
export type DeleteAppIndexDocumentsResponse = UnwrapData<
  "DeleteAppIndexDocumentsResponse"
>;
export type EmitAppAmbientEventsResponse = UnwrapData<
  "EmitAppAmbientEventsResponse"
>;

export interface OAuthTokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface OAuthUserInfoResponse {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string | null;
  family_name: string | null;
  picture: string | null;
  preferred_username: string | null;
  scope: string;
}

export interface UpdateWorkspaceAppPermissionsInput {
  grantedPermissions: AppPermission[];
}

export interface CreateWorkspaceAppSecretInput {
  key: string;
  value: string;
}

export interface CreateWorkspaceAppOauthConnectionInput {
  providerKey: string;
  externalAccountId?: string | null;
  accessToken: string;
  refreshToken?: string | null;
  scopes: string[];
  tokenExpiresAt?: string | null;
  metadata?: Record<string, unknown>;
}

export interface SendWorkspaceAppTestDeliveryInput {
  eventType: string;
  targetUrl?: string;
  payload: Record<string, unknown>;
}

export interface ListAppFilesQuery {
  driveId?: string;
  typeKey?: string;
  limit?: number;
}

export interface CreateAppFileInput {
  name: string;
  typeKey?: string;
  driveId?: string;
  parentId?: string | null;
  document?: Record<string, unknown>;
}

export interface ExecuteAppActionInput {
  action: {
    type: string;
    payload?: Record<string, unknown>;
  };
  fileId?: string | null;
}

// ---------------------------------------------------------------------------
// Core Platform API — Types
// ---------------------------------------------------------------------------

export interface WorkspaceMember {
  id: string;
  workspaceMemberId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  joinedAt: string;
  roles: string[];
}

export interface WorkspaceMembersResponse {
  members: WorkspaceMember[];
}

export interface MyWorkspaceSummary {
  id: string;
  slug: string;
  name: string;
  type: "personal" | "team";
  ownerUserId: string;
  workspaceMemberId: string;
}

export interface MyWorkspacesResponse {
  workspaces: MyWorkspaceSummary[];
}

export interface WorkspaceNoteSummary {
  id: string;
  driveId: string;
  parentId: string | null;
  title: string;
  body: string;
  color: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceNoteDetail extends WorkspaceNoteSummary {
  blocks: unknown[];
}

export interface WorkspaceNotesListResponse {
  notes: WorkspaceNoteSummary[];
  page: { limit: number; hasMore: boolean; nextCursor: string | null };
}

export interface WorkspaceNoteResponse {
  note: WorkspaceNoteSummary;
}

export interface WorkspaceNoteDetailResponse {
  note: WorkspaceNoteDetail;
}

export interface ListWorkspaceNotesQuery {
  q?: string;
  limit?: number;
  cursor?: string;
}

export interface CreateWorkspaceNoteInput {
  title?: string;
  body?: string;
  blocks?: unknown[];
  driveId?: string;
  parentId?: string | null;
}

export interface UpdateWorkspaceNoteInput {
  title?: string;
  body?: string;
  blocks?: unknown[];
}

export interface CalendarEventLinkInput {
  linkType: "file" | "channel" | "url";
  fileId?: string;
  channelId?: string;
  url?: string;
  label?: string | null;
}

// ---------------------------------------------------------------------------
// Core Platform API — Calendar Types
// ---------------------------------------------------------------------------

export interface CalendarEventAttendeeUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  email: string;
  timezone: string | null;
}

export interface CalendarEventAttendee {
  id: string;
  userId: string;
  role: "organizer" | "attendee";
  responseStatus: "needs_action" | "accepted" | "tentative" | "declined";
  availabilityStatus: "available" | "busy" | "unavailable" | "unknown";
  respondedAt: string | null;
  user: CalendarEventAttendeeUser;
}

export interface CalendarEventLink {
  id: string;
  linkType: "file" | "channel" | "url";
  label: string | null;
  url: string | null;
  file: {
    id: string;
    name: string;
    fileType: string;
    driveId: string;
    parentId: string | null;
  } | null;
  channel: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface CalendarSchedulingBooking {
  id: string;
  schedulingLinkId: string;
  calendarEventId: string;
  guestName: string;
  guestEmail: string;
  guestMessage: string | null;
  guestTimeZone: string | null;
  startsAt: string;
  endsAt: string;
  status: "active" | "canceled";
  schedulingLink: {
    id: string;
    slug: string;
    title: string;
  };
}

export interface CalendarViewItem {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  isAllDay: boolean;
  visibility: "private" | "invitees" | "workspace";
  status: "active" | "canceled";
  recurrenceRule: CalendarRecurrenceRule | Record<string, never>;
  attendeeCount: number;
  acceptedCount: number;
  tentativeCount: number;
  declinedCount: number;
  myResponse: "needs_action" | "accepted" | "tentative" | "declined" | null;
  kind?: "event" | "task";
  taskPriority?: "none" | "low" | "medium" | "high" | "urgent";
  taskCompleted?: boolean;
  taskboardId?: string;
}

export interface CalendarEventDetail {
  id: string;
  workspaceId: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  isAllDay: boolean;
  visibility: "private" | "invitees" | "workspace";
  status: "active" | "canceled";
  organizerUserId: string;
  createdByUserId: string | null;
  callProvider: string | null;
  callJoinUrl: string | null;
  callState: string | null;
  recurrenceRule: CalendarRecurrenceRule | Record<string, never>;
  attendees: CalendarEventAttendee[];
  links: CalendarEventLink[];
  myAttendance: CalendarEventAttendee | null;
  schedulingBooking: CalendarSchedulingBooking | null;
}

// ---------------------------------------------------------------------------
// Core Platform API — Docs Types
// ---------------------------------------------------------------------------

export interface DocLayout {
  mode: "pages";
  pageSize: "letter";
  orientation: "portrait" | "landscape";
  margins: "normal" | "narrow" | "wide";
  backgroundColor: string | null;
  showPageNumbers: boolean;
}

export interface WorkspaceDocSummary {
  id: string;
  driveId: string;
  parentId: string | null;
  title: string;
  excerpt: string;
  color: string | null;
  layout: DocLayout;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceDocDetail extends Omit<WorkspaceDocSummary, "excerpt"> {
  content: Record<string, unknown>;
  plainText: string;
}

export interface WorkspaceDocsListResponse {
  docs: WorkspaceDocSummary[];
  page: { limit: number; hasMore: boolean; nextCursor: string | null };
}

export interface WorkspaceDocResponse {
  doc: WorkspaceDocSummary;
}

export interface WorkspaceDocDetailResponse {
  doc: WorkspaceDocDetail;
}

export interface ListWorkspaceDocsQuery {
  q?: string;
  limit?: number;
  cursor?: string;
}

export interface CreateWorkspaceDocInput {
  title?: string;
  content?: Record<string, unknown>;
  layout?: {
    orientation?: "portrait" | "landscape";
    margins?: "normal" | "narrow" | "wide";
    backgroundColor?: string | null;
    showPageNumbers?: boolean;
  };
  driveId?: string;
  parentId?: string | null;
}

export interface UpdateWorkspaceDocInput {
  title?: string;
  content?: Record<string, unknown>;
  layout?: {
    orientation?: "portrait" | "landscape";
    margins?: "normal" | "narrow" | "wide";
    backgroundColor?: string | null;
    showPageNumbers?: boolean;
  };
}

// ---------------------------------------------------------------------------
// Core Platform API — Drives & Files Types
// ---------------------------------------------------------------------------

export interface DriveMountSummary {
  type: "native" | "integration";
  providerKey: string | null;
  syncStatus: "idle" | "syncing" | "errored" | "disabled";
}

export interface WorkspaceDriveSummary {
  id: string;
  name: string;
  slug: string;
  kind: "personal" | "shared";
  accessMode: "workspace_default" | "restricted";
  isDefault: boolean;
  ownerUserId: string | null;
  mount: DriveMountSummary;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceDrivesListResponse {
  drives: WorkspaceDriveSummary[];
}

export interface DriveFileSummary {
  id: string;
  driveId: string;
  parentId: string | null;
  name: string;
  fileType: string;
  mimeType: string | null;
  sizeBytes: number | null;
  color: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DriveFilesListResponse {
  files: DriveFileSummary[];
  page: { limit: number; hasMore: boolean; nextCursor: string | null };
}

export interface ListDriveFilesQuery {
  parentId?: string;
  fileType?: string;
  trashed?: boolean;
  limit?: number;
  cursor?: string;
}

export interface FileDetail {
  id: string;
  driveId: string;
  parentId: string | null;
  name: string;
  fileType: string;
  mimeType: string | null;
  sizeBytes: number | null;
  color: string | null;
  accessMode: string;
  isTrashed: boolean;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FileDetailResponse {
  file: FileDetail;
}

export interface UpdateFileInput {
  name?: string;
  parentId?: string | null;
  color?: "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink" | "gray" | null;
}

// ---------------------------------------------------------------------------
// Channels
// ---------------------------------------------------------------------------

export interface ChannelSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  topic: string | null;
  type: "public" | "private";
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelListResponse {
  channels: ChannelSummary[];
}

// ---------------------------------------------------------------------------
// Direct Messages
// ---------------------------------------------------------------------------

export interface DmMemberSummary {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
}

export interface DmSummary {
  id: string;
  isGroup: boolean;
  name: string | null;
  members: DmMemberSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface DmListResponse {
  dms: DmSummary[];
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export interface MessageTextPart {
  type: "text";
  text: string;
}

export interface MessageMentionPart {
  type: "mention";
  userId: string;
  displayName: string;
}

export type MessageContentPart = MessageTextPart | MessageMentionPart;

export interface ContainerMessageSummary {
  id: string;
  authorUserId: string | null;
  messageKind: string;
  plaintext: string;
  content: MessageContentPart[];
  replyToMessageId: string | null;
  editedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessagesListResponse {
  messages: ContainerMessageSummary[];
  page: {
    limit: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
}

export interface SendMessageInput {
  content: MessageContentPart[];
  replyToMessageId?: string | null;
  threadRootMessageId?: string | null;
}

export interface SendMessageResponse {
  message: ContainerMessageSummary;
}

export interface MessageDetailResponse {
  message: ContainerMessageSummary & {
    containerType: string;
    containerId: string;
  };
}

export interface EditMessageInput {
  content: MessageContentPart[];
}

export interface ThreadResponse {
  rootMessage: MessageDetailResponse["message"];
  replies: ContainerMessageSummary[];
}

export interface ThreadReplyInput {
  content: MessageContentPart[];
}

export interface ReactionResponse {
  messageId: string;
  emoji: string;
  count: number;
}

export interface PinResponse {
  messageId: string;
  pinned: boolean;
}

export interface CalendarRecurrenceRule {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  byDay?: Array<"MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU">;
  count?: number;
  until?: string;
}

export interface CreateCalendarEventInput {
  title: string;
  description?: string | null;
  location?: string | null;
  startsAt: string;
  endsAt: string;
  timeZone: string;
  isAllDay?: boolean;
  visibility?: "private" | "invitees" | "workspace";
  attendeeUserIds?: string[];
  linkInputs?: CalendarEventLinkInput[];
  recurrenceRule?: CalendarRecurrenceRule | null;
}

export interface UpdateCalendarEventInput {
  title?: string;
  description?: string | null;
  location?: string | null;
  startsAt?: string;
  endsAt?: string;
  timeZone?: string;
  isAllDay?: boolean;
  visibility?: "private" | "invitees" | "workspace";
  status?: "active" | "canceled";
  attendeeUserIds?: string[];
  linkInputs?: CalendarEventLinkInput[];
  recurrenceRule?: CalendarRecurrenceRule | null;
}

export interface CalendarEventsListResponse {
  items: CalendarViewItem[];
  range: { start: string; end: string };
}

export interface CalendarEventDetailResponse {
  event: CalendarEventDetail;
}

export interface WorkspaceSearchInput {
  query: string;
  sourceKinds?: Array<
    "file" | "task" | "container_message" | "kairo_message" | "app_document"
  >;
  limit?: number;
  cursor?: string;
}

export interface WorkspaceSearchResult {
  id: string;
  title: string | null;
  snippet: string | null;
  sourceKind: string;
  sourceId: string;
  url: string | null;
  score: number;
}

export interface WorkspaceSearchResponse {
  results: WorkspaceSearchResult[];
  nextCursor: string | null;
}

export interface TaskboardStatusSummary {
  id: string;
  key: string;
  name: string;
  color: string;
  isDefault: boolean;
  isCompleted: boolean;
  sortOrder: number;
}

export interface TaskboardSummary {
  id: string;
  name: string;
  driveId: string;
  color: string | null;
  identifierPrefix: string | null;
  description: string | null;
  defaultView: string | null;
  statuses: TaskboardStatusSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceTaskboardsResponse {
  taskboards: TaskboardSummary[];
}

export interface TaskAssignee {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  email: string;
}

export interface TaskSummary {
  id: string;
  taskboardId: string;
  taskNumber: number;
  identifier: string | null;
  title: string;
  description: string | null;
  status: {
    id: string;
    key: string;
    name: string;
    color: string;
    isCompleted: boolean;
  } | null;
  priority: string;
  labels: string[];
  dueDate: string | null;
  assignees: TaskAssignee[];
  isCompleted: boolean;
  completedAt: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDetail extends TaskSummary {
  descriptionBlocks: unknown[];
  statusId: string;
  sourceMessageId: string | null;
  threadRootMessageId: string | null;
}

export interface TaskboardTasksResponse {
  tasks: TaskSummary[];
}

export interface TaskDetailResponse {
  task: TaskDetail;
}

export interface ListTaskboardTasksQuery {
  q?: string;
  statusId?: string;
  assigneeUserId?: string;
  limit?: number;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  statusId?: string;
  priority?: "none" | "low" | "medium" | "high" | "urgent";
  dueDate?: string | null;
  labels?: string[];
  assigneeUserIds?: string[];
}

export interface CreateTaskResponse {
  task: {
    id: string;
    taskboardId: string;
    title: string;
    description: string;
    statusId: string;
    priority: string;
    labels: string[];
    dueDate: string | null;
    assigneeUserIds: string[];
    createdByUserId: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  statusId?: string;
  priority?: "none" | "low" | "medium" | "high" | "urgent";
  dueDate?: string | null;
  labels?: string[];
  assigneeUserIds?: string[];
}

// ---------------------------------------------------------------------------
// Tab streaming types
// ---------------------------------------------------------------------------

export interface TabChatCompletionInput {
  model?: string;
  tab_context: {
    surface: "notes" | "docs" | "messages" | "tasks" | "calendar";
    workspace_slug: string;
    entity_id: string;
    active_text_before_cursor: string;
    active_text_after_cursor?: string;
    surrounding_context?: string;
    block_kind?: string;
    note_title?: string;
    document_title?: string;
    document_type?: "plaintext" | "markdown";
    taskboard_file_id?: string;
  };
  messages?: Array<{ role?: string; content?: string }>;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
}

export interface TabChatCompletionChunk {
  id: string;
  object: "chat.completion.chunk";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

// ---------------------------------------------------------------------------
// File upload types
// ---------------------------------------------------------------------------

export interface InitiateUploadInput {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  driveId: string;
  parentId?: string | null;
}

export interface InitiateUploadResponse {
  uploadId: string;
  partCount: number;
}

export interface UploadPartResponse {
  partNumber: number;
  etag: string;
}

export interface CompletedUploadPart {
  partNumber: number;
  etag: string;
}

export interface UploadedFile {
  id: string;
  driveId: string;
  parentId: string | null;
  name: string;
  fileType: string;
  mimeType: string | null;
  sizeBytes: number | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CompleteUploadResponse {
  file: UploadedFile;
}

export interface UploadFileInput {
  data: Blob | ArrayBuffer | Uint8Array;
  fileName: string;
  mimeType: string;
  driveId: string;
  parentId?: string | null;
}

// ---------------------------------------------------------------------------
// Batch task types
// ---------------------------------------------------------------------------

export interface BatchUpdateTaskEntry extends UpdateTaskInput {
  taskId: string;
}

export interface BatchResultEntry<T> {
  status: "fulfilled" | "rejected";
  value?: T;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Pagination helper
// ---------------------------------------------------------------------------

/**
 * A page from a paginated endpoint.
 */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Async generator that auto-fetches subsequent pages from a paginated Coline
 * endpoint. Yields one item at a time.
 *
 * @example
 * ```ts
 * const ws = coline.workspace("ws_123");
 * for await (const note of ws.paginateNotes({ limit: 50 })) {
 *   console.log(note.title);
 * }
 * ```
 */
export async function* paginate<T>(
  fetchPage: (cursor: string | undefined) => Promise<Page<T>>,
): AsyncGenerator<T, void, undefined> {
  let cursor: string | undefined = undefined;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    const page = await fetchPage(cursor);
    for (const item of page.items) {
      yield item;
    }
    if (!page.hasMore || page.nextCursor === null) break;
    cursor = page.nextCursor;
  }
}

// ---------------------------------------------------------------------------
// Retry + backoff helper
// ---------------------------------------------------------------------------

function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function joinUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, "")}${path}`;
}

function toRegisterAppInput(payload: ColineAppRegistrationPayload) {
  const notificationChannels = payload.manifest.notificationChannels.map((channel) => ({
    key: channel.key,
    name: channel.name,
    defaultDeliveries: [...channel.defaultDeliveries],
    defaultPriority: channel.defaultPriority,
    ...(channel.description ? { description: channel.description } : {}),
  }));

  const ui =
    payload.manifest.ui.mode || payload.manifest.ui.homePath || payload.manifest.ui.filePath
      ? {
          ...(payload.manifest.ui.mode
            ? { mode: payload.manifest.ui.mode }
            : {}),
          ...(payload.manifest.ui.homePath
            ? { homePath: payload.manifest.ui.homePath }
            : {}),
          ...(payload.manifest.ui.filePath
            ? { filePath: payload.manifest.ui.filePath }
            : {}),
        }
      : undefined;

  const manifest = {
    key: payload.manifest.key,
    name: payload.manifest.name,
    permissions: payload.manifest.permissions,
    notificationChannels,
    hosting: {
      mode: payload.manifest.hosting.mode,
      baseUrl: payload.manifest.hosting.baseUrl,
    },
    ...(ui ? { ui } : {}),
    ...(payload.manifest.description
      ? { description: payload.manifest.description }
      : {}),
    ...(payload.manifest.iconUrl ? { iconUrl: payload.manifest.iconUrl } : {}),
    ...(payload.manifest.kairo
      ? {
          kairo: JSON.parse(JSON.stringify(payload.manifest.kairo)) as Record<
            string,
            unknown
          >,
        }
      : {}),
  };

  const fileTypes = payload.fileTypes.map((fileType) => ({
    typeKey: fileType.typeKey,
    name: fileType.name,
    storage: fileType.storage,
    indexable: fileType.indexable,
    homeRenderMode: fileType.homeRenderMode,
    ...(fileType.description ? { description: fileType.description } : {}),
  }));

  return {
    version: payload.version,
    manifest,
    fileTypes,
  };
}

export class ColineApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string | undefined;
  private readonly fetchImpl: typeof fetch;
  private readonly defaultHeaders: HeadersInit | undefined;
  private readonly appPlatformClient: AppPlatformClient;
  private readonly maxRetries: number;
  private readonly debug: boolean;

  constructor(options: ColineApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.apiKey = options.apiKey;
    this.fetchImpl = options.fetch ?? fetch;
    this.defaultHeaders = options.headers;
    this.maxRetries = options.maxRetries ?? 0;
    this.debug = options.debug ?? false;
    this.appPlatformClient = createAppPlatformClient(options);
  }

  private async unwrapGeneratedResponse<T>(
    promise: Promise<{
      data?: { data: T };
      error?: ApiErrorPayload;
      response: Response;
    }>,
  ): Promise<T> {
    const { data, error, response } = await promise;

    if (error) {
      throw new ColineApiError({
        message: error.error?.message ?? `Request failed (${response.status}).`,
        type: "api",
        status: response.status,
        code: error.error?.code ?? null,
      });
    }

    if (data === undefined) {
      throw new ColineApiError({
        message: "Invalid API response.",
        type: "api",
        status: response.status,
      });
    }

    return data.data;
  }

  withApiKey(apiKey: string): ColineApiClient {
    const options: ColineApiClientOptions = {
      baseUrl: this.baseUrl,
      apiKey,
      fetch: this.fetchImpl,
      maxRetries: this.maxRetries,
      debug: this.debug,
    };

    if (this.defaultHeaders !== undefined) {
      options.headers = this.defaultHeaders;
    }

    return new ColineApiClient(options);
  }

  withHeaders(headers: HeadersInit): ColineApiClient {
    const mergedHeaders = new Headers(this.defaultHeaders);
    new Headers(headers).forEach((value, key) => mergedHeaders.set(key, value));

    const options: ColineApiClientOptions = {
      baseUrl: this.baseUrl,
      fetch: this.fetchImpl,
      headers: mergedHeaders,
      maxRetries: this.maxRetries,
      debug: this.debug,
    };

    if (this.apiKey !== undefined) {
      options.apiKey = this.apiKey;
    }

    return new ColineApiClient(options);
  }

  buildLoginWithColineAuthorizeUrl(input: {
    clientId: string;
    redirectUri: string;
    scope?: string;
    state?: string;
    codeChallenge?: string;
    codeChallengeMethod?: "S256" | "plain";
  }): string {
    const url = new URL("/api/v1/oauth/authorize", this.baseUrl);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", input.clientId);
    url.searchParams.set("redirect_uri", input.redirectUri);
    if (input.scope) {
      url.searchParams.set("scope", input.scope);
    }
    if (input.state) {
      url.searchParams.set("state", input.state);
    }
    if (input.codeChallenge) {
      url.searchParams.set("code_challenge", input.codeChallenge);
    }
    if (input.codeChallengeMethod) {
      url.searchParams.set("code_challenge_method", input.codeChallengeMethod);
    }
    return url.toString();
  }

  async listApps(): Promise<{ apps: RegisteredAppRecord[] }> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.GET("/api/v1/apps"),
    );
  }

  async getApp(appKey: string): Promise<{ app: RegisteredAppDetail }> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.GET("/api/v1/apps/{appKey}", {
        params: { path: { appKey } },
      }),
    );
  }

  async listAppVersions(
    appKey: string,
  ): Promise<{ versions: RegisteredAppVersionSummary[] }> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.GET("/api/v1/apps/{appKey}/versions", {
        params: { path: { appKey } },
      }),
    );
  }

  async registerApp(
    payload: ColineAppRegistrationPayloadInput,
  ): Promise<{ appId: string; appKey: string; versionId: string; version: string }> {
    const body = toRegisterAppInput(colineAppRegistrationPayloadSchema.parse(payload));

    return this.unwrapGeneratedResponse(
      this.appPlatformClient.POST("/api/v1/apps", {
        body,
      }),
    );
  }

  async createAppVersion(
    appKey: string,
    payload: ColineAppRegistrationPayloadInput,
  ): Promise<{ appId: string; appKey: string; versionId: string; version: string }> {
    const body = toRegisterAppInput(colineAppRegistrationPayloadSchema.parse(payload));

    return this.unwrapGeneratedResponse(
      this.appPlatformClient.POST("/api/v1/apps/{appKey}/versions", {
        params: { path: { appKey } },
        body,
      }),
    );
  }

  async submitAppVersionForReview(
    appKey: string,
    versionId: string,
    input: SubmitAppVersionForReviewInput = {},
  ): Promise<SubmitAppVersionForReviewResponse> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.POST(
        "/api/v1/apps/{appKey}/versions/{versionId}/submit",
        {
          params: { path: { appKey, versionId } },
          body: {
            ...(input.storeListed !== undefined
              ? { storeListed: input.storeListed }
              : {}),
          },
        },
      ),
    );
  }

  async listWorkspaceApps(workspaceSlug: string): Promise<WorkspaceAppsResponse> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.GET("/api/v1/workspaces/{workspaceSlug}/apps", {
        params: { path: { workspaceSlug } },
      }),
    );
  }

  async installWorkspaceApp(
    workspaceSlug: string,
    input: InstallWorkspaceAppInput,
  ): Promise<InstallWorkspaceAppResponse> {
    const grantedPermissions = input.grantedPermissions
      ? input.grantedPermissions.map((permission) =>
          appPermissionSchema.parse(permission),
        )
      : undefined;

    return this.unwrapGeneratedResponse(
      this.appPlatformClient.POST("/api/v1/workspaces/{workspaceSlug}/apps", {
        params: { path: { workspaceSlug } },
        body: {
          appId: input.appId,
          ...(input.pinnedVersionId
            ? { pinnedVersionId: input.pinnedVersionId }
            : {}),
          ...(grantedPermissions ? { grantedPermissions } : {}),
        },
      }),
    );
  }

  async getWorkspaceAppPermissions(
    workspaceSlug: string,
    appKey: string,
  ): Promise<WorkspaceAppPermissionsResponse> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.GET(
        "/api/v1/workspaces/{workspaceSlug}/apps/{appKey}/permissions",
        {
          params: { path: { workspaceSlug, appKey } },
        },
      ),
    );
  }

  async getWorkspaceInstalledApp(
    workspaceSlug: string,
    appKey: string,
  ): Promise<WorkspaceInstalledAppResponse> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.GET("/api/v1/workspaces/{workspaceSlug}/apps/{appKey}", {
        params: { path: { workspaceSlug, appKey } },
      }),
    );
  }

  async updateWorkspaceAppPermissions(
    workspaceSlug: string,
    appKey: string,
    input: UpdateWorkspaceAppPermissionsInput,
  ): Promise<WorkspaceAppPermissionsResponse> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.PUT(
        "/api/v1/workspaces/{workspaceSlug}/apps/{appKey}/permissions",
        {
          params: { path: { workspaceSlug, appKey } },
          body: {
            grantedPermissions: input.grantedPermissions.map((permission) =>
              appPermissionSchema.parse(permission),
            ),
          },
        },
      ),
    );
  }

  async uninstallWorkspaceApp(
    workspaceSlug: string,
    appKey: string,
  ): Promise<{ ok: true }> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.DELETE(
        "/api/v1/workspaces/{workspaceSlug}/apps/{appKey}",
        {
          params: { path: { workspaceSlug, appKey } },
        },
      ),
    );
  }

  async listWorkspaceAppSecrets(
    workspaceSlug: string,
    appKey: string,
  ): Promise<WorkspaceAppSecretsResponse> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.GET(
        "/api/v1/workspaces/{workspaceSlug}/apps/{appKey}/secrets",
        {
          params: { path: { workspaceSlug, appKey } },
        },
      ),
    );
  }

  async createWorkspaceAppSecret(
    workspaceSlug: string,
    appKey: string,
    input: CreateWorkspaceAppSecretInput,
  ): Promise<CreateWorkspaceAppSecretResponse> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.POST(
        "/api/v1/workspaces/{workspaceSlug}/apps/{appKey}/secrets",
        {
          params: { path: { workspaceSlug, appKey } },
          body: input,
        },
      ),
    );
  }

  async deleteWorkspaceAppSecret(
    workspaceSlug: string,
    appKey: string,
    secretId: string,
  ): Promise<{ ok: true }> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.DELETE(
        "/api/v1/workspaces/{workspaceSlug}/apps/{appKey}/secrets/{secretId}",
        {
          params: { path: { workspaceSlug, appKey, secretId } },
        },
      ),
    );
  }

  async listWorkspaceAppOauthConnections(
    workspaceSlug: string,
    appKey: string,
  ): Promise<WorkspaceAppOauthConnectionsResponse> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.GET(
        "/api/v1/workspaces/{workspaceSlug}/apps/{appKey}/oauth-connections",
        {
          params: { path: { workspaceSlug, appKey } },
        },
      ),
    );
  }

  async createWorkspaceAppOauthConnection(
    workspaceSlug: string,
    appKey: string,
    input: CreateWorkspaceAppOauthConnectionInput,
  ): Promise<CreateWorkspaceAppOauthConnectionResponse> {
    const body: {
      providerKey: string;
      accessToken: string;
      scopes: string[];
      externalAccountId?: string;
      refreshToken?: string;
      tokenExpiresAt?: string;
      metadata?: Record<string, unknown>;
    } = {
      providerKey: input.providerKey,
      accessToken: input.accessToken,
      scopes: input.scopes,
    };

    if (input.externalAccountId) {
      body.externalAccountId = input.externalAccountId;
    }
    if (input.refreshToken) {
      body.refreshToken = input.refreshToken;
    }
    if (input.tokenExpiresAt) {
      body.tokenExpiresAt = input.tokenExpiresAt;
    }
    if (input.metadata) {
      body.metadata = input.metadata;
    }

    return this.unwrapGeneratedResponse(
      this.appPlatformClient.POST(
        "/api/v1/workspaces/{workspaceSlug}/apps/{appKey}/oauth-connections",
        {
          params: { path: { workspaceSlug, appKey } },
          body,
        },
      ),
    );
  }

  async deleteWorkspaceAppOauthConnection(
    workspaceSlug: string,
    appKey: string,
    connectionId: string,
  ): Promise<{ ok: true }> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.DELETE(
        "/api/v1/workspaces/{workspaceSlug}/apps/{appKey}/oauth-connections/{connectionId}",
        {
          params: { path: { workspaceSlug, appKey, connectionId } },
        },
      ),
    );
  }

  async listWorkspaceAppDeliveries(
    workspaceSlug: string,
    appKey: string,
  ): Promise<WorkspaceAppDeliveriesResponse> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.GET(
        "/api/v1/workspaces/{workspaceSlug}/apps/{appKey}/deliveries",
        {
          params: { path: { workspaceSlug, appKey } },
        },
      ),
    );
  }

  async sendWorkspaceAppTestDelivery(
    workspaceSlug: string,
    appKey: string,
    input: SendWorkspaceAppTestDeliveryInput,
  ): Promise<SendWorkspaceAppTestDeliveryResponse> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.POST(
        "/api/v1/workspaces/{workspaceSlug}/apps/{appKey}/deliveries",
        {
          params: { path: { workspaceSlug, appKey } },
          body: input,
        },
      ),
    );
  }

  async replayWorkspaceAppDelivery(
    workspaceSlug: string,
    appKey: string,
    deliveryId: string,
  ): Promise<SendWorkspaceAppTestDeliveryResponse> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.POST(
        "/api/v1/workspaces/{workspaceSlug}/apps/{appKey}/deliveries/{deliveryId}/replay",
        {
          params: { path: { workspaceSlug, appKey, deliveryId } },
        },
      ),
    );
  }

  async emitAppAmbientEvents(
    workspaceSlug: string,
    appKey: string,
    input: EmitAmbientEventsInputInput,
  ): Promise<EmitAppAmbientEventsResponse> {
    const parsed = emitAmbientEventsInputSchema.parse(input);
    const body = {
      events: parsed.events.map((event) => ({
        sourceKind: event.sourceKind,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        dedupeKey: event.dedupeKey,
        payload: event.payload,
        metadata: event.metadata,
        schemaVersion: event.schemaVersion,
        ...(event.actorUserId ? { actorUserId: event.actorUserId } : {}),
        ...(event.containerType ? { containerType: event.containerType } : {}),
        ...(event.containerId ? { containerId: event.containerId } : {}),
        ...(event.occurredAt
          ? { occurredAt: event.occurredAt.toISOString() }
          : {}),
      })),
    };

    return this.unwrapGeneratedResponse(
      this.appPlatformClient.POST(
        "/api/v1/workspaces/{workspaceSlug}/apps/{appKey}/ambient/events",
        {
          params: { path: { workspaceSlug, appKey } },
          body,
        },
      ),
    );
  }

  async createAppNotification(
    workspaceSlug: string,
    appKey: string,
    input: CreateNotificationInputInput,
  ): Promise<OkResponse> {
    const parsed = createNotificationInputSchema.parse(input);
    const body = {
      channelKey: parsed.channelKey,
      typeKey: parsed.typeKey,
      recipients: parsed.recipients.map((recipient) => ({
        userId: recipient.userId,
      })),
      title: parsed.title,
      priority: parsed.priority,
      metadata: parsed.metadata,
      ...(parsed.body ? { body: parsed.body } : {}),
      ...(parsed.targetUrl ? { targetUrl: parsed.targetUrl } : {}),
      ...(parsed.icon ? { icon: parsed.icon } : {}),
      ...(parsed.dedupeKey ? { dedupeKey: parsed.dedupeKey } : {}),
    };

    return this.unwrapGeneratedResponse(
      this.appPlatformClient.POST(
        "/api/v1/workspaces/{workspaceSlug}/apps/{appKey}/notifications",
        {
          params: { path: { workspaceSlug, appKey } },
          body,
        },
      ),
    );
  }

  async upsertAppIndexDocuments(
    workspaceSlug: string,
    appKey: string,
    input: BatchUpsertAppIndexDocumentsInput,
  ): Promise<UpsertAppIndexDocumentsResponse> {
    const parsed = batchUpsertAppIndexDocumentsSchema.parse(input);
    const body = {
      documents: parsed.documents.map((document) => ({
        documentKey: document.documentKey,
        documentType: document.documentType,
        title: document.title,
        body: document.body,
        metadata: document.metadata,
        visibilityMode: document.visibilityMode,
        visibility: document.visibility.map((grant) => ({
          subjectType: grant.subjectType,
          subjectId: grant.subjectId,
        })),
        ...(document.fileId ? { fileId: document.fileId } : {}),
        ...(document.url ? { url: document.url } : {}),
      })),
    };

    return this.unwrapGeneratedResponse(
      this.appPlatformClient.POST(
        "/api/v1/workspaces/{workspaceSlug}/apps/{appKey}/index-documents",
        {
          params: { path: { workspaceSlug, appKey } },
          body,
        },
      ),
    );
  }

  async deleteAppIndexDocuments(
    workspaceSlug: string,
    appKey: string,
    input: BatchDeleteAppIndexDocumentsInput,
  ): Promise<DeleteAppIndexDocumentsResponse> {
    const body = batchDeleteAppIndexDocumentsSchema.parse(input);

    return this.unwrapGeneratedResponse(
      this.appPlatformClient.DELETE(
        "/api/v1/workspaces/{workspaceSlug}/apps/{appKey}/index-documents",
        {
          params: { path: { workspaceSlug, appKey } },
          body,
        },
      ),
    );
  }

  async listAppFiles(
    workspaceSlug: string,
    appKey: string,
    query?: ListAppFilesQuery,
  ): Promise<AppFilesListResponse> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.GET(
        "/api/v1/workspaces/{workspaceSlug}/apps/{appKey}/files",
        {
          params: {
            path: { workspaceSlug, appKey },
            ...(query
              ? {
                  query: {
                    ...(query.driveId ? { driveId: query.driveId } : {}),
                    ...(query.typeKey ? { typeKey: query.typeKey } : {}),
                    ...(query.limit !== undefined ? { limit: query.limit } : {}),
                  },
                }
              : {}),
          },
        },
      ),
    );
  }

  async createAppFile(
    workspaceSlug: string,
    appKey: string,
    input: CreateAppFileInput,
  ): Promise<CreateAppFileResponse> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.POST(
        "/api/v1/workspaces/{workspaceSlug}/apps/{appKey}/files",
        {
          params: { path: { workspaceSlug, appKey } },
          body: {
            name: input.name,
            ...(input.typeKey ? { typeKey: input.typeKey } : {}),
            ...(input.driveId ? { driveId: input.driveId } : {}),
            ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
            ...(input.document ? { document: input.document } : {}),
          },
        },
      ),
    );
  }

  async executeAppAction(
    workspaceSlug: string,
    appKey: string,
    input: ExecuteAppActionInput,
  ): Promise<ExecuteAppActionResponse> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.POST(
        "/api/v1/workspaces/{workspaceSlug}/apps/{appKey}/actions",
        {
          params: { path: { workspaceSlug, appKey } },
          body: {
            action: {
              type: input.action.type,
              ...(input.action.payload ? { payload: input.action.payload } : {}),
            },
            ...(input.fileId !== undefined ? { fileId: input.fileId } : {}),
          },
        },
      ),
    );
  }

  async getAppFileDocument(
    workspaceSlug: string,
    appKey: string,
    fileId: string,
  ): Promise<AppFileDocumentResponse> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.GET(
        "/api/v1/workspaces/{workspaceSlug}/apps/{appKey}/files/{fileId}",
        {
          params: { path: { workspaceSlug, appKey, fileId } },
        },
      ),
    );
  }

  async updateAppFileDocument(
    workspaceSlug: string,
    appKey: string,
    fileId: string,
    document: Record<string, unknown>,
  ): Promise<AppFileDocumentUpdateResponse> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.PATCH(
        "/api/v1/workspaces/{workspaceSlug}/apps/{appKey}/files/{fileId}",
        {
          params: { path: { workspaceSlug, appKey, fileId } },
          body: { document },
        },
      ),
    );
  }

  async deleteAppFile(
    workspaceSlug: string,
    appKey: string,
    fileId: string,
  ): Promise<OkResponse> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.DELETE(
        "/api/v1/workspaces/{workspaceSlug}/apps/{appKey}/files/{fileId}",
        {
          params: { path: { workspaceSlug, appKey, fileId } },
        },
      ),
    );
  }

  async listTabModels(): Promise<TabModelsResponse> {
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.GET("/api/v1/tab/models"),
    );
  }

  async createTabChatCompletion(
    input: TabChatCompletionInput,
  ): Promise<TabChatCompletionResponse> {
    const body = {
      model: input.model ?? "tab-v1",
      stream: false as const,
      tab_context: input.tab_context as Record<string, unknown>,
      ...(input.messages !== undefined ? { messages: input.messages } : {}),
      ...(input.max_tokens !== undefined ? { max_tokens: input.max_tokens } : {}),
      ...(input.temperature !== undefined ? { temperature: input.temperature } : {}),
      ...(input.top_p !== undefined ? { top_p: input.top_p } : {}),
    };
    return this.unwrapGeneratedResponse(
      this.appPlatformClient.POST("/api/v1/tab/chat/completions", { body }),
    );
  }

  /**
   * Stream a Tab chat completion as an async generator of SSE chunks.
   *
   * @example
   * ```ts
   * const stream = client.streamTabChatCompletion({
   *   tab_context: {
   *     surface: "docs",
   *     workspace_slug: "acme",
   *     entity_id: "doc_123",
   *     active_text_before_cursor: "The quick brown ",
   *   },
   * });
   *
   * for await (const chunk of stream) {
   *   process.stdout.write(chunk.choices[0]?.delta.content ?? "");
   * }
   * ```
   */
  async *streamTabChatCompletion(
    input: TabChatCompletionInput,
  ): AsyncGenerator<TabChatCompletionChunk, void, undefined> {
    const url = joinUrl(this.baseUrl, "/api/v1/tab/chat/completions");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    };
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    if (this.defaultHeaders) {
      new Headers(this.defaultHeaders).forEach((v, k) => {
        headers[k] = v;
      });
    }

    const response = await this.fetchImpl(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...input, stream: true }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
      throw new ColineApiError({
        message: payload?.error?.message ?? `Request failed (${response.status}).`,
        type: "api",
        status: response.status,
        code: payload?.error?.code ?? null,
      });
    }

    if (!response.body) {
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") return;

          try {
            const chunk = JSON.parse(data) as TabChatCompletionChunk;
            yield chunk;
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Stream a Tab chat completion and yield only the text content.
   *
   * @example
   * ```ts
   * for await (const text of client.streamTabText({
   *   tab_context: {
   *     surface: "notes",
   *     workspace_slug: "acme",
   *     entity_id: "note_123",
   *     active_text_before_cursor: "Today I need to ",
   *   },
   * })) {
   *   process.stdout.write(text);
   * }
   * ```
   */
  async *streamTabText(
    input: TabChatCompletionInput,
  ): AsyncGenerator<string, void, undefined> {
    for await (const chunk of this.streamTabChatCompletion(input)) {
      const content = chunk.choices[0]?.delta.content;
      if (content) yield content;
    }
  }

  async exchangeOAuthCode(input: {
    clientId: string;
    clientSecret: string;
    code: string;
    redirectUri: string;
    codeVerifier?: string;
  }): Promise<OAuthTokenResponse> {
    const response = await this.fetchImpl(joinUrl(this.baseUrl, "/api/v1/oauth/token"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: input.clientId,
        client_secret: input.clientSecret,
        code: input.code,
        redirect_uri: input.redirectUri,
        ...(input.codeVerifier ? { code_verifier: input.codeVerifier } : {}),
      }),
    });

    return parseJsonResponse<OAuthTokenResponse>(response);
  }

  async getOAuthUserInfo(accessToken: string): Promise<OAuthUserInfoResponse> {
    const response = await this.fetchImpl(joinUrl(this.baseUrl, "/api/v1/oauth/userinfo"), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return parseJsonResponse<OAuthUserInfoResponse>(response);
  }

  // ---------------------------------------------------------------------------
  // Core Platform API — internal fetch helper
  // ---------------------------------------------------------------------------

  private async coreRequest<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = joinUrl(this.baseUrl, path);
    const headers: Record<string, string> = {};
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    if (this.defaultHeaders) {
      new Headers(this.defaultHeaders).forEach((v, k) => {
        headers[k] = v;
      });
    }

    const requestInit: RequestInit = {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    };

    if (this.debug) {
      console.debug(`[coline-sdk] ${method} ${path}`, body !== undefined ? { body } : "");
    }

    let lastError: ColineApiError | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        // Exponential backoff: 500ms, 1s, 2s, 4s ...
        const delayMs = Math.min(500 * Math.pow(2, attempt - 1), 30_000);
        if (this.debug) {
          console.debug(`[coline-sdk] retry ${attempt}/${this.maxRetries} after ${delayMs}ms`);
        }
        await sleep(delayMs);
      }

      const response = await this.fetchImpl(url, requestInit);

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
        const error = new ColineApiError({
          message:
            payload?.error?.message ?? `Request failed (${response.status}).`,
          type: "api",
          status: response.status,
          code: payload?.error?.code ?? null,
        });

        // Retry on 429 (rate limit) and 5xx (server errors)
        if (isRetryableStatus(response.status) && attempt < this.maxRetries) {
          lastError = error;
          continue;
        }

        if (this.debug) {
          console.debug(`[coline-sdk] ${method} ${path} → ${response.status}`, payload);
        }

        throw error;
      }

      const json = (await response.json().catch(() => null)) as {
        data: T;
      } | null;

      if (!json || !("data" in json)) {
        throw new ColineApiError({
          message: "Invalid API response.",
          type: "api",
          status: response.status,
        });
      }

      if (this.debug) {
        console.debug(`[coline-sdk] ${method} ${path} → ${response.status} OK`);
      }

      return json.data;
    }

    // Should not reach here, but safety net
    throw lastError ?? new ColineApiError({
      message: "Max retries exceeded.",
      type: "api",
      status: 0,
    });
  }

  /**
   * Like `coreRequest` but accepts a raw `BodyInit` and custom Content-Type.
   * Used for binary uploads.
   */
  private async coreRawRequest<T>(
    method: string,
    path: string,
    body: BodyInit | undefined,
    contentType?: string,
  ): Promise<T> {
    const url = joinUrl(this.baseUrl, path);
    const headers: Record<string, string> = {};
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }
    if (contentType) {
      headers["Content-Type"] = contentType;
    }
    if (this.defaultHeaders) {
      new Headers(this.defaultHeaders).forEach((v, k) => {
        headers[k] = v;
      });
    }

    const response = await this.fetchImpl(url, {
      method,
      headers,
      ...(body !== undefined ? { body } : {}),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;
      throw new ColineApiError({
        message: payload?.error?.message ?? `Request failed (${response.status}).`,
        type: "api",
        status: response.status,
        code: payload?.error?.code ?? null,
      });
    }

    const json = (await response.json().catch(() => null)) as { data: T } | null;
    if (!json || !("data" in json)) {
      throw new ColineApiError({
        message: "Invalid API response.",
        type: "api",
        status: response.status,
      });
    }

    return json.data;
  }

  // ---------------------------------------------------------------------------
  // Core Platform API — Workspace Members
  // ---------------------------------------------------------------------------

  async listWorkspaceMembers(
    workspaceId: string,
  ): Promise<WorkspaceMembersResponse> {
    return this.coreRequest<WorkspaceMembersResponse>(
      "GET",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/members`,
    );
  }

  async listMyWorkspaces(): Promise<MyWorkspacesResponse> {
    return this.coreRequest<MyWorkspacesResponse>(
      "GET",
      "/api/v1/me/workspaces",
    );
  }

  // ---------------------------------------------------------------------------
  // Core Platform API — Notes
  // ---------------------------------------------------------------------------

  async listWorkspaceNotes(
    workspaceId: string,
    query?: ListWorkspaceNotesQuery,
  ): Promise<WorkspaceNotesListResponse> {
    const params = new URLSearchParams();
    if (query?.q) params.set("q", query.q);
    if (query?.limit !== undefined) params.set("limit", String(query.limit));
    if (query?.cursor) params.set("cursor", query.cursor);
    const qs = params.toString();
    return this.coreRequest<WorkspaceNotesListResponse>(
      "GET",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/notes${qs ? `?${qs}` : ""}`,
    );
  }

  async createWorkspaceNote(
    workspaceId: string,
    input: CreateWorkspaceNoteInput,
  ): Promise<WorkspaceNoteResponse> {
    return this.coreRequest<WorkspaceNoteResponse>(
      "POST",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/notes`,
      {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.body !== undefined ? { body: input.body } : {}),
        ...(input.blocks !== undefined ? { blocks: input.blocks } : {}),
        ...(input.driveId !== undefined ? { driveId: input.driveId } : {}),
        ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
      },
    );
  }

  async getWorkspaceNote(
    workspaceId: string,
    noteId: string,
  ): Promise<WorkspaceNoteDetailResponse> {
    return this.coreRequest<WorkspaceNoteDetailResponse>(
      "GET",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/notes/${encodeURIComponent(noteId)}`,
    );
  }

  async updateWorkspaceNote(
    workspaceId: string,
    noteId: string,
    input: UpdateWorkspaceNoteInput,
  ): Promise<WorkspaceNoteResponse> {
    return this.coreRequest<WorkspaceNoteResponse>(
      "PUT",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/notes/${encodeURIComponent(noteId)}`,
      input,
    );
  }

  async deleteWorkspaceNote(
    workspaceId: string,
    noteId: string,
  ): Promise<{ ok: true }> {
    return this.coreRequest<{ ok: true }>(
      "DELETE",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/notes/${encodeURIComponent(noteId)}`,
    );
  }

  // ---------------------------------------------------------------------------
  // Core Platform API — Docs
  // ---------------------------------------------------------------------------

  async listWorkspaceDocs(
    workspaceId: string,
    query?: ListWorkspaceDocsQuery,
  ): Promise<WorkspaceDocsListResponse> {
    const params = new URLSearchParams();
    if (query?.q) params.set("q", query.q);
    if (query?.limit !== undefined) params.set("limit", String(query.limit));
    if (query?.cursor) params.set("cursor", query.cursor);
    const qs = params.toString();
    return this.coreRequest<WorkspaceDocsListResponse>(
      "GET",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/docs${qs ? `?${qs}` : ""}`,
    );
  }

  async createWorkspaceDoc(
    workspaceId: string,
    input: CreateWorkspaceDocInput,
  ): Promise<WorkspaceDocResponse> {
    return this.coreRequest<WorkspaceDocResponse>(
      "POST",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/docs`,
      {
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.content !== undefined ? { content: input.content } : {}),
        ...(input.layout !== undefined ? { layout: input.layout } : {}),
        ...(input.driveId !== undefined ? { driveId: input.driveId } : {}),
        ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
      },
    );
  }

  async getWorkspaceDoc(
    workspaceId: string,
    docId: string,
  ): Promise<WorkspaceDocDetailResponse> {
    return this.coreRequest<WorkspaceDocDetailResponse>(
      "GET",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/docs/${encodeURIComponent(docId)}`,
    );
  }

  async updateWorkspaceDoc(
    workspaceId: string,
    docId: string,
    input: UpdateWorkspaceDocInput,
  ): Promise<WorkspaceDocDetailResponse> {
    return this.coreRequest<WorkspaceDocDetailResponse>(
      "PATCH",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/docs/${encodeURIComponent(docId)}`,
      input,
    );
  }

  async deleteWorkspaceDoc(
    workspaceId: string,
    docId: string,
  ): Promise<{ ok: true }> {
    return this.coreRequest<{ ok: true }>(
      "DELETE",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/docs/${encodeURIComponent(docId)}`,
    );
  }

  // ---------------------------------------------------------------------------
  // Core Platform API — Drives
  // ---------------------------------------------------------------------------

  async listWorkspaceDrives(
    workspaceId: string,
  ): Promise<WorkspaceDrivesListResponse> {
    return this.coreRequest<WorkspaceDrivesListResponse>(
      "GET",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/drives`,
    );
  }

  // ---------------------------------------------------------------------------
  // Core Platform API — Files
  // ---------------------------------------------------------------------------

  async listDriveFiles(
    workspaceId: string,
    driveId: string,
    query?: ListDriveFilesQuery,
  ): Promise<DriveFilesListResponse> {
    const params = new URLSearchParams();
    if (query?.parentId) params.set("parentId", query.parentId);
    if (query?.fileType) params.set("fileType", query.fileType);
    if (query?.trashed !== undefined) params.set("trashed", String(query.trashed));
    if (query?.limit !== undefined) params.set("limit", String(query.limit));
    if (query?.cursor) params.set("cursor", query.cursor);
    const qs = params.toString();
    return this.coreRequest<DriveFilesListResponse>(
      "GET",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/drives/${encodeURIComponent(driveId)}/files${qs ? `?${qs}` : ""}`,
    );
  }

  async getFile(
    workspaceId: string,
    fileId: string,
  ): Promise<FileDetailResponse> {
    return this.coreRequest<FileDetailResponse>(
      "GET",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/files/${encodeURIComponent(fileId)}`,
    );
  }

  async updateFile(
    workspaceId: string,
    fileId: string,
    input: UpdateFileInput,
  ): Promise<FileDetailResponse> {
    return this.coreRequest<FileDetailResponse>(
      "PATCH",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/files/${encodeURIComponent(fileId)}`,
      input,
    );
  }

  async deleteFile(
    workspaceId: string,
    fileId: string,
  ): Promise<{ ok: true }> {
    return this.coreRequest<{ ok: true }>(
      "DELETE",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/files/${encodeURIComponent(fileId)}`,
    );
  }

  // ---------------------------------------------------------------------------
  // Core Platform API — Channels
  // ---------------------------------------------------------------------------

  async listWorkspaceChannels(
    workspaceId: string,
  ): Promise<ChannelListResponse> {
    return this.coreRequest<ChannelListResponse>(
      "GET",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/channels`,
    );
  }

  async listChannelMessages(
    workspaceId: string,
    channelId: string,
    options?: { limit?: number; cursor?: string },
  ): Promise<MessagesListResponse> {
    const params = new URLSearchParams();
    if (options?.limit !== undefined) params.set("limit", String(options.limit));
    if (options?.cursor) params.set("cursor", options.cursor);
    const qs = params.toString();
    return this.coreRequest<MessagesListResponse>(
      "GET",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/channels/${encodeURIComponent(channelId)}/messages${qs ? `?${qs}` : ""}`,
    );
  }

  // ---------------------------------------------------------------------------
  // Core Platform API — Direct Messages
  // ---------------------------------------------------------------------------

  async listWorkspaceDms(
    workspaceId: string,
  ): Promise<DmListResponse> {
    return this.coreRequest<DmListResponse>(
      "GET",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/dms`,
    );
  }

  async listDmMessages(
    workspaceId: string,
    dmId: string,
    options?: { limit?: number; cursor?: string },
  ): Promise<MessagesListResponse> {
    const params = new URLSearchParams();
    if (options?.limit !== undefined) params.set("limit", String(options.limit));
    if (options?.cursor) params.set("cursor", options.cursor);
    const qs = params.toString();
    return this.coreRequest<MessagesListResponse>(
      "GET",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/dms/${encodeURIComponent(dmId)}/messages${qs ? `?${qs}` : ""}`,
    );
  }

  async sendDmMessage(
    workspaceId: string,
    dmId: string,
    input: SendMessageInput,
  ): Promise<SendMessageResponse> {
    return this.coreRequest<SendMessageResponse>(
      "POST",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/dms/${encodeURIComponent(dmId)}/messages`,
      input,
    );
  }

  async sendChannelMessage(
    workspaceId: string,
    channelId: string,
    input: SendMessageInput,
  ): Promise<SendMessageResponse> {
    return this.coreRequest<SendMessageResponse>(
      "POST",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/channels/${encodeURIComponent(channelId)}/messages`,
      input,
    );
  }

  // ---------------------------------------------------------------------------
  // Core Platform API — Messages (cross-container)
  // ---------------------------------------------------------------------------

  async getMessage(
    workspaceId: string,
    messageId: string,
  ): Promise<MessageDetailResponse> {
    return this.coreRequest<MessageDetailResponse>(
      "GET",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/messages/${encodeURIComponent(messageId)}`,
    );
  }

  async editMessage(
    workspaceId: string,
    messageId: string,
    input: EditMessageInput,
  ): Promise<MessageDetailResponse> {
    return this.coreRequest<MessageDetailResponse>(
      "PATCH",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/messages/${encodeURIComponent(messageId)}`,
      input,
    );
  }

  async deleteMessage(
    workspaceId: string,
    messageId: string,
  ): Promise<{ ok: true }> {
    return this.coreRequest<{ ok: true }>(
      "DELETE",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/messages/${encodeURIComponent(messageId)}`,
    );
  }

  async getThread(
    workspaceId: string,
    messageId: string,
  ): Promise<ThreadResponse> {
    return this.coreRequest<ThreadResponse>(
      "GET",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/messages/${encodeURIComponent(messageId)}/thread`,
    );
  }

  async replyToThread(
    workspaceId: string,
    messageId: string,
    input: ThreadReplyInput,
  ): Promise<SendMessageResponse> {
    return this.coreRequest<SendMessageResponse>(
      "POST",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/messages/${encodeURIComponent(messageId)}/thread`,
      input,
    );
  }

  async addReaction(
    workspaceId: string,
    messageId: string,
    emoji: string,
  ): Promise<ReactionResponse> {
    return this.coreRequest<ReactionResponse>(
      "PUT",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/messages/${encodeURIComponent(messageId)}/reactions/${encodeURIComponent(emoji)}`,
    );
  }

  async removeReaction(
    workspaceId: string,
    messageId: string,
    emoji: string,
  ): Promise<{ ok: true }> {
    return this.coreRequest<{ ok: true }>(
      "DELETE",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/messages/${encodeURIComponent(messageId)}/reactions/${encodeURIComponent(emoji)}`,
    );
  }

  async pinMessage(
    workspaceId: string,
    messageId: string,
  ): Promise<PinResponse> {
    return this.coreRequest<PinResponse>(
      "PUT",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/messages/${encodeURIComponent(messageId)}/pin`,
    );
  }

  async unpinMessage(
    workspaceId: string,
    messageId: string,
  ): Promise<PinResponse> {
    return this.coreRequest<PinResponse>(
      "DELETE",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/messages/${encodeURIComponent(messageId)}/pin`,
    );
  }

  // ---------------------------------------------------------------------------
  // Core Platform API — Calendar Events
  // ---------------------------------------------------------------------------

  async listCalendarEvents(
    workspaceId: string,
    range: { start: string; end: string },
  ): Promise<CalendarEventsListResponse> {
    const params = new URLSearchParams({
      start: range.start,
      end: range.end,
    });
    return this.coreRequest<CalendarEventsListResponse>(
      "GET",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/calendar/events?${params}`,
    );
  }

  async createCalendarEvent(
    workspaceId: string,
    input: CreateCalendarEventInput,
  ): Promise<CalendarEventDetailResponse> {
    return this.coreRequest<CalendarEventDetailResponse>(
      "POST",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/calendar/events`,
      input,
    );
  }

  async getCalendarEvent(
    workspaceId: string,
    eventId: string,
  ): Promise<CalendarEventDetailResponse> {
    return this.coreRequest<CalendarEventDetailResponse>(
      "GET",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/calendar/events/${encodeURIComponent(eventId)}`,
    );
  }

  async updateCalendarEvent(
    workspaceId: string,
    eventId: string,
    input: UpdateCalendarEventInput,
  ): Promise<CalendarEventDetailResponse> {
    return this.coreRequest<CalendarEventDetailResponse>(
      "PATCH",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/calendar/events/${encodeURIComponent(eventId)}`,
      input,
    );
  }

  async deleteCalendarEvent(
    workspaceId: string,
    eventId: string,
  ): Promise<{ ok: true }> {
    return this.coreRequest<{ ok: true }>(
      "DELETE",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/calendar/events/${encodeURIComponent(eventId)}`,
    );
  }

  // ---------------------------------------------------------------------------
  // Core Platform API — Search
  // ---------------------------------------------------------------------------

  async searchWorkspace(
    workspaceId: string,
    input: WorkspaceSearchInput,
  ): Promise<WorkspaceSearchResponse> {
    return this.coreRequest<WorkspaceSearchResponse>(
      "POST",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/search`,
      input,
    );
  }

  // ---------------------------------------------------------------------------
  // Core Platform API — Taskboards
  // ---------------------------------------------------------------------------

  async listWorkspaceTaskboards(
    workspaceId: string,
  ): Promise<WorkspaceTaskboardsResponse> {
    return this.coreRequest<WorkspaceTaskboardsResponse>(
      "GET",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/taskboards`,
    );
  }

  // ---------------------------------------------------------------------------
  // Core Platform API — Tasks
  // ---------------------------------------------------------------------------

  async listTaskboardTasks(
    workspaceId: string,
    taskboardId: string,
    query?: ListTaskboardTasksQuery,
  ): Promise<TaskboardTasksResponse> {
    const params = new URLSearchParams();
    if (query?.q) params.set("q", query.q);
    if (query?.statusId) params.set("statusId", query.statusId);
    if (query?.assigneeUserId) params.set("assigneeUserId", query.assigneeUserId);
    if (query?.limit !== undefined) params.set("limit", String(query.limit));
    const qs = params.toString();
    return this.coreRequest<TaskboardTasksResponse>(
      "GET",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/taskboards/${encodeURIComponent(taskboardId)}/tasks${qs ? `?${qs}` : ""}`,
    );
  }

  async createTaskboardTask(
    workspaceId: string,
    taskboardId: string,
    input: CreateTaskInput,
  ): Promise<CreateTaskResponse> {
    return this.coreRequest<CreateTaskResponse>(
      "POST",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/taskboards/${encodeURIComponent(taskboardId)}/tasks`,
      input,
    );
  }

  async getTaskboardTask(
    workspaceId: string,
    taskboardId: string,
    taskId: string,
  ): Promise<TaskDetailResponse> {
    return this.coreRequest<TaskDetailResponse>(
      "GET",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/taskboards/${encodeURIComponent(taskboardId)}/tasks/${encodeURIComponent(taskId)}`,
    );
  }

  async updateTaskboardTask(
    workspaceId: string,
    taskboardId: string,
    taskId: string,
    input: UpdateTaskInput,
  ): Promise<{ ok: true }> {
    return this.coreRequest<{ ok: true }>(
      "PATCH",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/taskboards/${encodeURIComponent(taskboardId)}/tasks/${encodeURIComponent(taskId)}`,
      input,
    );
  }

  async deleteTaskboardTask(
    workspaceId: string,
    taskboardId: string,
    taskId: string,
  ): Promise<{ ok: true }> {
    return this.coreRequest<{ ok: true }>(
      "DELETE",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/taskboards/${encodeURIComponent(taskboardId)}/tasks/${encodeURIComponent(taskId)}`,
    );
  }

  // ---------------------------------------------------------------------------
  // File Uploads
  // ---------------------------------------------------------------------------

  /**
   * Start a multipart upload. Returns an `uploadId` and the expected `partCount`.
   */
  async initiateUpload(
    workspaceId: string,
    input: InitiateUploadInput,
  ): Promise<InitiateUploadResponse> {
    return this.coreRequest<InitiateUploadResponse>(
      "POST",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/uploads/initiate`,
      {
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        driveId: input.driveId,
        ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
      },
    );
  }

  /**
   * Upload a single part of a multipart upload.
   */
  async uploadPart(
    workspaceId: string,
    uploadId: string,
    partNumber: number,
    data: Uint8Array | ArrayBuffer | Blob,
  ): Promise<UploadPartResponse> {
    const qs = new URLSearchParams({
      uploadId,
      partNumber: String(partNumber),
    });
    let body: Blob;
    if (data instanceof Blob) {
      body = data;
    } else if (data instanceof ArrayBuffer) {
      body = new Blob([data]);
    } else {
      // Uint8Array — extract the underlying ArrayBuffer slice
      body = new Blob([(data.buffer as ArrayBuffer).slice(data.byteOffset, data.byteOffset + data.byteLength)]);
    }
    return this.coreRawRequest<UploadPartResponse>(
      "POST",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/uploads/part?${qs}`,
      body,
      "application/octet-stream",
    );
  }

  /**
   * Finalize a multipart upload and create the file in the workspace drive.
   */
  async completeUpload(
    workspaceId: string,
    uploadId: string,
    parts: CompletedUploadPart[],
  ): Promise<CompleteUploadResponse> {
    return this.coreRequest<CompleteUploadResponse>(
      "POST",
      `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/uploads/complete`,
      { uploadId, parts },
    );
  }

  /**
   * Upload a file in one call. Handles chunking, multipart upload, and
   * finalization automatically.
   *
   * @example
   * ```ts
   * const file = await client.uploadFile("ws_123", {
   *   data: myBlob,
   *   fileName: "report.pdf",
   *   mimeType: "application/pdf",
   *   driveId: "drive_abc",
   * });
   * console.log(file.file.id);
   * ```
   */
  async uploadFile(
    workspaceId: string,
    input: UploadFileInput,
  ): Promise<CompleteUploadResponse> {
    const bytes =
      input.data instanceof Blob
        ? new Uint8Array(await input.data.arrayBuffer())
        : input.data instanceof ArrayBuffer
          ? new Uint8Array(input.data)
          : input.data;

    const initInput: InitiateUploadInput = {
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: bytes.byteLength,
      driveId: input.driveId,
    };
    if (input.parentId !== undefined) {
      initInput.parentId = input.parentId;
    }
    const { uploadId, partCount } = await this.initiateUpload(workspaceId, initInput);

    const partSize = Math.ceil(bytes.byteLength / partCount);
    const completedParts: CompletedUploadPart[] = [];

    for (let i = 0; i < partCount; i++) {
      const start = i * partSize;
      const end = Math.min(start + partSize, bytes.byteLength);
      const chunk = bytes.slice(start, end);
      const part = await this.uploadPart(workspaceId, uploadId, i + 1, chunk);
      completedParts.push({ partNumber: part.partNumber, etag: part.etag });
    }

    return this.completeUpload(workspaceId, uploadId, completedParts);
  }

  // ---------------------------------------------------------------------------
  // Batch Task Operations
  // ---------------------------------------------------------------------------

  /**
   * Create multiple tasks concurrently. Returns results in the same order as
   * the input array, with each entry indicating success or failure.
   *
   * @example
   * ```ts
   * const results = await client.batchCreateTasks("ws_123", "board_456", [
   *   { title: "Task A" },
   *   { title: "Task B", priority: "high" },
   * ]);
   * ```
   */
  async batchCreateTasks(
    workspaceId: string,
    taskboardId: string,
    tasks: CreateTaskInput[],
  ): Promise<BatchResultEntry<CreateTaskResponse>[]> {
    const settled = await Promise.allSettled(
      tasks.map((task) =>
        this.createTaskboardTask(workspaceId, taskboardId, task),
      ),
    );
    return settled.map((r) =>
      r.status === "fulfilled"
        ? { status: "fulfilled" as const, value: r.value }
        : { status: "rejected" as const, reason: String(r.reason) },
    );
  }

  /**
   * Update multiple tasks concurrently.
   */
  async batchUpdateTasks(
    workspaceId: string,
    taskboardId: string,
    updates: BatchUpdateTaskEntry[],
  ): Promise<BatchResultEntry<{ ok: true }>[]> {
    const settled = await Promise.allSettled(
      updates.map(({ taskId, ...input }) =>
        this.updateTaskboardTask(workspaceId, taskboardId, taskId, input),
      ),
    );
    return settled.map((r) =>
      r.status === "fulfilled"
        ? { status: "fulfilled" as const, value: r.value }
        : { status: "rejected" as const, reason: String(r.reason) },
    );
  }

  /**
   * Delete multiple tasks concurrently.
   */
  async batchDeleteTasks(
    workspaceId: string,
    taskboardId: string,
    taskIds: string[],
  ): Promise<BatchResultEntry<{ ok: true }>[]> {
    const settled = await Promise.allSettled(
      taskIds.map((taskId) =>
        this.deleteTaskboardTask(workspaceId, taskboardId, taskId),
      ),
    );
    return settled.map((r) =>
      r.status === "fulfilled"
        ? { status: "fulfilled" as const, value: r.value }
        : { status: "rejected" as const, reason: String(r.reason) },
    );
  }

  // ---------------------------------------------------------------------------
  // Workspace-scoped client
  // ---------------------------------------------------------------------------

  /**
   * Returns a publisher-scoped handle for a specific app key.
   *
   * @example
   * ```ts
   * const app = coline.app("com.example.notes");
   * const versions = await app.listVersions();
   * await app.submitVersionForReview("ver_123", { storeListed: true });
   * ```
   */
  app(appKey: string): PublishedAppHandle {
    return new PublishedAppHandle(this, appKey);
  }

  /**
   * Returns a workspace-scoped client that drops the `workspaceId` first
   * argument from every workspace method.
   *
   * @example
   * ```ts
   * const ws = coline.workspace("ws_abc123");
   * const notes = await ws.listNotes({ limit: 10 });
   * const thread = await ws.getThread(messageId);
   * for await (const note of ws.paginateNotes()) {
   *   console.log(note.title);
   * }
   * ```
   */
  workspace(workspaceId: string): ColineWorkspace {
    return new ColineWorkspace(this, workspaceId);
  }
}

// ---------------------------------------------------------------------------
// Workspace-scoped client — removes workspaceId boilerplate
// ---------------------------------------------------------------------------

/**
 * A convenience wrapper around `ColineApiClient` that binds a workspace ID
 * so you don't have to pass it to every call.
 *
 * Get one via `client.workspace("ws_abc123")`.
 */
export class ColineWorkspace {
  constructor(
    private readonly client: ColineApiClient,
    readonly workspaceId: string,
  ) {}

  // -- Installed Apps & App Runtime -----------------------------------------

  listApps() {
    return this.client.listWorkspaceApps(this.workspaceId);
  }

  installApp(input: InstallWorkspaceAppInput) {
    return this.client.installWorkspaceApp(this.workspaceId, input);
  }

  // -- Members ---------------------------------------------------------------

  listMembers() {
    return this.client.listWorkspaceMembers(this.workspaceId);
  }

  // -- Notes -----------------------------------------------------------------

  listNotes(query?: ListWorkspaceNotesQuery) {
    return this.client.listWorkspaceNotes(this.workspaceId, query);
  }

  createNote(input: CreateWorkspaceNoteInput) {
    return this.client.createWorkspaceNote(this.workspaceId, input);
  }

  getNote(noteId: string) {
    return this.client.getWorkspaceNote(this.workspaceId, noteId);
  }

  updateNote(noteId: string, input: UpdateWorkspaceNoteInput) {
    return this.client.updateWorkspaceNote(this.workspaceId, noteId, input);
  }

  deleteNote(noteId: string) {
    return this.client.deleteWorkspaceNote(this.workspaceId, noteId);
  }

  /** Async generator that auto-paginates through all notes. */
  paginateNotes(query?: Omit<ListWorkspaceNotesQuery, "cursor">) {
    return paginate<WorkspaceNoteSummary>(async (cursor) => {
      const res = await this.listNotes({ ...query, ...(cursor !== undefined ? { cursor } : {}) });
      return {
        items: res.notes,
        nextCursor: res.page.nextCursor,
        hasMore: res.page.hasMore,
      };
    });
  }

  // -- Docs ------------------------------------------------------------------

  listDocs(query?: ListWorkspaceDocsQuery) {
    return this.client.listWorkspaceDocs(this.workspaceId, query);
  }

  createDoc(input: CreateWorkspaceDocInput) {
    return this.client.createWorkspaceDoc(this.workspaceId, input);
  }

  getDoc(docId: string) {
    return this.client.getWorkspaceDoc(this.workspaceId, docId);
  }

  updateDoc(docId: string, input: UpdateWorkspaceDocInput) {
    return this.client.updateWorkspaceDoc(this.workspaceId, docId, input);
  }

  deleteDoc(docId: string) {
    return this.client.deleteWorkspaceDoc(this.workspaceId, docId);
  }

  /** Async generator that auto-paginates through all docs. */
  paginateDocs(query?: Omit<ListWorkspaceDocsQuery, "cursor">) {
    return paginate<WorkspaceDocSummary>(async (cursor) => {
      const res = await this.listDocs({ ...query, ...(cursor !== undefined ? { cursor } : {}) });
      return {
        items: res.docs,
        nextCursor: res.page.nextCursor,
        hasMore: res.page.hasMore,
      };
    });
  }

  // -- Drives & Files --------------------------------------------------------

  listDrives() {
    return this.client.listWorkspaceDrives(this.workspaceId);
  }

  listDriveFiles(driveId: string, query?: ListDriveFilesQuery) {
    return this.client.listDriveFiles(this.workspaceId, driveId, query);
  }

  getFile(fileId: string) {
    return this.client.getFile(this.workspaceId, fileId);
  }

  updateFile(fileId: string, input: UpdateFileInput) {
    return this.client.updateFile(this.workspaceId, fileId, input);
  }

  deleteFile(fileId: string) {
    return this.client.deleteFile(this.workspaceId, fileId);
  }

  // -- Channels --------------------------------------------------------------

  listChannels() {
    return this.client.listWorkspaceChannels(this.workspaceId);
  }

  listChannelMessages(channelId: string, query?: { cursor?: string; limit?: number }) {
    return this.client.listChannelMessages(this.workspaceId, channelId, query);
  }

  sendChannelMessage(channelId: string, input: SendMessageInput) {
    return this.client.sendChannelMessage(this.workspaceId, channelId, input);
  }

  // -- Direct Messages -------------------------------------------------------

  listDms() {
    return this.client.listWorkspaceDms(this.workspaceId);
  }

  listDmMessages(dmId: string, query?: { cursor?: string; limit?: number }) {
    return this.client.listDmMessages(this.workspaceId, dmId, query);
  }

  sendDmMessage(dmId: string, input: SendMessageInput) {
    return this.client.sendDmMessage(this.workspaceId, dmId, input);
  }

  // -- Messages --------------------------------------------------------------

  getMessage(messageId: string) {
    return this.client.getMessage(this.workspaceId, messageId);
  }

  editMessage(messageId: string, input: EditMessageInput) {
    return this.client.editMessage(this.workspaceId, messageId, input);
  }

  deleteMessage(messageId: string) {
    return this.client.deleteMessage(this.workspaceId, messageId);
  }

  getThread(messageId: string) {
    return this.client.getThread(this.workspaceId, messageId);
  }

  replyToThread(messageId: string, input: ThreadReplyInput) {
    return this.client.replyToThread(this.workspaceId, messageId, input);
  }

  addReaction(messageId: string, emoji: string) {
    return this.client.addReaction(this.workspaceId, messageId, emoji);
  }

  removeReaction(messageId: string, emoji: string) {
    return this.client.removeReaction(this.workspaceId, messageId, emoji);
  }

  pinMessage(messageId: string) {
    return this.client.pinMessage(this.workspaceId, messageId);
  }

  unpinMessage(messageId: string) {
    return this.client.unpinMessage(this.workspaceId, messageId);
  }

  // -- Calendar Events -------------------------------------------------------

  listCalendarEvents(range: { start: string; end: string }) {
    return this.client.listCalendarEvents(this.workspaceId, range);
  }

  createCalendarEvent(input: CreateCalendarEventInput) {
    return this.client.createCalendarEvent(this.workspaceId, input);
  }

  getCalendarEvent(eventId: string) {
    return this.client.getCalendarEvent(this.workspaceId, eventId);
  }

  updateCalendarEvent(eventId: string, input: UpdateCalendarEventInput) {
    return this.client.updateCalendarEvent(this.workspaceId, eventId, input);
  }

  deleteCalendarEvent(eventId: string) {
    return this.client.deleteCalendarEvent(this.workspaceId, eventId);
  }

  // -- Search ----------------------------------------------------------------

  search(input: WorkspaceSearchInput) {
    return this.client.searchWorkspace(this.workspaceId, input);
  }

  // -- Taskboards & Tasks ----------------------------------------------------

  listTaskboards() {
    return this.client.listWorkspaceTaskboards(this.workspaceId);
  }

  getTask(taskboardId: string, taskId: string) {
    return this.client.getTaskboardTask(this.workspaceId, taskboardId, taskId);
  }

  listTasks(taskboardId: string, query?: ListTaskboardTasksQuery) {
    return this.client.listTaskboardTasks(this.workspaceId, taskboardId, query);
  }

  createTask(taskboardId: string, input: CreateTaskInput) {
    return this.client.createTaskboardTask(this.workspaceId, taskboardId, input);
  }

  updateTask(taskboardId: string, taskId: string, input: UpdateTaskInput) {
    return this.client.updateTaskboardTask(this.workspaceId, taskboardId, taskId, input);
  }

  deleteTask(taskboardId: string, taskId: string) {
    return this.client.deleteTaskboardTask(this.workspaceId, taskboardId, taskId);
  }

  batchCreateTasks(taskboardId: string, tasks: CreateTaskInput[]) {
    return this.client.batchCreateTasks(this.workspaceId, taskboardId, tasks);
  }

  batchUpdateTasks(taskboardId: string, updates: BatchUpdateTaskEntry[]) {
    return this.client.batchUpdateTasks(this.workspaceId, taskboardId, updates);
  }

  batchDeleteTasks(taskboardId: string, taskIds: string[]) {
    return this.client.batchDeleteTasks(this.workspaceId, taskboardId, taskIds);
  }

  // -- File Uploads ----------------------------------------------------------

  initiateUpload(input: InitiateUploadInput) {
    return this.client.initiateUpload(this.workspaceId, input);
  }

  uploadPart(uploadId: string, partNumber: number, data: Uint8Array | ArrayBuffer | Blob) {
    return this.client.uploadPart(this.workspaceId, uploadId, partNumber, data);
  }

  completeUpload(uploadId: string, parts: CompletedUploadPart[]) {
    return this.client.completeUpload(this.workspaceId, uploadId, parts);
  }

  /**
   * Upload a file in one call. Handles chunking automatically.
   *
   * @example
   * ```ts
   * const ws = client.workspace("ws_123");
   * const result = await ws.uploadFile({
   *   data: myBlob,
   *   fileName: "photo.jpg",
   *   mimeType: "image/jpeg",
   *   driveId: "drive_abc",
   * });
   * console.log(result.file.id);
   * ```
   */
  uploadFile(input: UploadFileInput) {
    return this.client.uploadFile(this.workspaceId, input);
  }

  // -- Tab AI ----------------------------------------------------------------

  /** Stream Tab completions and yield SSE chunks. */
  streamTabChatCompletion(input: TabChatCompletionInput) {
    return this.client.streamTabChatCompletion(input);
  }

  /** Stream Tab completions and yield only the text strings. */
  streamTabText(input: TabChatCompletionInput) {
    return this.client.streamTabText(input);
  }

  // ---------------------------------------------------------------------------
  // Resource handles — chainable accessors for individual resources
  // ---------------------------------------------------------------------------

  /**
   * Get a handle to a specific note.
   * @example
   * ```ts
   * const body = await ws.note("note_123").get();
   * await ws.note("note_123").update({ title: "New title" });
   * await ws.note("note_123").delete();
   * ```
   */
  note(noteId: string): NoteHandle {
    return new NoteHandle(this, noteId);
  }

  /**
   * Get a handle to a specific doc.
   * @example
   * ```ts
   * const doc = await ws.doc("doc_456").get();
   * await ws.doc("doc_456").update({ title: "Updated" });
   * ```
   */
  doc(docId: string): DocHandle {
    return new DocHandle(this, docId);
  }

  /**
   * Get a handle to a specific file.
   * @example
   * ```ts
   * const file = await ws.file("file_789").get();
   * await ws.file("file_789").update({ name: "renamed.pdf" });
   * await ws.file("file_789").delete();
   * ```
   */
  file(fileId: string): FileHandle {
    return new FileHandle(this, fileId);
  }

  /**
   * Get a handle to a specific message.
   * @example
   * ```ts
   * const msg = await ws.message("msg_123").get();
   * await ws.message("msg_123").edit({ content: Message.text("updated").build() });
   * await ws.message("msg_123").react("👍");
   * await ws.message("msg_123").pin();
   * const thread = await ws.message("msg_123").thread();
   * await ws.message("msg_123").reply(Message.text("reply!").toInput());
   * ```
   */
  message(messageId: string): MessageHandle {
    return new MessageHandle(this, messageId);
  }

  /**
   * Get a handle to a specific channel.
   * @example
   * ```ts
   * const messages = await ws.channel("ch_123").messages();
   * await ws.channel("ch_123").send(Message.text("hello!").toInput());
   * ```
   */
  channel(channelId: string): ChannelHandle {
    return new ChannelHandle(this, channelId);
  }

  /**
   * Get a handle to a specific DM.
   * @example
   * ```ts
   * await ws.dm("dm_456").send(Message.text("hey!").toInput());
   * ```
   */
  dm(dmId: string): DmHandle {
    return new DmHandle(this, dmId);
  }

  /**
   * Get a handle to a specific calendar event.
   * @example
   * ```ts
   * const event = await ws.event("evt_789").get();
   * await ws.event("evt_789").update({ title: "Moved" });
   * await ws.event("evt_789").delete();
   * ```
   */
  event(eventId: string): CalendarEventHandle {
    return new CalendarEventHandle(this, eventId);
  }

  /**
   * Get a handle to a specific taskboard.
   * @example
   * ```ts
   * const tasks = await ws.taskboard("tb_123").listTasks();
   * await ws.taskboard("tb_123").createTask({ title: "New task" });
   * await ws.taskboard("tb_123").task("task_456").update({ priority: "high" });
   * ```
   */
  taskboard(taskboardId: string): TaskboardHandle {
    return new TaskboardHandle(this, taskboardId);
  }

  /**
   * Get a handle to a workspace-installed app and its runtime surfaces.
   *
   * @example
   * ```ts
   * await ws.installApp({ appId: "app_123" });
   * const crm = ws.app("acme-crm");
   * const files = await crm.listFiles({ limit: 20 });
   * await crm.file("file_123").updateDocument({ status: "active" });
   * ```
   */
  app(appKey: string): WorkspaceAppHandle {
    return new WorkspaceAppHandle(this.client, this.workspaceId, appKey);
  }
}

// ---------------------------------------------------------------------------
// Resource handles
// ---------------------------------------------------------------------------

export class PublishedAppHandle {
  constructor(
    private readonly client: ColineApiClient,
    readonly key: string,
  ) {}

  get() { return this.client.getApp(this.key); }
  listVersions() { return this.client.listAppVersions(this.key); }
  createVersion(payload: ColineAppRegistrationPayloadInput) {
    return this.client.createAppVersion(this.key, payload);
  }
  submitVersionForReview(
    versionId: string,
    input: SubmitAppVersionForReviewInput = {},
  ) {
    return this.client.submitAppVersionForReview(this.key, versionId, input);
  }
}

export class WorkspaceAppHandle {
  constructor(
    private readonly client: ColineApiClient,
    readonly workspaceId: string,
    readonly key: string,
  ) {}

  get() {
    return this.client.getWorkspaceInstalledApp(this.workspaceId, this.key);
  }

  getPermissions() {
    return this.client.getWorkspaceAppPermissions(this.workspaceId, this.key);
  }

  updatePermissions(input: UpdateWorkspaceAppPermissionsInput) {
    return this.client.updateWorkspaceAppPermissions(this.workspaceId, this.key, input);
  }

  uninstall() {
    return this.client.uninstallWorkspaceApp(this.workspaceId, this.key);
  }

  listSecrets() {
    return this.client.listWorkspaceAppSecrets(this.workspaceId, this.key);
  }

  createSecret(input: CreateWorkspaceAppSecretInput) {
    return this.client.createWorkspaceAppSecret(this.workspaceId, this.key, input);
  }

  deleteSecret(secretId: string) {
    return this.client.deleteWorkspaceAppSecret(this.workspaceId, this.key, secretId);
  }

  listOauthConnections() {
    return this.client.listWorkspaceAppOauthConnections(this.workspaceId, this.key);
  }

  createOauthConnection(input: CreateWorkspaceAppOauthConnectionInput) {
    return this.client.createWorkspaceAppOauthConnection(this.workspaceId, this.key, input);
  }

  deleteOauthConnection(connectionId: string) {
    return this.client.deleteWorkspaceAppOauthConnection(
      this.workspaceId,
      this.key,
      connectionId,
    );
  }

  listDeliveries() {
    return this.client.listWorkspaceAppDeliveries(this.workspaceId, this.key);
  }

  sendTestDelivery(input: SendWorkspaceAppTestDeliveryInput) {
    return this.client.sendWorkspaceAppTestDelivery(this.workspaceId, this.key, input);
  }

  replayDelivery(deliveryId: string) {
    return this.client.replayWorkspaceAppDelivery(this.workspaceId, this.key, deliveryId);
  }

  emitAmbientEvents(input: EmitAmbientEventsInputInput) {
    return this.client.emitAppAmbientEvents(this.workspaceId, this.key, input);
  }

  createNotification(input: CreateNotificationInputInput) {
    return this.client.createAppNotification(this.workspaceId, this.key, input);
  }

  upsertIndexDocuments(input: BatchUpsertAppIndexDocumentsInput) {
    return this.client.upsertAppIndexDocuments(this.workspaceId, this.key, input);
  }

  deleteIndexDocuments(input: BatchDeleteAppIndexDocumentsInput) {
    return this.client.deleteAppIndexDocuments(this.workspaceId, this.key, input);
  }

  listFiles(query?: ListAppFilesQuery) {
    return this.client.listAppFiles(this.workspaceId, this.key, query);
  }

  createFile(input: CreateAppFileInput) {
    return this.client.createAppFile(this.workspaceId, this.key, input);
  }

  executeAction(input: ExecuteAppActionInput) {
    return this.client.executeAppAction(this.workspaceId, this.key, input);
  }

  file(fileId: string): WorkspaceAppFileHandle {
    return new WorkspaceAppFileHandle(this.client, this.workspaceId, this.key, fileId);
  }
}

export class WorkspaceAppFileHandle {
  constructor(
    private readonly client: ColineApiClient,
    readonly workspaceId: string,
    readonly appKey: string,
    readonly id: string,
  ) {}

  get() {
    return this.client.getAppFileDocument(this.workspaceId, this.appKey, this.id);
  }

  updateDocument(document: Record<string, unknown>) {
    return this.client.updateAppFileDocument(
      this.workspaceId,
      this.appKey,
      this.id,
      document,
    );
  }

  delete() {
    return this.client.deleteAppFile(this.workspaceId, this.appKey, this.id);
  }
}

export class NoteHandle {
  constructor(private readonly ws: ColineWorkspace, readonly id: string) {}
  get() { return this.ws.getNote(this.id); }
  update(input: UpdateWorkspaceNoteInput) { return this.ws.updateNote(this.id, input); }
  delete() { return this.ws.deleteNote(this.id); }
}

export class DocHandle {
  constructor(private readonly ws: ColineWorkspace, readonly id: string) {}
  get() { return this.ws.getDoc(this.id); }
  update(input: UpdateWorkspaceDocInput) { return this.ws.updateDoc(this.id, input); }
  delete() { return this.ws.deleteDoc(this.id); }
}

export class FileHandle {
  constructor(private readonly ws: ColineWorkspace, readonly id: string) {}
  get() { return this.ws.getFile(this.id); }
  update(input: UpdateFileInput) { return this.ws.updateFile(this.id, input); }
  delete() { return this.ws.deleteFile(this.id); }
}

export class MessageHandle {
  constructor(private readonly ws: ColineWorkspace, readonly id: string) {}
  get() { return this.ws.getMessage(this.id); }
  edit(input: EditMessageInput) { return this.ws.editMessage(this.id, input); }
  delete() { return this.ws.deleteMessage(this.id); }
  thread() { return this.ws.getThread(this.id); }
  reply(input: ThreadReplyInput) { return this.ws.replyToThread(this.id, input); }
  react(emoji: string) { return this.ws.addReaction(this.id, emoji); }
  unreact(emoji: string) { return this.ws.removeReaction(this.id, emoji); }
  pin() { return this.ws.pinMessage(this.id); }
  unpin() { return this.ws.unpinMessage(this.id); }
}

export class ChannelHandle {
  constructor(private readonly ws: ColineWorkspace, readonly id: string) {}
  messages(query?: { cursor?: string; limit?: number }) {
    return this.ws.listChannelMessages(this.id, query);
  }
  send(input: SendMessageInput) { return this.ws.sendChannelMessage(this.id, input); }
}

export class DmHandle {
  constructor(private readonly ws: ColineWorkspace, readonly id: string) {}
  messages(query?: { cursor?: string; limit?: number }) {
    return this.ws.listDmMessages(this.id, query);
  }
  send(input: SendMessageInput) { return this.ws.sendDmMessage(this.id, input); }
}

export class CalendarEventHandle {
  constructor(private readonly ws: ColineWorkspace, readonly id: string) {}
  get() { return this.ws.getCalendarEvent(this.id); }
  update(input: UpdateCalendarEventInput) { return this.ws.updateCalendarEvent(this.id, input); }
  delete() { return this.ws.deleteCalendarEvent(this.id); }
}

export class TaskboardHandle {
  constructor(private readonly ws: ColineWorkspace, readonly id: string) {}
  getTask(taskId: string) { return this.ws.getTask(this.id, taskId); }
  listTasks(query?: ListTaskboardTasksQuery) { return this.ws.listTasks(this.id, query); }
  createTask(input: CreateTaskInput) { return this.ws.createTask(this.id, input); }
  task(taskId: string): TaskHandle { return new TaskHandle(this.ws, this.id, taskId); }
  batchCreateTasks(tasks: CreateTaskInput[]) { return this.ws.batchCreateTasks(this.id, tasks); }
  batchUpdateTasks(updates: BatchUpdateTaskEntry[]) { return this.ws.batchUpdateTasks(this.id, updates); }
  batchDeleteTasks(taskIds: string[]) { return this.ws.batchDeleteTasks(this.id, taskIds); }
}

export class TaskHandle {
  constructor(
    private readonly ws: ColineWorkspace,
    private readonly taskboardId: string,
    readonly id: string,
  ) {}
  get() { return this.ws.getTask(this.taskboardId, this.id); }
  update(input: UpdateTaskInput) { return this.ws.updateTask(this.taskboardId, this.id, input); }
  delete() { return this.ws.deleteTask(this.taskboardId, this.id); }
}
