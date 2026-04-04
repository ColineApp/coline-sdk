import type {
  WebhookEvent,
  WebhookEventType,
  MessageCreatedEvent,
  MessageUpdatedEvent,
  MessageDeletedEvent,
  ReactionAddedEvent,
  NoteCreatedEvent,
  NoteUpdatedEvent,
  NoteDeletedEvent,
  TaskCreatedEvent,
  TaskUpdatedEvent,
  TaskDeletedEvent,
  CalendarEventCreatedEvent,
  MemberJoinedEvent,
  MemberLeftEvent,
} from "./webhooks";

// ---------------------------------------------------------------------------
// Event type → event interface mapping
// ---------------------------------------------------------------------------

interface WebhookEventMap {
  "message.created": MessageCreatedEvent;
  "message.updated": MessageUpdatedEvent;
  "message.deleted": MessageDeletedEvent;
  "reaction.added": ReactionAddedEvent;
  "note.created": NoteCreatedEvent;
  "note.updated": NoteUpdatedEvent;
  "note.deleted": NoteDeletedEvent;
  "task.created": TaskCreatedEvent;
  "task.updated": TaskUpdatedEvent;
  "task.deleted": TaskDeletedEvent;
  "calendar_event.created": CalendarEventCreatedEvent;
  "member.joined": MemberJoinedEvent;
  "member.left": MemberLeftEvent;
}

type KnownEventType = keyof WebhookEventMap;

type EventHandler<T extends WebhookEvent> = (event: T) => void | Promise<void>;

/**
 * Typed webhook event router — register handlers for specific event types and
 * let the router dispatch incoming webhook events to the right handler.
 *
 * @example
 * ```ts
 * import { WebhookRouter, webhooks } from "@colineapp/sdk";
 *
 * const router = new WebhookRouter()
 *   .on("message.created", async (event) => {
 *     console.log("New message:", event.data.plaintext);
 *   })
 *   .on("task.created", async (event) => {
 *     console.log("New task:", event.data.title);
 *   })
 *   .onUnhandled((event) => {
 *     console.log("Unhandled event:", event.type);
 *   });
 *
 * // In your server:
 * const event = await webhooks.constructEvent(body, headers, secret);
 * await router.handle(event);
 *
 * // Or use with createHandler:
 * const handler = createHandler({
 *   app,
 *   secret,
 *   onWebhook: (event) => router.handle(event),
 * });
 * ```
 */
export class WebhookRouter {
  private readonly handlers = new Map<string, EventHandler<WebhookEvent>[]>();
  private unhandledHandler: EventHandler<WebhookEvent> | undefined;

  /**
   * Register a handler for a specific webhook event type. Type-safe: the
   * handler receives the correctly narrowed event type.
   *
   * Multiple handlers can be registered for the same event type; they run
   * sequentially in registration order.
   */
  on<T extends KnownEventType>(
    type: T,
    handler: EventHandler<WebhookEventMap[T]>,
  ): this;
  on(type: string, handler: EventHandler<WebhookEvent>): this;
  on(type: string, handler: EventHandler<WebhookEvent>): this {
    const existing = this.handlers.get(type);
    if (existing) {
      existing.push(handler);
    } else {
      this.handlers.set(type, [handler]);
    }
    return this;
  }

  /**
   * Register a catch-all handler for events that don't have a specific
   * handler registered.
   */
  onUnhandled(handler: EventHandler<WebhookEvent>): this {
    this.unhandledHandler = handler;
    return this;
  }

  /**
   * Remove all handlers for a specific event type, or all handlers if no
   * type is provided.
   */
  off(type?: WebhookEventType | string): this {
    if (type) {
      this.handlers.delete(type);
    } else {
      this.handlers.clear();
      this.unhandledHandler = undefined;
    }
    return this;
  }

  /**
   * Dispatch a webhook event to registered handlers.
   */
  async handle(event: WebhookEvent): Promise<void> {
    const eventHandlers = this.handlers.get(event.type);
    if (eventHandlers && eventHandlers.length > 0) {
      for (const handler of eventHandlers) {
        await handler(event);
      }
    } else if (this.unhandledHandler) {
      await this.unhandledHandler(event);
    }
  }

  /**
   * Returns the set of event types that have at least one handler registered.
   */
  registeredTypes(): Set<string> {
    return new Set(this.handlers.keys());
  }
}
