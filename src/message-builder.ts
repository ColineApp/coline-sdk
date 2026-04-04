import type { MessageContentPart } from "./client";

/**
 * Fluent builder for constructing message content arrays.
 *
 * Instead of manually building `MessageContentPart[]` arrays:
 * ```ts
 * // Before — manual, error-prone
 * await ws.sendChannelMessage(channelId, {
 *   content: [
 *     { type: "text", text: "Hey " },
 *     { type: "mention", userId: "u_123", displayName: "Alice" },
 *     { type: "text", text: " check this out!" },
 *   ],
 * });
 *
 * // After — fluent builder
 * await ws.sendChannelMessage(channelId, {
 *   content: Message.text("Hey ").mention("u_123", "Alice").text(" check this out!").build(),
 * });
 *
 * // Or use the shorthand:
 * await ws.sendChannelMessage(channelId, Message.text("Hello everyone!").toInput());
 * ```
 */
export class Message {
  private readonly parts: MessageContentPart[] = [];

  private constructor(parts?: MessageContentPart[]) {
    if (parts) this.parts = parts;
  }

  /** Start building a message with a text segment. */
  static text(text: string): Message {
    const m = new Message();
    m.parts.push({ type: "text", text });
    return m;
  }

  /** Start building a message with a mention. */
  static mention(userId: string, displayName: string): Message {
    const m = new Message();
    m.parts.push({ type: "mention", userId, displayName });
    return m;
  }

  /** Start building from raw parts. */
  static from(parts: MessageContentPart[]): Message {
    return new Message([...parts]);
  }

  /** Append a text segment. */
  text(text: string): Message {
    this.parts.push({ type: "text", text });
    return this;
  }

  /** Append a user mention. */
  mention(userId: string, displayName: string): Message {
    this.parts.push({ type: "mention", userId, displayName });
    return this;
  }

  /** Append a newline. */
  newline(): Message {
    this.parts.push({ type: "text", text: "\n" });
    return this;
  }

  /** Get the built content parts array. */
  build(): MessageContentPart[] {
    return [...this.parts];
  }

  /**
   * Build a `SendMessageInput`-shaped object ready to pass directly
   * to `sendChannelMessage` / `sendDmMessage` / `replyToThread`.
   */
  toInput(options?: {
    replyToMessageId?: string | null;
    threadRootMessageId?: string | null;
  }): { content: MessageContentPart[]; replyToMessageId?: string | null; threadRootMessageId?: string | null } {
    return {
      content: this.build(),
      ...(options?.replyToMessageId !== undefined
        ? { replyToMessageId: options.replyToMessageId }
        : {}),
      ...(options?.threadRootMessageId !== undefined
        ? { threadRootMessageId: options.threadRootMessageId }
        : {}),
    };
  }

  /** Get the plain text representation (mentions become @displayName). */
  toPlaintext(): string {
    return this.parts
      .map((p) => (p.type === "text" ? p.text : `@${p.displayName}`))
      .join("");
  }
}
