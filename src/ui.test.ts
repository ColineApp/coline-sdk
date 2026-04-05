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

  it("builds cards with children and footer", () => {
    const card = ui.card({
      title: "Settings",
      description: "Manage preferences",
      children: [ui.text("Hello")],
      footer: [ui.button("Save", { action: actions.custom("save") })],
    });

    const parsed = colineUiNodeSchema.parse(card);
    expect(parsed.type).toBe("Card");
  });

  it("builds tabs with content", () => {
    const tabs = ui.tabs({
      tabs: [
        { label: "Overview", value: "overview", content: [ui.text("Overview content")] },
        { label: "Details", value: "details", content: [ui.text("Details content")] },
      ],
      defaultValue: "overview",
    });

    const parsed = colineUiNodeSchema.parse(tabs);
    expect(parsed.type).toBe("Tabs");
  });

  it("builds form with submit action", () => {
    const form = ui.form({
      children: [
        ui.input({ name: "email", label: "Email", type: "email", required: true }),
        ui.select({
          name: "role",
          label: "Role",
          options: [
            { value: "admin", label: "Admin" },
            { value: "member", label: "Member" },
          ],
        }),
      ],
      submitAction: actions.custom("submit_form"),
      submitLabel: "Create",
    });

    const parsed = colineUiNodeSchema.parse(form);
    expect(parsed.type).toBe("Form");
  });

  it("builds avatar, checkbox, switch, and progress", () => {
    expect(ui.avatar({ fallback: "JD", src: "https://example.com/avatar.png" }).type).toBe("Avatar");
    expect(ui.checkbox({ name: "agree", label: "I agree" }).type).toBe("Checkbox");
    expect(ui.switch({ name: "dark", label: "Dark mode", defaultChecked: true }).type).toBe("Switch");
    expect(ui.progress(75, { label: "Uploading…" }).type).toBe("Progress");
  });

  it("builds alert, toggle, slider, and skeleton", () => {
    expect(ui.alert({ title: "Warning", tone: "warning" }).type).toBe("Alert");
    expect(ui.toggle({ label: "Bold" }).type).toBe("Toggle");
    expect(ui.slider({ name: "volume", min: 0, max: 100, defaultValue: 50 }).type).toBe("Slider");
    expect(ui.skeleton({ width: "200px", height: "20px" }).type).toBe("Skeleton");
  });

  it("builds collapsible, breadcrumb, field, and menu", () => {
    const col = ui.collapsible({
      title: "Advanced",
      children: [ui.text("Hidden content")],
      defaultOpen: true,
    });
    expect(col.type).toBe("Collapsible");

    const bc = ui.breadcrumb({
      items: [
        { label: "Home", href: "/" },
        { label: "Settings" },
      ],
    });
    expect(bc.type).toBe("Breadcrumb");

    const field = ui.field({
      label: "Name",
      description: "Your full name",
      children: [ui.input({ name: "name" })],
    });
    expect(field.type).toBe("Field");

    const menu = ui.menu({
      trigger: "Actions",
      items: [
        { label: "Edit", action: actions.custom("edit") },
        { label: "Delete", action: actions.custom("delete"), tone: "danger" },
      ],
    });
    expect(menu.type).toBe("Menu");
  });

  it("builds radio group", () => {
    const rg = ui.radioGroup({
      name: "size",
      label: "Size",
      options: [
        { value: "sm", label: "Small" },
        { value: "md", label: "Medium" },
        { value: "lg", label: "Large" },
      ],
      defaultValue: "md",
    });
    expect(rg.type).toBe("RadioGroup");
  });
});
