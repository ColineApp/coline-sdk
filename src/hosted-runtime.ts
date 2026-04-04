import { z } from "zod/v4";
import { colineUiActionSchema } from "./ui";
import {
  COLINE_DELIVERY_HEADER,
  COLINE_SIGNATURE_HEADER,
  COLINE_TIMESTAMP_HEADER,
  verifyAppRequestSignature,
} from "./signing";

export const colineHostedWorkspaceSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
});

export const colineHostedAppSchema = z.object({
  appInstallId: z.string().min(1),
  appId: z.string().min(1),
  appKey: z.string().min(1),
  name: z.string().min(1),
});

export const colineHostedActorSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  handle: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
});

export const colineHostedFileSchema = z.object({
  id: z.string().min(1),
  typeKey: z.string().min(1),
  title: z.string().optional(),
});

export const colineHostedRenderHomeRequestSchema = z.object({
  workspace: colineHostedWorkspaceSchema,
  app: colineHostedAppSchema,
  actor: colineHostedActorSchema.nullable().optional(),
});

export const colineHostedRenderFileRequestSchema = z.object({
  workspace: colineHostedWorkspaceSchema,
  app: colineHostedAppSchema,
  actor: colineHostedActorSchema.nullable().optional(),
  file: colineHostedFileSchema,
  document: z.record(z.string(), z.unknown()),
});

export const colineHostedActionRequestSchema = z.object({
  workspace: colineHostedWorkspaceSchema,
  app: colineHostedAppSchema,
  actor: colineHostedActorSchema.nullable().optional(),
  action: colineUiActionSchema,
  file: colineHostedFileSchema.nullable().optional(),
});

export const colineHostedActionResponseSchema = z.union([
  z.object({ type: z.literal("ok") }),
  z.object({ type: z.literal("refresh") }),
  z.object({
    type: z.literal("navigate"),
    href: z.string().min(1),
  }),
  z.object({
    type: z.literal("open_file"),
    fileId: z.string().min(1),
  }),
]);

export type ColineHostedWorkspace = z.infer<typeof colineHostedWorkspaceSchema>;
export type ColineHostedApp = z.infer<typeof colineHostedAppSchema>;
export type ColineHostedActor = z.infer<typeof colineHostedActorSchema>;
export type ColineHostedFile = z.infer<typeof colineHostedFileSchema>;
export type ColineHostedRenderHomeRequest = z.infer<
  typeof colineHostedRenderHomeRequestSchema
>;
export type ColineHostedRenderFileRequest = z.infer<
  typeof colineHostedRenderFileRequestSchema
>;
export type ColineHostedActionRequest = z.infer<
  typeof colineHostedActionRequestSchema
>;
export type ColineHostedActionResponse = z.infer<
  typeof colineHostedActionResponseSchema
>;

export async function parseSignedColineRequest<T>(params: {
  request: Request;
  secret: string;
  schema: z.ZodType<T>;
}): Promise<{
  deliveryId: string;
  timestamp: string;
  data: T;
}> {
  const signature = params.request.headers.get(COLINE_SIGNATURE_HEADER);
  const timestamp = params.request.headers.get(COLINE_TIMESTAMP_HEADER);
  const deliveryId = params.request.headers.get(COLINE_DELIVERY_HEADER);
  const body = await params.request.text();

  if (!signature || !timestamp || !deliveryId) {
    throw new Error("Missing required Coline signing headers.");
  }

  const isValid = await verifyAppRequestSignature({
    secret: params.secret,
    timestamp,
    body,
    signature,
  });

  if (!isValid) {
    throw new Error("Invalid Coline request signature.");
  }

  const parsedBody = JSON.parse(body) as unknown;

  return {
    deliveryId,
    timestamp,
    data: params.schema.parse(parsedBody),
  };
}

export const hostedActionResults = {
  ok(): ColineHostedActionResponse {
    return { type: "ok" };
  },
  refresh(): ColineHostedActionResponse {
    return { type: "refresh" };
  },
  navigate(href: string): ColineHostedActionResponse {
    return colineHostedActionResponseSchema.parse({
      type: "navigate",
      href,
    });
  },
  openFile(fileId: string): ColineHostedActionResponse {
    return colineHostedActionResponseSchema.parse({
      type: "open_file",
      fileId,
    });
  },
};
