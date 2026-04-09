import { describe, expect, it, vi } from "vitest";
import { ColineApiClient } from "./client";
import { ColineApiError } from "./errors";

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function mockClient(fetchMock: ReturnType<typeof vi.fn>) {
  return new ColineApiClient({
    baseUrl: "https://api.coline.app",
    apiKey: "col_ws_test_key",
    fetch: fetchMock as typeof globalThis.fetch,
  });
}

function expectUrl(fetchMock: ReturnType<typeof vi.fn>, callIndex: number, expected: string) {
  const arg0 = fetchMock.mock.calls[callIndex]?.[0];
  const url = typeof arg0 === "string" ? arg0 : (arg0 as Request).url;
  expect(url).toBe(expected);
}

function expectMethod(fetchMock: ReturnType<typeof vi.fn>, callIndex: number, expected: string) {
  const arg0 = fetchMock.mock.calls[callIndex]?.[0];
  const arg1 = fetchMock.mock.calls[callIndex]?.[1] as RequestInit | undefined;
  // coreRequest passes (url_string, requestInit), openapi-fetch passes (Request)
  const method = typeof arg0 === "string" ? arg1?.method : (arg0 as Request).method;
  expect(method).toBe(expected);
}

function getRequestHeaders(fetchMock: ReturnType<typeof vi.fn>, callIndex: number): Headers {
  const arg0 = fetchMock.mock.calls[callIndex]?.[0];
  const arg1 = fetchMock.mock.calls[callIndex]?.[1] as RequestInit | undefined;
  if (typeof arg0 === "string") {
    return new Headers(arg1?.headers as HeadersInit);
  }
  return new Headers((arg0 as Request).headers);
}

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

describe("Identity API", () => {
  it("lists my workspaces", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: {
          workspaces: [
            {
              id: "ws_123",
              slug: "acme",
              name: "Acme",
              type: "team",
              ownerUserId: "user_1",
              workspaceMemberId: "wm_1",
            },
          ],
        },
      }),
    );
    const client = mockClient(fetchMock);

    const result = await client.listMyWorkspaces();

    expect(result.workspaces).toHaveLength(1);
    expect(result.workspaces[0]?.slug).toBe("acme");
    expectUrl(fetchMock, 0, "https://api.coline.app/api/v1/me/workspaces");
    expectMethod(fetchMock, 0, "GET");
  });
});

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

describe("Notes API", () => {
  it("lists workspace notes with query params", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { notes: [], cursor: null } }),
    );
    const client = mockClient(fetchMock);

    await client.listWorkspaceNotes("ws_123", { q: "roadmap", limit: 10 });

    expectUrl(fetchMock, 0, "https://api.coline.app/api/v1/workspaces/ws_123/notes?q=roadmap&limit=10");
    expectMethod(fetchMock, 0, "GET");
  });

  it("creates a note with title and body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: {
          note: { id: "note_1", title: "Roadmap", body: "Q3 goals" },
        },
      }),
    );
    const client = mockClient(fetchMock);

    const result = await client.createWorkspaceNote("ws_123", {
      title: "Roadmap",
      body: "Q3 goals",
    });

    expect(result.note.id).toBe("note_1");
    expectMethod(fetchMock, 0, "POST");
    expectUrl(fetchMock, 0, "https://api.coline.app/api/v1/workspaces/ws_123/notes");
  });

  it("gets a single note", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: { note: { id: "note_1" }, body: "content" },
      }),
    );
    const client = mockClient(fetchMock);

    await client.getWorkspaceNote("ws_123", "note_1");
    expectUrl(fetchMock, 0, "https://api.coline.app/api/v1/workspaces/ws_123/notes/note_1");
  });

  it("updates a note", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { note: { id: "note_1", title: "Updated" } } }),
    );
    const client = mockClient(fetchMock);

    await client.updateWorkspaceNote("ws_123", "note_1", { title: "Updated" });
    expectMethod(fetchMock, 0, "PUT");
  });

  it("deletes a note", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { ok: true } }),
    );
    const client = mockClient(fetchMock);

    const result = await client.deleteWorkspaceNote("ws_123", "note_1");
    expect(result.ok).toBe(true);
    expectMethod(fetchMock, 0, "DELETE");
  });
});

// ---------------------------------------------------------------------------
// Docs
// ---------------------------------------------------------------------------

describe("Docs API", () => {
  it("lists workspace docs with search", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { docs: [], cursor: null } }),
    );
    const client = mockClient(fetchMock);

    await client.listWorkspaceDocs("ws_123", { q: "api", limit: 5 });
    expectUrl(fetchMock, 0, "https://api.coline.app/api/v1/workspaces/ws_123/docs?q=api&limit=5");
  });

  it("creates a doc with content and layout", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: { doc: { id: "doc_1", title: "API Guide" } },
      }),
    );
    const client = mockClient(fetchMock);

    await client.createWorkspaceDoc("ws_123", {
      title: "API Guide",
      content: { type: "doc", content: [] },
    });

    expectMethod(fetchMock, 0, "POST");
    expectUrl(fetchMock, 0, "https://api.coline.app/api/v1/workspaces/ws_123/docs");
  });

  it("gets, updates, and deletes a doc", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { doc: { id: "doc_1" } } }))
      .mockResolvedValueOnce(jsonResponse({ data: { doc: { id: "doc_1", title: "New" } } }))
      .mockResolvedValueOnce(jsonResponse({ data: { ok: true } }));

    const client = mockClient(fetchMock);

    await client.getWorkspaceDoc("ws_123", "doc_1");
    await client.updateWorkspaceDoc("ws_123", "doc_1", { title: "New" });
    await client.deleteWorkspaceDoc("ws_123", "doc_1");

    expectMethod(fetchMock, 0, "GET");
    expectMethod(fetchMock, 1, "PATCH");
    expectMethod(fetchMock, 2, "DELETE");
  });
});

// ---------------------------------------------------------------------------
// Channels & Messages
// ---------------------------------------------------------------------------

describe("Channels & Messages API", () => {
  it("lists workspace channels", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { channels: [] } }),
    );
    const client = mockClient(fetchMock);

    await client.listWorkspaceChannels("ws_123");
    expectUrl(fetchMock, 0, "https://api.coline.app/api/v1/workspaces/ws_123/channels");
  });

  it("lists channel messages with pagination", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { messages: [], cursor: null } }),
    );
    const client = mockClient(fetchMock);

    await client.listChannelMessages("ws_123", "ch_1", { limit: 25 });
    expectUrl(
      fetchMock,
      0,
      "https://api.coline.app/api/v1/workspaces/ws_123/channels/ch_1/messages?limit=25",
    );
  });

  it("sends a channel message", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { message: { id: "msg_1" } } }),
    );
    const client = mockClient(fetchMock);

    await client.sendChannelMessage("ws_123", "ch_1", { content: [{ type: "text", text: "Hello" }] });
    expectMethod(fetchMock, 0, "POST");
  });

  it("gets, edits, and deletes a message", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { message: { id: "msg_1" } } }))
      .mockResolvedValueOnce(jsonResponse({ data: { message: { id: "msg_1", plaintext: "Updated" } } }))
      .mockResolvedValueOnce(jsonResponse({ data: { ok: true } }));

    const client = mockClient(fetchMock);

    await client.getMessage("ws_123", "msg_1");
    await client.editMessage("ws_123", "msg_1", { content: [{ type: "text", text: "Updated" }] });
    await client.deleteMessage("ws_123", "msg_1");

    expectMethod(fetchMock, 0, "GET");
    expectMethod(fetchMock, 1, "PATCH");
    expectMethod(fetchMock, 2, "DELETE");
  });

  it("manages threads (get + reply)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { thread: { id: "msg_1" }, replies: [] } }))
      .mockResolvedValueOnce(jsonResponse({ data: { message: { id: "msg_2" } } }));

    const client = mockClient(fetchMock);

    await client.getThread("ws_123", "msg_1");
    await client.replyToThread("ws_123", "msg_1", { content: [{ type: "text", text: "Reply" }] });

    expectUrl(fetchMock, 0, "https://api.coline.app/api/v1/workspaces/ws_123/messages/msg_1/thread");
    expectMethod(fetchMock, 1, "POST");
  });

  it("adds and removes reactions", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { ok: true, emoji: "👍" } }))
      .mockResolvedValueOnce(jsonResponse({ data: { ok: true } }));

    const client = mockClient(fetchMock);

    await client.addReaction("ws_123", "msg_1", "👍");
    await client.removeReaction("ws_123", "msg_1", "👍");

    expectMethod(fetchMock, 0, "PUT");
    expectMethod(fetchMock, 1, "DELETE");
    expectUrl(
      fetchMock,
      0,
      "https://api.coline.app/api/v1/workspaces/ws_123/messages/msg_1/reactions/%F0%9F%91%8D",
    );
  });

  it("pins and unpins messages", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { pinned: true } }))
      .mockResolvedValueOnce(jsonResponse({ data: { pinned: false } }));

    const client = mockClient(fetchMock);

    await client.pinMessage("ws_123", "msg_1");
    await client.unpinMessage("ws_123", "msg_1");

    expectMethod(fetchMock, 0, "PUT");
    expectMethod(fetchMock, 1, "DELETE");
    expectUrl(fetchMock, 0, "https://api.coline.app/api/v1/workspaces/ws_123/messages/msg_1/pin");
  });
});

// ---------------------------------------------------------------------------
// Direct Messages
// ---------------------------------------------------------------------------

describe("DMs API", () => {
  it("lists DMs and DM messages", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { dms: [] } }))
      .mockResolvedValueOnce(jsonResponse({ data: { messages: [], cursor: null } }));

    const client = mockClient(fetchMock);

    await client.listWorkspaceDms("ws_123");
    await client.listDmMessages("ws_123", "dm_1", { limit: 10, cursor: "abc" });

    expectUrl(fetchMock, 0, "https://api.coline.app/api/v1/workspaces/ws_123/dms");
    expectUrl(fetchMock, 1, "https://api.coline.app/api/v1/workspaces/ws_123/dms/dm_1/messages?limit=10&cursor=abc");
  });

  it("sends a DM", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { message: { id: "msg_1" } } }),
    );
    const client = mockClient(fetchMock);

    await client.sendDmMessage("ws_123", "dm_1", { content: [{ type: "text", text: "Hey" }] });
    expectMethod(fetchMock, 0, "POST");
    expectUrl(fetchMock, 0, "https://api.coline.app/api/v1/workspaces/ws_123/dms/dm_1/messages");
  });
});

// ---------------------------------------------------------------------------
// Calendar Events
// ---------------------------------------------------------------------------

describe("Calendar API", () => {
  it("lists calendar events in a date range", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { events: [] } }),
    );
    const client = mockClient(fetchMock);

    await client.listCalendarEvents("ws_123", {
      start: "2026-04-01T00:00:00Z",
      end: "2026-04-30T23:59:59Z",
    });

    expectUrl(
      fetchMock,
      0,
      "https://api.coline.app/api/v1/workspaces/ws_123/calendar/events?start=2026-04-01T00%3A00%3A00Z&end=2026-04-30T23%3A59%3A59Z",
    );
  });

  it("creates a calendar event", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { event: { id: "evt_1", title: "Standup" } } }),
    );
    const client = mockClient(fetchMock);

    await client.createCalendarEvent("ws_123", {
      title: "Standup",
      startsAt: "2026-04-05T09:00:00Z",
      endsAt: "2026-04-05T09:30:00Z",
      timeZone: "America/New_York",
    });

    expectMethod(fetchMock, 0, "POST");
  });

  it("gets, updates, and deletes a calendar event", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { event: { id: "evt_1" } } }))
      .mockResolvedValueOnce(jsonResponse({ data: { event: { id: "evt_1", title: "Updated" } } }))
      .mockResolvedValueOnce(jsonResponse({ data: { ok: true } }));

    const client = mockClient(fetchMock);

    await client.getCalendarEvent("ws_123", "evt_1");
    await client.updateCalendarEvent("ws_123", "evt_1", { title: "Updated" });
    await client.deleteCalendarEvent("ws_123", "evt_1");

    expectMethod(fetchMock, 0, "GET");
    expectMethod(fetchMock, 1, "PATCH");
    expectMethod(fetchMock, 2, "DELETE");
  });
});

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

describe("Search API", () => {
  it("searches a workspace", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { results: [], total: 0 } }),
    );
    const client = mockClient(fetchMock);

    await client.searchWorkspace("ws_123", { query: "onboarding" });

    expectMethod(fetchMock, 0, "POST");
    expectUrl(fetchMock, 0, "https://api.coline.app/api/v1/workspaces/ws_123/search");
  });
});

// ---------------------------------------------------------------------------
// Drives & Files
// ---------------------------------------------------------------------------

describe("Drives & Files API", () => {
  it("lists workspace drives", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { drives: [] } }),
    );
    const client = mockClient(fetchMock);

    await client.listWorkspaceDrives("ws_123");
    expectUrl(fetchMock, 0, "https://api.coline.app/api/v1/workspaces/ws_123/drives");
  });

  it("lists drive files with filters", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { files: [], cursor: null } }),
    );
    const client = mockClient(fetchMock);

    await client.listDriveFiles("ws_123", "drive_1", {
      fileType: ".note",
      trashed: false,
      limit: 20,
    });

    expectUrl(
      fetchMock,
      0,
      "https://api.coline.app/api/v1/workspaces/ws_123/drives/drive_1/files?fileType=.note&trashed=false&limit=20",
    );
  });

  it("gets, updates, and deletes a file", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { file: { id: "file_1" } } }))
      .mockResolvedValueOnce(jsonResponse({ data: { file: { id: "file_1", name: "renamed" } } }))
      .mockResolvedValueOnce(jsonResponse({ data: { ok: true } }));

    const client = mockClient(fetchMock);

    await client.getFile("ws_123", "file_1");
    await client.updateFile("ws_123", "file_1", { name: "renamed" });
    await client.deleteFile("ws_123", "file_1");

    expectMethod(fetchMock, 0, "GET");
    expectMethod(fetchMock, 1, "PATCH");
    expectMethod(fetchMock, 2, "DELETE");
  });
});

// ---------------------------------------------------------------------------
// Taskboards & Tasks
// ---------------------------------------------------------------------------

describe("Taskboards & Tasks API", () => {
  it("lists workspace taskboards", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { taskboards: [] } }),
    );
    const client = mockClient(fetchMock);

    await client.listWorkspaceTaskboards("ws_123");
    expectUrl(fetchMock, 0, "https://api.coline.app/api/v1/workspaces/ws_123/taskboards");
  });

  it("lists tasks with filters", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { tasks: [] } }),
    );
    const client = mockClient(fetchMock);

    await client.listTaskboardTasks("ws_123", "board_1", {
      q: "bug",
      statusId: "status_1",
      assigneeUserId: "user_1",
      limit: 50,
    });

    expectUrl(
      fetchMock,
      0,
      "https://api.coline.app/api/v1/workspaces/ws_123/taskboards/board_1/tasks?q=bug&statusId=status_1&assigneeUserId=user_1&limit=50",
    );
  });

  it("creates a task", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { task: { id: "task_1", title: "Fix bug" } } }),
    );
    const client = mockClient(fetchMock);

    await client.createTaskboardTask("ws_123", "board_1", {
      title: "Fix bug",
      priority: "high",
    });

    expectMethod(fetchMock, 0, "POST");
  });

  it("updates and deletes a task", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { ok: true } }))
      .mockResolvedValueOnce(jsonResponse({ data: { ok: true } }));

    const client = mockClient(fetchMock);

    await client.updateTaskboardTask("ws_123", "board_1", "task_1", {
      title: "Fixed bug",
      priority: "low",
    });
    await client.deleteTaskboardTask("ws_123", "board_1", "task_1");

    expectMethod(fetchMock, 0, "PATCH");
    expectMethod(fetchMock, 1, "DELETE");
    expectUrl(
      fetchMock,
      0,
      "https://api.coline.app/api/v1/workspaces/ws_123/taskboards/board_1/tasks/task_1",
    );
  });

  it("gets a single task", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: {
          task: {
            id: "task_1",
            taskboardId: "board_1",
            taskNumber: 42,
            identifier: "ACME-42",
            title: "Fix bug",
            description: "Broken thing",
            descriptionBlocks: [],
            statusId: "status_1",
            status: null,
            priority: "high",
            labels: [],
            dueDate: null,
            assignees: [],
            isCompleted: false,
            completedAt: null,
            sourceMessageId: null,
            threadRootMessageId: null,
            createdByUserId: "user_1",
            createdAt: "2026-04-01T00:00:00.000Z",
            updatedAt: "2026-04-01T00:00:00.000Z",
          },
        },
      }),
    );
    const client = mockClient(fetchMock);

    const result = await client.getTaskboardTask("ws_123", "board_1", "task_1");

    expect(result.task.id).toBe("task_1");
    expectMethod(fetchMock, 0, "GET");
    expectUrl(
      fetchMock,
      0,
      "https://api.coline.app/api/v1/workspaces/ws_123/taskboards/board_1/tasks/task_1",
    );
  });

  it("batch creates tasks", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { task: { id: "task_1" } } }))
      .mockResolvedValueOnce(jsonResponse({ data: { task: { id: "task_2" } } }));

    const client = mockClient(fetchMock);

    const results = await client.batchCreateTasks("ws_123", "board_1", [
      { title: "Task A" },
      { title: "Task B" },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0]?.status).toBe("fulfilled");
    expect(results[1]?.status).toBe("fulfilled");
  });

  it("batch updates tasks", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { ok: true } }))
      .mockResolvedValueOnce(
        jsonResponse({ error: { code: "NOT_FOUND", message: "Not found" } }, 404),
      );

    const client = mockClient(fetchMock);

    const results = await client.batchUpdateTasks("ws_123", "board_1", [
      { taskId: "task_1", title: "Updated" },
      { taskId: "task_999", title: "Missing" },
    ]);

    expect(results[0]?.status).toBe("fulfilled");
    expect(results[1]?.status).toBe("rejected");
  });

  it("batch deletes tasks", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { ok: true } }),
    );
    const client = mockClient(fetchMock);

    const results = await client.batchDeleteTasks("ws_123", "board_1", ["task_1", "task_2"]);
    expect(results).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

describe("Members API", () => {
  it("lists workspace members", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        data: {
          members: [
            { id: "user_1", workspaceMemberId: "wm_1", email: "alice@example.com", firstName: "Alice", lastName: null, avatarUrl: null, joinedAt: "2026-01-01", roles: ["admin"] },
          ],
        },
      }),
    );
    const client = mockClient(fetchMock);

    const result = await client.listWorkspaceMembers("ws_123");
    expect(result.members).toHaveLength(1);
    expect(result.members[0]?.firstName).toBe("Alice");
  });
});

// ---------------------------------------------------------------------------
// Fluent workspace handle
// ---------------------------------------------------------------------------

describe("ColineWorkspace fluent API", () => {
  it("delegates Notes CRUD through workspace handle", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { notes: [], cursor: null } }))
      .mockResolvedValueOnce(jsonResponse({ data: { note: { id: "n_1" } } }))
      .mockResolvedValueOnce(jsonResponse({ data: { note: { id: "n_1" } } }))
      .mockResolvedValueOnce(jsonResponse({ data: { note: { id: "n_1" } } }))
      .mockResolvedValueOnce(jsonResponse({ data: { ok: true } }));

    const ws = mockClient(fetchMock).workspace("ws_123");

    await ws.listNotes();
    await ws.createNote({ title: "Test" });
    await ws.getNote("n_1");
    await ws.updateNote("n_1", { title: "Updated" });
    await ws.deleteNote("n_1");

    expect(fetchMock).toHaveBeenCalledTimes(5);
    expectUrl(fetchMock, 0, "https://api.coline.app/api/v1/workspaces/ws_123/notes");
  });

  it("delegates Docs CRUD through workspace handle", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { docs: [] } }))
      .mockResolvedValueOnce(jsonResponse({ data: { doc: { id: "d_1" } } }));

    const ws = mockClient(fetchMock).workspace("ws_123");

    await ws.listDocs();
    await ws.createDoc({ title: "Design" });

    expectUrl(fetchMock, 0, "https://api.coline.app/api/v1/workspaces/ws_123/docs");
    expectUrl(fetchMock, 1, "https://api.coline.app/api/v1/workspaces/ws_123/docs");
  });

  it("delegates Calendar CRUD through workspace handle", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { events: [] } }))
      .mockResolvedValueOnce(jsonResponse({ data: { event: { id: "e_1" } } }));

    const ws = mockClient(fetchMock).workspace("ws_123");

    await ws.listCalendarEvents({ start: "2026-04-01", end: "2026-04-30" });
    await ws.createCalendarEvent({
      title: "Meet",
      startsAt: "2026-04-05T09:00:00Z",
      endsAt: "2026-04-05T10:00:00Z",
      timeZone: "UTC",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("delegates Task CRUD through workspace handle", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { taskboards: [] } }))
      .mockResolvedValueOnce(jsonResponse({ data: { tasks: [] } }))
      .mockResolvedValueOnce(jsonResponse({ data: { task: { id: "t_1" } } }))
      .mockResolvedValueOnce(jsonResponse({ data: { task: { id: "t_1" } } }));

    const ws = mockClient(fetchMock).workspace("ws_123");

    await ws.listTaskboards();
    await ws.listTasks("board_1");
    await ws.createTask("board_1", { title: "Ship it" });
    await ws.getTask("board_1", "t_1");

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expectUrl(
      fetchMock,
      3,
      "https://api.coline.app/api/v1/workspaces/ws_123/taskboards/board_1/tasks/t_1",
    );
  });

  it("supports chainable task handles", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { task: { id: "task_123" } } }))
      .mockResolvedValueOnce(jsonResponse({ data: { ok: true } }))
      .mockResolvedValueOnce(jsonResponse({ data: { ok: true } }));

    const ws = mockClient(fetchMock).workspace("ws_123");
    const task = ws.taskboard("board_123").task("task_123");

    await task.get();
    await task.update({ title: "Done" });
    await task.delete();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expectUrl(
      fetchMock,
      0,
      "https://api.coline.app/api/v1/workspaces/ws_123/taskboards/board_123/tasks/task_123",
    );
  });

  it("delegates search through workspace handle", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { results: [], total: 0 } }),
    );
    const ws = mockClient(fetchMock).workspace("ws_123");

    await ws.search({ query: "sdk" });
    expectUrl(fetchMock, 0, "https://api.coline.app/api/v1/workspaces/ws_123/search");
  });
});

// ---------------------------------------------------------------------------
// Retries
// ---------------------------------------------------------------------------

describe("Retry logic", () => {
  it("retries on 429 and 5xx then succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ error: { code: "RATE_LIMIT", message: "Too fast" } }, 429),
      )
      .mockResolvedValueOnce(
        jsonResponse({ error: { code: "INTERNAL", message: "Oops" } }, 500),
      )
      .mockResolvedValueOnce(
        jsonResponse({ data: { notes: [] } }),
      );

    const client = new ColineApiClient({
      baseUrl: "https://api.coline.app",
      apiKey: "test-key",
      fetch: fetchMock,
      maxRetries: 2,
    });

    const result = await client.listWorkspaceNotes("ws_123");
    expect(result.notes).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("throws after exhausting retries", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ error: { code: "INTERNAL", message: "Oops" } }, 500),
    );

    const client = new ColineApiClient({
      baseUrl: "https://api.coline.app",
      apiKey: "test-key",
      fetch: fetchMock,
      maxRetries: 1,
    });

    await expect(client.listWorkspaceNotes("ws_123")).rejects.toBeInstanceOf(ColineApiError);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry on 4xx (non-429)", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ error: { code: "FORBIDDEN", message: "Denied" } }, 403),
    );

    const client = new ColineApiClient({
      baseUrl: "https://api.coline.app",
      apiKey: "test-key",
      fetch: fetchMock,
      maxRetries: 3,
    });

    await expect(client.listWorkspaceNotes("ws_123")).rejects.toBeInstanceOf(ColineApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// Streaming
// ---------------------------------------------------------------------------

describe("Tab streaming", () => {
  it("streams Tab text chunks from SSE", async () => {
    const sseBody = [
      'data: {"id":"c_1","object":"chat.completion.chunk","created":1,"model":"tab-v1","choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null}]}\n\n',
      'data: {"id":"c_1","object":"chat.completion.chunk","created":1,"model":"tab-v1","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}\n\n',
      'data: {"id":"c_1","object":"chat.completion.chunk","created":1,"model":"tab-v1","choices":[{"index":0,"delta":{"content":" world"},"finish_reason":null}]}\n\n',
      'data: {"id":"c_1","object":"chat.completion.chunk","created":1,"model":"tab-v1","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\n',
      "data: [DONE]\n\n",
    ].join("");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(sseBody, {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      }),
    );

    const client = mockClient(fetchMock);
    const chunks: string[] = [];

    for await (const text of client.streamTabText({
      tab_context: {
        surface: "notes",
        workspace_slug: "acme",
        entity_id: "note_1",
        active_text_before_cursor: "Hi",
      },
    })) {
      chunks.push(text);
    }

    expect(chunks).toEqual(["Hello", " world"]);
  });

  it("throws on non-200 streaming response", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: "FORBIDDEN", message: "No" } }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const client = mockClient(fetchMock);

    const gen = client.streamTabText({
      tab_context: { surface: "notes", workspace_slug: "acme", entity_id: "n_1", active_text_before_cursor: "test" },
    });

    await expect(gen.next()).rejects.toBeInstanceOf(ColineApiError);
  });
});

// ---------------------------------------------------------------------------
// Uploads
// ---------------------------------------------------------------------------

describe("Uploads API", () => {
  it("initiates and completes a multi-part upload", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ data: { uploadId: "up_1", partCount: 2 } }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ data: { partNumber: 1, etag: "etag_1" } }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ data: { partNumber: 2, etag: "etag_2" } }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ data: { file: { id: "file_1" } } }),
      );

    const client = mockClient(fetchMock);

    await client.initiateUpload("ws_123", {
      fileName: "report.pdf",
      mimeType: "application/pdf",
      sizeBytes: 2048,
      driveId: "drive_1",
    });

    await client.uploadPart("ws_123", "up_1", 1, new Uint8Array(1024));
    await client.uploadPart("ws_123", "up_1", 2, new Uint8Array(1024));

    const result = await client.completeUpload("ws_123", "up_1", [
      { partNumber: 1, etag: "etag_1" },
      { partNumber: 2, etag: "etag_2" },
    ]);

    expect(result.file.id).toBe("file_1");
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it("uploads a file in one call via uploadFile helper", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ data: { uploadId: "up_1", partCount: 1 } }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ data: { partNumber: 1, etag: "etag_1" } }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ data: { file: { id: "file_1", name: "photo.jpg" } } }),
      );

    const client = mockClient(fetchMock);

    const result = await client.uploadFile("ws_123", {
      data: new Uint8Array(512),
      fileName: "photo.jpg",
      mimeType: "image/jpeg",
      driveId: "drive_1",
    });

    expect(result.file.id).toBe("file_1");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

describe("Error handling", () => {
  it("ColineApiError has correct properties", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ error: { code: "NOT_FOUND", message: "Note not found." } }, 404),
    );

    const client = mockClient(fetchMock);

    try {
      await client.getWorkspaceNote("ws_123", "note_999");
      expect.unreachable("Should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(ColineApiError);
      const apiError = error as ColineApiError;
      expect(apiError.status).toBe(404);
      expect(apiError.code).toBe("NOT_FOUND");
      expect(apiError.message).toBe("Note not found.");
      expect(apiError.isRetryable).toBe(false);
    }
  });

  it("429 errors are marked retryable", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ error: { code: "RATE_LIMIT_EXCEEDED", message: "Slow down." } }, 429),
    );

    const client = mockClient(fetchMock);

    try {
      await client.listWorkspaceNotes("ws_123");
      expect.unreachable("Should have thrown");
    } catch (error) {
      const apiError = error as ColineApiError;
      expect(apiError.isRetryable).toBe(true);
    }
  });

  it("500 errors are marked retryable", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ error: { code: "INTERNAL", message: "Oops." } }, 500),
    );

    const client = mockClient(fetchMock);

    try {
      await client.listWorkspaceNotes("ws_123");
      expect.unreachable("Should have thrown");
    } catch (error) {
      const apiError = error as ColineApiError;
      expect(apiError.isRetryable).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Auth header injection
// ---------------------------------------------------------------------------

describe("Auth headers", () => {
  it("sends Bearer token on core API requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { notes: [] } }),
    );

    const client = new ColineApiClient({
      baseUrl: "https://api.coline.app",
      apiKey: "col_ws_abc_secret123",
      fetch: fetchMock,
    });

    await client.listWorkspaceNotes("ws_123");

    const headers = getRequestHeaders(fetchMock, 0);
    expect(headers.get("Authorization")).toBe("Bearer col_ws_abc_secret123");
  });

  it("sends custom headers alongside auth", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { notes: [] } }),
    );

    const client = new ColineApiClient({
      baseUrl: "https://api.coline.app",
      apiKey: "key",
      fetch: fetchMock,
      headers: { "X-Custom": "value" },
    });

    await client.listWorkspaceNotes("ws_123");

    const headers = getRequestHeaders(fetchMock, 0);
    expect(headers.get("Authorization")).toBe("Bearer key");
    expect(headers.get("X-Custom")).toBe("value");
  });
});

// ---------------------------------------------------------------------------
// App runtime (notifications, index, ambient)
// ---------------------------------------------------------------------------

describe("App Runtime API", () => {
  it("sends app notifications", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { delivered: 1 } }),
    );
    const client = mockClient(fetchMock);

    await client.createAppNotification("ws_123", "acme-crm", {
      channelKey: "alerts",
      typeKey: "new_lead",
      title: "New lead",
      body: "Acme Corp signed up",
      recipients: [{ userId: "user_1" }],
    });

    expectMethod(fetchMock, 0, "POST");
    expectUrl(
      fetchMock,
      0,
      "https://api.coline.app/api/v1/workspaces/ws_123/apps/acme-crm/notifications",
    );
  });

  it("upserts and deletes index documents", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { upserted: 2 } }))
      .mockResolvedValueOnce(jsonResponse({ data: { deleted: 1 } }));

    const client = mockClient(fetchMock);

    await client.upsertAppIndexDocuments("ws_123", "acme-crm", {
      documents: [
        { documentKey: "doc_1", documentType: "help", title: "Help", body: "How to use" },
        { documentKey: "doc_2", documentType: "help", title: "FAQ", body: "Common questions" },
      ],
    });

    await client.deleteAppIndexDocuments("ws_123", "acme-crm", {
      documentKeys: ["doc_1"],
    });

    expectMethod(fetchMock, 0, "POST");
    expectMethod(fetchMock, 1, "DELETE");
  });

  it("emits ambient events", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { accepted: 1 } }),
    );
    const client = mockClient(fetchMock);

    await client.emitAppAmbientEvents("ws_123", "acme-crm", {
      events: [
        {
          action: "created",
          entityType: "app_document",
          entityId: "lead_1",
          containerType: "channel",
          containerId: "ch_1",
          dedupeKey: "lead_scored_lead_1",
        },
      ],
    });

    expectUrl(
      fetchMock,
      0,
      "https://api.coline.app/api/v1/workspaces/ws_123/apps/acme-crm/ambient/events",
    );
  });
});

// ---------------------------------------------------------------------------
// URL encoding
// ---------------------------------------------------------------------------

describe("URL encoding", () => {
  it("encodes special characters in path segments", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ data: { notes: [] } }),
    );
    const client = mockClient(fetchMock);

    await client.listWorkspaceNotes("ws/with/slashes");
    expectUrl(
      fetchMock,
      0,
      "https://api.coline.app/api/v1/workspaces/ws%2Fwith%2Fslashes/notes",
    );
  });
});
