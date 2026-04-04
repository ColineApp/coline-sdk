# @colineapp/sdk

TypeScript SDK for building apps on [Coline](https://coline.app).

## Install

```bash
npm install @colineapp/sdk
```

## Build a Coline App in 5 Minutes

### 1. Define your app

```ts
import { ColineApp, ui, actions, createHandler } from "@colineapp/sdk";

const app = new ColineApp({
  key: "com.acme.todos",
  name: "Acme Todos",
  description: "Track todos inside Coline.",
  permissions: ["app.home.read", "files.read", "files.write"],
  hosting: { mode: "external", baseUrl: "https://your-app.example.com" },
});

// Define a file type your app owns
app.defineFileType({
  typeKey: "todo",
  name: "Todo",
  description: "A todo item",
  storage: "coline_document",
  indexable: true,
  homeRenderMode: "cached",
});

// Render the app's home screen
app.onHomeRender((ctx) =>
  ui.stack([
    ui.heading("Todos"),
    ui.text(`Workspace: ${ctx.workspace.name}`),
    ui.button("New Todo", {
      action: actions.createFile({
        name: "Untitled Todo",
        typeKey: "todo",
        document: { status: "open" },
      }),
    }),
  ]),
);

// Render an individual file
app.onFileRender((ctx) =>
  ui.stack([
    ui.heading(ctx.file.title ?? "Todo"),
    ui.badge(String(ctx.document["status"] ?? "open")),
  ]),
);
```

### 2. Serve it

The SDK gives you one handler that routes all Coline traffic:

```ts
const handler = createHandler({
  app,
  secret: process.env.COLINE_DELIVERY_SECRET!,
  onWebhook: (event) => {
    console.log("Webhook:", event.type);
  },
});
```

Mount it on any framework:

```ts
// Hono
const server = new Hono();
server.all("/coline/*", (c) => handler(c.req.raw));

// Next.js App Router (app/coline/[...path]/route.ts)
export const GET = handler;
export const POST = handler;

// Cloudflare Workers / Bun / Deno
export default { fetch: handler };

// Express (with raw body parsing)
app.all("/coline/*", async (req, res) => {
  const response = await handler(toWebRequest(req));
  res.status(response.status).json(await response.json());
});
```

### 3. Register on Coline

Start your app, then open the Developer Console in your workspace settings.

1. Go to **Apps → Add App**
2. Enter your app's base URL (e.g. `http://localhost:3100`)
3. Click **Import from app** — the console fetches your manifest from `GET /coline/manifest`
4. Review permissions, file types, and notification channels, then submit

The console pulls everything directly from the SDK — no copy-pasting JSON.

As the app owner, you can install your own unpublished versions directly into your workspace for development. For store-listed apps, submit the version for review from the app detail page in the console.

---

## Routes Your App Exposes

`createHandler()` handles these automatically:

| Route | Method | Purpose |
|-------|--------|---------|
| `/coline/manifest` | GET | Returns your app manifest (used by the developer console) |
| `/coline/render/home` | POST | Renders your app's home screen |
| `/coline/render/file` | POST | Renders a file owned by your app |
| `/coline/actions` | POST | Handles UI action callbacks (button clicks, etc.) |
| `/coline/events` | POST | Receives webhook events |

All POST routes are verified using your delivery secret.

---

## API Client

For server-to-server calls (creating files, sending notifications, etc.):

```ts
import { ColineApiClient } from "@colineapp/sdk";

const client = new ColineApiClient({
  baseUrl: "https://coline.app",
  apiKey: process.env.COLINE_API_KEY!,
});

// Fluent scoped handles
const ws = client.workspace("acme");
const app = ws.app("com.acme.todos");

// Create a file
const { file } = await app.createFile({
  name: "Buy milk",
  typeKey: "todo",
  document: { status: "open" },
});

// Update it
await app.file(file.id).updateDocument({ status: "done" });

// Send a notification
await app.createNotification({
  channelKey: "updates",
  typeKey: "todo.completed",
  title: "Todo completed",
  body: "Buy milk is done!",
  recipients: [{ userId: "user_123" }],
});
```

## Webhooks

Verify and handle webhook events with typed payloads:

```ts
import { webhooks } from "@colineapp/sdk";

// In your webhook handler:
const event = await webhooks.constructEvent(rawBody, request.headers, secret);

switch (event.type) {
  case "message.created":
    console.log(event.data.plaintext);
    break;
  case "task.created":
    console.log(event.data.title, event.data.priority);
    break;
}
```

Or use `createHandler({ onWebhook })` for automatic verification.

## UI Components

Build native Coline UI with the `ui` helper. Components render directly inside Coline's workspace — no iframe, no custom CSS.

### Text & Typography

```ts
import { ui, actions } from "@colineapp/sdk";

ui.heading("Title", { level: 1 });       // h1–h4
ui.text("Body text");
ui.text("Error occurred", { tone: "danger" });
ui.badge("Active", { tone: "positive" }); // default, muted, positive, warning, danger
ui.link("Read more", "https://docs.example.com", { external: true });
```

### Layout

```ts
ui.stack([child1, child2], { gap: "md" });         // vertical
ui.row([badge1, badge2], { gap: "sm" });            // horizontal
ui.divider();
```

### Interactive

```ts
ui.button("Save", { action: actions.custom("my-app.save") });
ui.button("Open", { action: actions.openFile("file_123") });
ui.button("Create", {
  action: actions.createFile({ name: "New Todo", typeKey: "todo" }),
});
```

### Form Inputs

```ts
ui.input({ name: "title", label: "Title", placeholder: "Enter a title…" });
ui.input({ name: "notes", label: "Notes", type: "textarea" });
ui.input({ name: "amount", label: "Amount", type: "number", required: true });
ui.select({
  name: "priority",
  label: "Priority",
  options: [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ],
  defaultValue: "medium",
});
```

### Data Display

```ts
ui.table({
  columns: [
    { key: "name", label: "Name" },
    { key: "status", label: "Status" },
    { key: "date", label: "Date", align: "right" },
  ],
  rows: [
    { name: "Sprint planning", status: "Done", date: "Jan 15" },
    { name: "Design review", status: "Open", date: "Jan 20" },
  ],
});

ui.codeBlock("const x = 42;", { language: "typescript" });
```

### Media & References

```ts
ui.image({ src: "https://...", alt: "Screenshot", width: 800, height: 400 });
ui.fileCard({ title: "Q4 Report", subtitle: "Updated yesterday", fileId: "file_123" });
ui.userChip({ label: "Alice", userId: "user_123" });
ui.emptyState({
  title: "No items yet",
  description: "Create your first item.",
  action: actions.custom("my-app.create"),
});
```

## Tab Autocomplete API

The Tab API provides OpenAI-compatible completions for inline autocomplete. Authenticate with a workspace API key that has the `ai.invoke` scope.

```ts
import { ColineApiClient } from "@colineapp/sdk";

const client = new ColineApiClient({
  baseUrl: "https://coline.app",
  apiKey: process.env.COLINE_API_KEY!,
});

// Stream text completions
for await (const text of client.streamTabText({
  tab_context: {
    surface: "docs",
    workspace_slug: "acme",
    entity_id: "doc_123",
    active_text_before_cursor: "The quick brown ",
  },
})) {
  process.stdout.write(text);
}
```

Supported surfaces: `notes`, `docs`, `messages`, `tasks`, `calendar`.

## Login with Coline (OAuth)

Add "Login with Coline" to your app using standard OAuth 2.0 Authorization Code + PKCE.

```ts
import { ColineApiClient, createPkcePair } from "@colineapp/sdk";

const client = new ColineApiClient({ baseUrl: "https://coline.app" });

// 1. Build the authorize URL
const pkce = await createPkcePair();
const authorizeUrl = client.buildLoginWithColineAuthorizeUrl({
  clientId: "col_client_...",
  redirectUri: "https://your-app.com/callback",
  scope: "openid profile email",
  codeChallenge: pkce.challenge,
  codeChallengeMethod: pkce.method,
});
// Redirect the user to authorizeUrl

// 2. Exchange the code (in your callback handler)
const token = await client.exchangeOAuthCode({
  clientId: "col_client_...",
  clientSecret: "col_secret_...",
  code: callbackCode,
  redirectUri: "https://your-app.com/callback",
  codeVerifier: pkce.verifier,
});

// 3. Get user info
const user = await client.getOAuthUserInfo(token.access_token);
console.log(user.email, user.name);
```

Create OAuth clients from the Developer Console under **Login with Coline**.

## Raw OpenAPI Client

For direct spec-driven access:

```ts
import { createAppPlatformClient } from "@colineapp/sdk";

const client = createAppPlatformClient({
  baseUrl: "https://coline.app",
  apiKey: process.env.COLINE_API_KEY!,
});

const { data } = await client.GET("/api/v1/apps");
```

## Regenerate OpenAPI Types

```bash
pnpm sdk:generate:openapi
```
