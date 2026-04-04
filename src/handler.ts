import type { ColineApp } from "./app";
import type { WebhookEvent } from "./webhooks";
import type { HomeRenderContext, FileRenderContext } from "./contexts";
import { webhooks } from "./webhooks";
import { actions } from "./ui";
import {
  parseSignedColineRequest,
  colineHostedRenderHomeRequestSchema,
  colineHostedRenderFileRequestSchema,
  colineHostedActionRequestSchema,
  hostedActionResults,
  type ColineHostedActionResponse,
} from "./hosted-runtime";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WebhookHandler = (event: WebhookEvent) => void | Promise<void>;
type ActionHandler = (
  action: { type: string; [key: string]: unknown },
  context: {
    workspace: { id: string; slug: string; name: string };
    app: { appInstallId: string; appId: string; appKey: string; name: string };
    actor: { userId: string; email: string } | null;
    file: { id: string; typeKey: string; title?: string | undefined } | null;
  },
) => ColineHostedActionResponse | Promise<ColineHostedActionResponse>;

export interface CreateHandlerOptions {
  /**
   * The ColineApp instance that defines your app's manifest, file types,
   * and render handlers.
   */
  app: ColineApp;

  /**
   * Your app's delivery secret from the Coline developer console.
   * Used to verify that incoming requests are genuinely from Coline.
   */
  secret: string;

  /**
   * Handle incoming webhook events (messages, tasks, notes, etc.).
   * Optional — only needed if your app subscribes to webhooks.
   */
  onWebhook?: WebhookHandler | undefined;

  /**
   * Handle UI action callbacks (button clicks, form submits, etc.).
   * Optional — defaults to returning `{ type: "ok" }`.
   */
  onAction?: ActionHandler | undefined;
}

// ---------------------------------------------------------------------------
// Route matching
// ---------------------------------------------------------------------------

const ROUTES = {
  manifest: "/coline/manifest",
  renderHome: "/coline/render/home",
  renderFile: "/coline/render/file",
  actions: "/coline/actions",
  events: "/coline/events",
} as const;

function matchRoute(pathname: string): keyof typeof ROUTES | null {
  // Normalize trailing slashes
  const normalized = pathname.replace(/\/+$/, "");
  for (const [key, path] of Object.entries(ROUTES)) {
    if (normalized === path) return key as keyof typeof ROUTES;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main handler factory
// ---------------------------------------------------------------------------

/**
 * Creates a single `(request: Request) => Promise<Response>` handler that
 * routes all Coline platform requests to the correct handler.
 *
 * Mount this on your HTTP server and point all `/coline/*` traffic to it.
 *
 * @example
 * ```ts
 * // === Hono ===
 * import { Hono } from "hono";
 * import { createHandler } from "@colineapp/sdk";
 *
 * const handler = createHandler({
 *   app: myColineApp,
 *   secret: process.env.COLINE_DELIVERY_SECRET!,
 *   onWebhook: (event) => {
 *     console.log("Webhook:", event.type, event.data);
 *   },
 * });
 *
 * const server = new Hono();
 * server.all("/coline/*", (c) => handler(c.req.raw));
 * export default server;
 * ```
 *
 * @example
 * ```ts
 * // === Next.js App Router (app/coline/[...path]/route.ts) ===
 * import { createHandler } from "@colineapp/sdk";
 *
 * const handler = createHandler({
 *   app: myColineApp,
 *   secret: process.env.COLINE_DELIVERY_SECRET!,
 * });
 *
 * export const GET = handler;
 * export const POST = handler;
 * ```
 *
 * @example
 * ```ts
 * // === Cloudflare Workers / Bun / Deno ===
 * import { createHandler } from "@colineapp/sdk";
 *
 * const handler = createHandler({
 *   app: myColineApp,
 *   secret: env.COLINE_DELIVERY_SECRET,
 * });
 *
 * export default { fetch: handler };
 * ```
 */
export function createHandler(
  options: CreateHandlerOptions,
): (request: Request) => Promise<Response> {
  const { app, secret, onWebhook, onAction } = options;
  const definition = app.getDefinition();

  return async function handle(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const route = matchRoute(url.pathname);

    if (!route) {
      return new Response(
        JSON.stringify({ error: "Not a Coline route" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // GET /coline/manifest — no auth required
    if (route === "manifest") {
      if (request.method === "GET" || request.method === "HEAD") {
        return app.handleManifestRequest();
      }
      return new Response(null, { status: 405 });
    }

    // All other routes require POST + signature verification
    if (request.method !== "POST") {
      return new Response(null, { status: 405 });
    }

    try {
      switch (route) {
        case "renderHome": {
          if (!definition.handlers.homeRender) {
            return jsonResponse({ error: "Home render not implemented" }, 501);
          }
          const { data } = await parseSignedColineRequest({
            request,
            secret,
            schema: colineHostedRenderHomeRequestSchema,
          });
          const homeCtx: HomeRenderContext = {
            workspace: {
              workspaceId: data.workspace.id,
              workspaceSlug: data.workspace.slug,
              workspaceName: data.workspace.name,
            },
            app: { appKey: data.app.appKey, appInstallId: data.app.appInstallId },
            actor: data.actor ?? null,
            routes: actions,
          };
          const result = await definition.handlers.homeRender(homeCtx);
          return Response.json(result);
        }

        case "renderFile": {
          if (!definition.handlers.fileRender) {
            return jsonResponse({ error: "File render not implemented" }, 501);
          }
          const { data } = await parseSignedColineRequest({
            request,
            secret,
            schema: colineHostedRenderFileRequestSchema,
          });
          const fileCtx: FileRenderContext = {
            workspace: {
              workspaceId: data.workspace.id,
              workspaceSlug: data.workspace.slug,
              workspaceName: data.workspace.name,
            },
            app: { appKey: data.app.appKey, appInstallId: data.app.appInstallId },
            actor: data.actor ?? null,
            routes: actions,
            file: data.file,
            document: data.document,
          };
          const result = await definition.handlers.fileRender(fileCtx);
          return Response.json(result);
        }

        case "actions": {
          const { data } = await parseSignedColineRequest({
            request,
            secret,
            schema: colineHostedActionRequestSchema,
          });
          if (onAction) {
            const result = await onAction(
              data.action as { type: string;[key: string]: unknown },
              {
                workspace: data.workspace,
                app: data.app,
                actor: data.actor ?? null,
                file: data.file ?? null,
              },
            );
            return Response.json(result);
          }
          return Response.json(hostedActionResults.ok());
        }

        case "events": {
          const body = await request.text();
          const headers = Object.fromEntries(request.headers.entries());
          const event = await webhooks.constructEvent(body, headers, secret);
          if (onWebhook) {
            await onWebhook(event);
          }
          return jsonResponse({ received: true }, 200);
        }

        default:
          return jsonResponse({ error: "Unknown route" }, 404);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal error";
      return jsonResponse({ error: message }, 400);
    }
  };
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
