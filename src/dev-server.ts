/**
 * Local development server for Coline apps.
 *
 * Renders a browser-based preview of your app's home and file views
 * by calling your handler with signed mock requests — no Coline account needed.
 *
 * Usage:
 *   import { createDevServer } from "@colineapp/sdk/dev";
 *   createDevServer({ app, secret: "dev-secret" }).listen(4200);
 */

import type { ColineApp } from "./app";
import { createHandler } from "./handler";
import { createSignedAppRequestHeaders } from "./signing";

// ── Types ───────────────────────────────────────────────────────────────────

export interface DevServerOptions {
  app: ColineApp;
  secret: string;
  port?: number;
  /** Mock workspace context */
  workspace?: {
    id?: string;
    slug?: string;
    name?: string;
  };
  /** Mock user context */
  actor?: {
    userId?: string;
    email?: string;
    displayName?: string;
  };
}

// ── Mock Data ───────────────────────────────────────────────────────────────

function buildMockBody(
  options: DevServerOptions,
  renderType: "home" | "file",
  fileId?: string,
) {
  const workspace = {
    id: options.workspace?.id ?? "ws_dev_000",
    slug: options.workspace?.slug ?? "dev-workspace",
    name: options.workspace?.name ?? "Dev Workspace",
  };

  const actor = {
    userId: options.actor?.userId ?? "user_dev_000",
    email: options.actor?.email ?? "dev@example.com",
    displayName: options.actor?.displayName ?? "Developer",
  };

  const app = {
    appInstallId: "install_dev_000",
    appId: "app_dev_000",
    appKey: options.app.getDefinition().manifest.key,
    name: options.app.getDefinition().manifest.name,
  };

  const base = { workspace, actor, app };

  if (renderType === "home") {
    return base;
  }

  return {
    ...base,
    file: {
      id: fileId ?? "file_dev_000",
      typeKey: options.app.getDefinition().fileTypes[0]?.typeKey ?? "unknown",
      title: "Sample File",
    },
    document: { _dev: true },
    version: 1,
  };
}

// ── UI Renderer ─────────────────────────────────────────────────────────────

function renderUiNode(node: Record<string, unknown>): string {
  const type = node.type as string;

  switch (type) {
    case "stack": {
      const children = (node.children as Record<string, unknown>[]) ?? [];
      const dir = node.direction === "horizontal" ? "flex-row" : "flex-col";
      const gap = node.gap ?? 3;
      return `<div class="flex ${dir}" style="gap: ${Number(gap) * 4}px">${children.map(renderUiNode).join("")}</div>`;
    }
    case "heading": {
      const level = node.level ?? 2;
      const cls = level === 1 ? "text-2xl font-bold" : level === 2 ? "text-xl font-semibold" : "text-lg font-medium";
      return `<h${level} class="${cls}">${escapeHtml(String(node.value ?? ""))}</h${level}>`;
    }
    case "text":
      return `<p class="text-sm text-gray-600 dark:text-gray-400">${escapeHtml(String(node.value ?? ""))}</p>`;
    case "badge": {
      const tone = node.tone ?? "default";
      const colors: Record<string, string> = {
        default: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        muted: "bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-500",
        positive: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
        warning: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
        danger: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
      };
      return `<span class="inline-flex px-2 py-0.5 rounded text-xs font-medium ${colors[String(tone)] ?? colors.default}">${escapeHtml(String(node.value ?? ""))}</span>`;
    }
    case "button":
      return `<button class="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors">${escapeHtml(String(node.label ?? ""))}</button>`;
    case "divider":
      return `<hr class="border-gray-200 dark:border-gray-800 my-2" />`;
    case "empty_state":
      return `<div class="text-center py-8"><p class="text-gray-400 text-sm">${escapeHtml(String(node.title ?? ""))}</p>${node.description ? `<p class="text-gray-400 text-xs mt-1">${escapeHtml(String(node.description))}</p>` : ""}</div>`;
    case "table": {
      const columns = (node.columns as Array<{ key: string; header: string }>) ?? [];
      const rows = (node.rows as Array<Record<string, unknown>>) ?? [];
      return `<table class="w-full text-sm"><thead><tr>${columns.map((c) => `<th class="text-left py-2 px-3 border-b font-medium text-gray-500">${escapeHtml(c.header)}</th>`).join("")}</tr></thead><tbody>${rows.map((row) => `<tr>${columns.map((c) => `<td class="py-2 px-3 border-b border-gray-100 dark:border-gray-800">${escapeHtml(String(row[c.key] ?? ""))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    }
    case "code_block":
      return `<pre class="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-xs overflow-x-auto"><code>${escapeHtml(String(node.code ?? ""))}</code></pre>`;
    case "image":
      return `<img src="${escapeHtml(String(node.src ?? ""))}" alt="${escapeHtml(String(node.alt ?? ""))}" class="max-w-full rounded-lg" />`;
    case "link":
      return `<a href="${escapeHtml(String(node.href ?? "#"))}" class="text-blue-600 hover:underline text-sm">${escapeHtml(String(node.label ?? ""))}</a>`;
    case "file_card":
      return `<div class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"><div class="text-gray-400">📄</div><div><p class="text-sm font-medium">${escapeHtml(String(node.title ?? ""))}</p>${node.subtitle ? `<p class="text-xs text-gray-500">${escapeHtml(String(node.subtitle))}</p>` : ""}</div></div>`;
    case "user_chip":
      return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-xs">👤 ${escapeHtml(String(node.label ?? ""))}</span>`;
    case "input":
      return `<div class="space-y-1">${node.label ? `<label class="text-sm font-medium">${escapeHtml(String(node.label))}</label>` : ""}<input type="${node.inputType ?? "text"}" name="${escapeHtml(String(node.name ?? ""))}" placeholder="${escapeHtml(String(node.placeholder ?? ""))}" class="w-full px-3 py-2 rounded-lg border text-sm" /></div>`;
    case "select":
      return `<div class="space-y-1">${node.label ? `<label class="text-sm font-medium">${escapeHtml(String(node.label))}</label>` : ""}<select name="${escapeHtml(String(node.name ?? ""))}" class="w-full px-3 py-2 rounded-lg border text-sm">${((node.options as Array<{ label: string; value: string }>) ?? []).map((o) => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join("")}</select></div>`;
    default:
      return `<div class="text-xs text-gray-400">[Unknown: ${escapeHtml(type)}]</div>`;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Dev Server HTML Shell ───────────────────────────────────────────────────

function devShell(appName: string, renderedContent: string, tab: "home" | "file"): string {
  return `<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(appName)} — Coline Dev Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  </style>
</head>
<body class="h-full bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
  <div class="flex h-full">
    <!-- Sidebar -->
    <aside class="w-64 shrink-0 border-r bg-white dark:bg-gray-900 p-4 flex flex-col gap-4">
      <div class="flex items-center gap-2">
        <div class="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 text-sm font-bold">C</div>
        <span class="text-sm font-semibold">Coline Dev Preview</span>
      </div>
      <div class="flex-1 space-y-1">
        <a href="/dev"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${tab === "home" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}">
          🏠 Home
        </a>
        <a href="/dev/file"
          class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${tab === "file" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}">
          📄 File Preview
        </a>
      </div>
      <div class="text-xs text-gray-400 space-y-1">
        <p>Manifest: <a href="/coline/manifest" class="text-blue-500 hover:underline">/coline/manifest</a></p>
        <p class="text-[10px]">This is a local development preview.</p>
      </div>
    </aside>

    <!-- Content -->
    <main class="flex-1 overflow-y-auto p-8">
      <div class="max-w-2xl mx-auto space-y-6">
        <div class="flex items-center justify-between">
          <h1 class="text-lg font-semibold">${escapeHtml(appName)}</h1>
          <span class="px-2 py-0.5 rounded text-xs bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">Dev Mode</span>
        </div>
        <div class="bg-white dark:bg-gray-900 rounded-xl border p-6 space-y-4">
          ${renderedContent}
        </div>
      </div>
    </main>
  </div>
</body>
</html>`;
}

// ── Dev Server Factory ──────────────────────────────────────────────────────

export function createDevServer(options: DevServerOptions) {
  const handler = createHandler({
    app: options.app,
    secret: options.secret,
  });

  async function callRender(renderType: "home" | "file", fileId?: string): Promise<string> {
    const body = JSON.stringify(buildMockBody(options, renderType, fileId));
    const path = renderType === "home" ? "/coline/render/home" : "/coline/render/file";
    const headers = await createSignedAppRequestHeaders({
      secret: options.secret,
      body,
      deliveryId: `dev_${Date.now()}`,
    });

    const request = new Request(`http://localhost${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body,
    });

    const response = await handler(request);
    if (!response.ok) {
      const text = await response.text();
      return `<div class="text-red-500 text-sm">Render error (${response.status}): ${escapeHtml(text)}</div>`;
    }

    const json = (await response.json()) as { ui?: Record<string, unknown>[] | Record<string, unknown> };
    const uiNodes = Array.isArray(json.ui) ? json.ui : json.ui ? [json.ui] : [];
    return uiNodes.map((node) => renderUiNode(node as Record<string, unknown>)).join("");
  }

  async function devHandler(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Pass through /coline/* routes to the real handler
    if (url.pathname.startsWith("/coline/")) {
      return handler(request);
    }

    const appName = options.app.getDefinition().manifest.name;

    // Dev preview routes
    if (url.pathname === "/dev" || url.pathname === "/dev/home" || url.pathname === "/") {
      const content = await callRender("home");
      return new Response(devShell(appName, content, "home"), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === "/dev/file") {
      const content = await callRender("file", url.searchParams.get("id") ?? undefined);
      return new Response(devShell(appName, content, "file"), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Redirect root to dev preview
    return new Response(null, {
      status: 302,
      headers: { Location: "/dev" },
    });
  }

  return {
    handler: devHandler,
    listen(port?: number) {
      const p = port ?? options.port ?? 4200;
      // Use a dynamic import to avoid bundling node:http in non-Node environments
      // Dynamic import — only works in Node.js environments
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      void (import("node:http" as string) as Promise<any>).then((http: { createServer: Function }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        http.createServer(async (req: any, res: any) => {
            const url = new URL(req.url ?? "/", `http://localhost:${p}`);
            const bodyChunks: string[] = [];
            req.on("data", (chunk: { toString(): string }) => bodyChunks.push(chunk.toString()));
            req.on("end", async () => {
              const body = bodyChunks.join("");
              const request = new Request(url, {
                method: req.method,
                headers: Object.fromEntries(
                  Object.entries(req.headers).filter(
                    (entry): entry is [string, string] =>
                      typeof entry[1] === "string",
                  ),
                ),
                ...(body && req.method !== "GET" && req.method !== "HEAD"
                  ? { body }
                  : {}),
              });

              const response = await devHandler(request);
              const responseBody = await response.text();
              res.writeHead(
                response.status,
                Object.fromEntries(response.headers),
              );
              res.end(responseBody);
            });
          })
          .listen(p, () => {
            console.log(`\n  🎨 Dev preview:  http://localhost:${p}/dev`);
            console.log(`  📋 Manifest:     http://localhost:${p}/coline/manifest\n`);
          });
      });
    },
  };
}
