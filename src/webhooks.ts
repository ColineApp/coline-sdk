import { ColineApiError } from "./errors";
import {
  COLINE_SIGNATURE_HEADER,
  COLINE_TIMESTAMP_HEADER,
  COLINE_DELIVERY_HEADER,
  verifyAppRequestSignature,
} from "./signing";

// ---------------------------------------------------------------------------
// Webhook event types — discriminated union
// ---------------------------------------------------------------------------

interface WebhookEventBase {
  deliveryId: string;
  timestamp: string;
  workspaceId: string;
  /** Workspace details — included when delivered by the Coline platform. */
  workspace?: {
    id: string;
    slug: string;
    name: string;
  } | undefined;
}

export interface MessageCreatedEvent extends WebhookEventBase {
  type: "message.created";
  data: {
    messageId: string;
    containerType: string;
    containerId: string;
    authorUserId: string | null;
    plaintext: string;
  };
}

export interface MessageUpdatedEvent extends WebhookEventBase {
  type: "message.updated";
  data: {
    messageId: string;
    containerType: string;
    containerId: string;
    plaintext: string;
  };
}

export interface MessageDeletedEvent extends WebhookEventBase {
  type: "message.deleted";
  data: {
    messageId: string;
    containerType: string;
    containerId: string;
  };
}

export interface ReactionAddedEvent extends WebhookEventBase {
  type: "reaction.added";
  data: {
    messageId: string;
    userId: string;
    emoji: string;
  };
}

export interface NoteCreatedEvent extends WebhookEventBase {
  type: "note.created";
  data: {
    noteId: string;
    title: string;
    createdByUserId: string | null;
  };
}

export interface NoteUpdatedEvent extends WebhookEventBase {
  type: "note.updated";
  data: {
    noteId: string;
    title: string;
  };
}

export interface NoteDeletedEvent extends WebhookEventBase {
  type: "note.deleted";
  data: {
    noteId: string;
  };
}

export interface TaskCreatedEvent extends WebhookEventBase {
  type: "task.created";
  data: {
    taskId: string;
    taskboardId: string;
    title: string;
    priority: string;
    createdByUserId: string | null;
  };
}

export interface TaskUpdatedEvent extends WebhookEventBase {
  type: "task.updated";
  data: {
    taskId: string;
    taskboardId: string;
    title: string;
    priority: string;
    isCompleted: boolean;
  };
}

export interface TaskDeletedEvent extends WebhookEventBase {
  type: "task.deleted";
  data: {
    taskId: string;
    taskboardId: string;
  };
}

export interface CalendarEventCreatedEvent extends WebhookEventBase {
  type: "calendar_event.created";
  data: {
    eventId: string;
    title: string;
    startTime: string;
    endTime: string;
  };
}

export interface MemberJoinedEvent extends WebhookEventBase {
  type: "member.joined";
  data: {
    userId: string;
    email: string;
    roles: string[];
  };
}

export interface MemberLeftEvent extends WebhookEventBase {
  type: "member.left";
  data: {
    userId: string;
  };
}

export interface GenericWebhookEvent extends WebhookEventBase {
  type: string;
  data: Record<string, unknown>;
}

/**
 * All known webhook event types. Use `event.type` to narrow.
 *
 * @example
 * ```ts
 * const event = await coline.webhooks.constructEvent(body, headers, secret);
 *
 * switch (event.type) {
 *   case "message.created":
 *     console.log(event.data.plaintext); // typed!
 *     break;
 *   case "task.created":
 *     console.log(event.data.title, event.data.priority); // typed!
 *     break;
 * }
 * ```
 */
export type WebhookEvent =
  | MessageCreatedEvent
  | MessageUpdatedEvent
  | MessageDeletedEvent
  | ReactionAddedEvent
  | NoteCreatedEvent
  | NoteUpdatedEvent
  | NoteDeletedEvent
  | TaskCreatedEvent
  | TaskUpdatedEvent
  | TaskDeletedEvent
  | CalendarEventCreatedEvent
  | MemberJoinedEvent
  | MemberLeftEvent
  | GenericWebhookEvent;

/** All known webhook event type strings. */
export type WebhookEventType = WebhookEvent["type"];

// ---------------------------------------------------------------------------
// Webhook handler helpers
// ---------------------------------------------------------------------------

const MAX_TIMESTAMP_DRIFT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Webhook verification and event construction — inspired by Stripe's pattern.
 *
 * @example
 * ```ts
 * import { webhooks } from "@colineapp/sdk";
 *
 * // In your webhook handler (Express, Hono, Next.js, etc.):
 * const event = await webhooks.constructEvent(
 *   rawBody,          // The raw request body string
 *   request.headers,  // Headers object or Record<string, string>
 *   process.env.COLINE_WEBHOOK_SECRET,
 * );
 *
 * if (event.type === "message.created") {
 *   console.log(event.data.plaintext);
 * }
 * ```
 */
export const webhooks = {
  /**
   * Verify a webhook signature and parse the typed event payload.
   *
   * @throws {ColineApiError} if signature is invalid, timestamp is too old, or payload is malformed.
   */
  async constructEvent(
    rawBody: string,
    headers: Headers | Record<string, string | undefined>,
    secret: string,
  ): Promise<WebhookEvent> {
    const getHeader = (name: string): string | undefined => {
      if (headers instanceof Headers) {
        return headers.get(name) ?? undefined;
      }
      return headers[name];
    };

    const signature = getHeader(COLINE_SIGNATURE_HEADER);
    const timestamp = getHeader(COLINE_TIMESTAMP_HEADER);
    const deliveryId = getHeader(COLINE_DELIVERY_HEADER);

    if (!signature || !timestamp) {
      throw new ColineApiError({
        message: "Missing webhook signature or timestamp headers.",
        type: "network",
        status: 0,
        code: "WEBHOOK_MISSING_HEADERS",
      });
    }

    // Reject stale timestamps to prevent replay attacks
    const timestampMs = new Date(timestamp).getTime();
    if (
      Number.isNaN(timestampMs) ||
      Math.abs(Date.now() - timestampMs) > MAX_TIMESTAMP_DRIFT_MS
    ) {
      throw new ColineApiError({
        message: "Webhook timestamp is too old or invalid. Possible replay attack.",
        type: "network",
        status: 0,
        code: "WEBHOOK_TIMESTAMP_EXPIRED",
      });
    }

    const valid = await verifyAppRequestSignature({
      secret,
      timestamp,
      body: rawBody,
      signature,
    });

    if (!valid) {
      throw new ColineApiError({
        message: "Webhook signature verification failed.",
        type: "network",
        status: 0,
        code: "WEBHOOK_SIGNATURE_INVALID",
      });
    }

    const parsed = JSON.parse(rawBody) as Record<string, unknown>;

    const workspaceId = (parsed["workspaceId"] as string) ?? "";
    const rawWorkspace = parsed["workspace"] as Record<string, unknown> | undefined;
    const workspace = rawWorkspace
      ? {
          id: (rawWorkspace["id"] as string) ?? workspaceId,
          slug: (rawWorkspace["slug"] as string) ?? "",
          name: (rawWorkspace["name"] as string) ?? "",
        }
      : undefined;

    return {
      type: (parsed["type"] as string) ?? "unknown",
      deliveryId: deliveryId ?? "",
      timestamp,
      workspaceId,
      ...(workspace ? { workspace } : {}),
      data: (parsed["data"] as Record<string, unknown>) ?? {},
    } as WebhookEvent;
  },

  /**
   * Verify a webhook signature without parsing the body.
   * Returns `true` if valid, `false` otherwise. Does not throw.
   */
  async verify(
    rawBody: string,
    headers: Headers | Record<string, string | undefined>,
    secret: string,
  ): Promise<boolean> {
    const getHeader = (name: string): string | undefined => {
      if (headers instanceof Headers) {
        return headers.get(name) ?? undefined;
      }
      return headers[name];
    };

    const signature = getHeader(COLINE_SIGNATURE_HEADER);
    const timestamp = getHeader(COLINE_TIMESTAMP_HEADER);

    if (!signature || !timestamp) return false;

    const timestampMs = new Date(timestamp).getTime();
    if (
      Number.isNaN(timestampMs) ||
      Math.abs(Date.now() - timestampMs) > MAX_TIMESTAMP_DRIFT_MS
    ) {
      return false;
    }

    return verifyAppRequestSignature({
      secret,
      timestamp,
      body: rawBody,
      signature,
    });
  },
};
