import {
  actions,
  colineHostedActionRequestSchema,
  colineHostedRenderFileRequestSchema,
  colineHostedRenderHomeRequestSchema,
  hostedActionResults,
  parseSignedColineRequest,
  ui,
} from "../index";

const COLINE_DELIVERY_SECRET =
  (
    globalThis as {
      process?: {
        env?: Record<string, string | undefined>;
      };
    }
  ).process?.env?.["COLINE_DELIVERY_SECRET"] ?? "";

export async function handleRenderHome(request: Request) {
  const { data } = await parseSignedColineRequest({
    request,
    secret: COLINE_DELIVERY_SECRET,
    schema: colineHostedRenderHomeRequestSchema,
  });

  const tree = ui.stack(
    [
      ui.heading("CRM"),
      ui.text(`Workspace: ${data.workspace.name}`),
      ui.button("New customer", {
        action: actions.createFile({
          name: "New customer",
          typeKey: "acme.customer",
          document: {
            status: "lead",
          },
        }),
      }),
    ],
    { gap: "md" },
  );

  return Response.json(tree);
}

export async function handleRenderFile(request: Request) {
  const { data } = await parseSignedColineRequest({
    request,
    secret: COLINE_DELIVERY_SECRET,
    schema: colineHostedRenderFileRequestSchema,
  });

  const status =
    typeof data.document["status"] === "string" ? data.document["status"] : "unknown";

  return Response.json(
    ui.stack(
      [
        ui.heading(data.file.title ?? "Customer"),
        ui.badge(status),
        ui.button("Open in Coline", {
          action: actions.openFile(data.file.id),
        }),
      ],
      { gap: "md" },
    ),
  );
}

export async function handleAction(request: Request) {
  const { data } = await parseSignedColineRequest({
    request,
    secret: COLINE_DELIVERY_SECRET,
    schema: colineHostedActionRequestSchema,
  });

  if (data.action.type === "crm.sync") {
    return Response.json(hostedActionResults.refresh());
  }

  return Response.json(hostedActionResults.ok());
}
