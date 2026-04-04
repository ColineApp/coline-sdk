import { describe, expect, it } from "vitest";
import { actions, colineUiActionSchema, colineUiNodeSchema, ui } from "./ui";

describe("ui helpers", () => {
  it("builds declarative stack trees", () => {
    const tree = ui.stack([
      ui.heading("Notes"),
      ui.text("Welcome"),
      ui.button("New note", {
        action: {
          type: "create_note",
        },
      }),
    ]);

    const parsed = colineUiNodeSchema.parse(tree);
    expect(parsed.type).toBe("Stack");
  });

  it("builds file cards and empty states", () => {
    const card = ui.fileCard({
      title: "Roadmap",
      subtitle: "Updated just now",
      fileId: "file_123",
    });
    const empty = ui.emptyState({
      title: "No notes yet",
      description: "Create your first note.",
    });

    expect(colineUiNodeSchema.parse(card).type).toBe("FileCard");
    expect(colineUiNodeSchema.parse(empty).type).toBe("EmptyState");
  });

  it("builds typed UI actions", () => {
    expect(
      colineUiActionSchema.parse(actions.openFile("file_123")),
    ).toEqual({
      type: "open_file",
      payload: {
        fileId: "file_123",
      },
    });

    expect(
      colineUiActionSchema.parse(
        actions.createFile({
          name: "Acme Corp",
          typeKey: "acme.customer",
          document: { status: "lead" },
        }),
      ),
    ).toEqual({
      type: "create_file",
      payload: {
        name: "Acme Corp",
        typeKey: "acme.customer",
        document: { status: "lead" },
      },
    });

    expect(
      colineUiActionSchema.parse(actions.navigate("/acme/acme-crm")),
    ).toEqual({
      type: "navigate",
      payload: {
        href: "/acme/acme-crm",
      },
    });
  });
});
