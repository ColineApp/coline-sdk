/**
 * Example: Manage workspace apps with the Coline API.
 *
 * App registration and version publishing is done through the Developer Console
 * (web UI). Once an app is published and installed, you can manage it
 * programmatically using a workspace API key with the `apps.read` and
 * `apps.write` scopes.
 */
import { ColineApiClient } from "../client";

const client = new ColineApiClient({
  baseUrl: "https://coline.app",
  apiKey: "col_ws_example_key",
});

async function main() {
  const ws = client.workspace("acme");

  // List installed apps
  const { installedApps } = await ws.listApps();
  console.log("Installed apps:", installedApps.map((a) => a.name));

  // Get a specific installed app
  const app = ws.app("com.example.notes");
  const { install } = await app.get();
  console.log("App:", install.name, "Status:", install.status);

  // Create an app-owned file
  const { file } = await app.createFile({
    name: "Meeting notes",
    typeKey: "com.example.notes.note",
    document: { status: "open" },
  });
  console.log("Created file:", file.id);

  // Update the file's document
  await app.file(file.id).updateDocument({ status: "done" });

  // Send a notification through the app
  await app.createNotification({
    channelKey: "updates",
    typeKey: "note.completed",
    title: "Note completed",
    body: `"Meeting notes" was marked as done.`,
    recipients: [{ userId: "user_123" }],
  });
}

void main();
