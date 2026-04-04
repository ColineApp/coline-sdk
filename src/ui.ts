import { z } from "zod/v4";

const uiActionSchema = z.object({
  type: z.string().trim().min(1).max(120),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export type ColineUiAction = z.infer<typeof uiActionSchema>;

const uiTextNodeSchema = z.object({
  type: z.literal("Text"),
  props: z.object({
    value: z.string(),
    tone: z.enum(["default", "muted", "positive", "warning", "danger"]).optional(),
  }),
});

const uiHeadingNodeSchema = z.object({
  type: z.literal("Heading"),
  props: z.object({
    value: z.string().min(1).max(500),
    level: z.int().min(1).max(4).default(2),
  }),
});

const uiBadgeNodeSchema = z.object({
  type: z.literal("Badge"),
  props: z.object({
    value: z.string().min(1).max(120),
    tone: z.enum(["default", "muted", "positive", "warning", "danger"]).default("default"),
  }),
});

const uiButtonNodeSchema = z.object({
  type: z.literal("Button"),
  props: z.object({
    label: z.string().min(1).max(120),
    variant: z.enum(["primary", "secondary", "ghost", "danger"]).default("primary"),
    action: uiActionSchema,
  }),
});

const uiDividerNodeSchema = z.object({
  type: z.literal("Divider"),
  props: z.object({}).default({}),
});

const uiFileCardNodeSchema = z.object({
  type: z.literal("FileCard"),
  props: z.object({
    title: z.string().min(1).max(200),
    subtitle: z.string().max(500).optional(),
    fileId: z.string().trim().min(1).max(200).optional(),
    action: uiActionSchema.optional(),
  }),
});

const uiUserChipNodeSchema = z.object({
  type: z.literal("UserChip"),
  props: z.object({
    label: z.string().min(1).max(120),
    userId: z.string().trim().min(1).max(200).optional(),
  }),
});

const uiEmptyStateNodeSchema = z.object({
  type: z.literal("EmptyState"),
  props: z.object({
    title: z.string().min(1).max(160),
    description: z.string().max(1000).optional(),
    action: uiActionSchema.optional(),
  }),
});

const uiImageNodeSchema = z.object({
  type: z.literal("Image"),
  props: z.object({
    src: z.string().url().max(2000),
    alt: z.string().max(500).default(""),
    width: z.number().int().min(1).max(4096).optional(),
    height: z.number().int().min(1).max(4096).optional(),
  }),
});

const uiLinkNodeSchema = z.object({
  type: z.literal("Link"),
  props: z.object({
    label: z.string().min(1).max(500),
    href: z.string().url().max(2000),
    external: z.boolean().default(false),
  }),
});

const uiCodeBlockNodeSchema = z.object({
  type: z.literal("CodeBlock"),
  props: z.object({
    code: z.string().max(50000),
    language: z.string().max(50).optional(),
  }),
});

const uiInputNodeSchema = z.object({
  type: z.literal("Input"),
  props: z.object({
    name: z.string().min(1).max(120),
    label: z.string().max(200).optional(),
    placeholder: z.string().max(200).optional(),
    defaultValue: z.string().max(5000).optional(),
    type: z.enum(["text", "number", "email", "url", "textarea"]).default("text"),
    required: z.boolean().default(false),
  }),
});

const uiSelectNodeSchema = z.object({
  type: z.literal("Select"),
  props: z.object({
    name: z.string().min(1).max(120),
    label: z.string().max(200).optional(),
    options: z.array(
      z.object({
        value: z.string().min(1).max(200),
        label: z.string().min(1).max(200),
      }),
    ).min(1).max(100),
    defaultValue: z.string().max(200).optional(),
    required: z.boolean().default(false),
  }),
});

const uiTableNodeSchema = z.object({
  type: z.literal("Table"),
  props: z.object({
    columns: z.array(
      z.object({
        key: z.string().min(1).max(120),
        label: z.string().min(1).max(200),
        align: z.enum(["left", "center", "right"]).default("left"),
      }),
    ).min(1).max(20),
    rows: z.array(
      z.record(z.string(), z.string()),
    ).max(200),
  }),
});

type ColineUiNodeBase =
  | z.infer<typeof uiTextNodeSchema>
  | z.infer<typeof uiHeadingNodeSchema>
  | z.infer<typeof uiBadgeNodeSchema>
  | z.infer<typeof uiButtonNodeSchema>
  | z.infer<typeof uiDividerNodeSchema>
  | z.infer<typeof uiFileCardNodeSchema>
  | z.infer<typeof uiUserChipNodeSchema>
  | z.infer<typeof uiEmptyStateNodeSchema>
  | z.infer<typeof uiImageNodeSchema>
  | z.infer<typeof uiLinkNodeSchema>
  | z.infer<typeof uiCodeBlockNodeSchema>
  | z.infer<typeof uiInputNodeSchema>
  | z.infer<typeof uiSelectNodeSchema>
  | z.infer<typeof uiTableNodeSchema>;

export type ColineUiNode = ColineUiNodeBase | ColineUiStackNode;

export interface ColineUiStackNode {
  type: "Stack";
  props: {
    direction?: "vertical" | "horizontal";
    gap?: "xs" | "sm" | "md" | "lg";
    children: ColineUiNode[];
  };
}

const uiNodeLazySchema: z.ZodType<ColineUiNode> = z.lazy(() =>
  z.union([
    uiTextNodeSchema,
    uiHeadingNodeSchema,
    uiBadgeNodeSchema,
    uiButtonNodeSchema,
    uiDividerNodeSchema,
    uiFileCardNodeSchema,
    uiUserChipNodeSchema,
    uiEmptyStateNodeSchema,
    uiImageNodeSchema,
    uiLinkNodeSchema,
    uiCodeBlockNodeSchema,
    uiInputNodeSchema,
    uiSelectNodeSchema,
    uiTableNodeSchema,
    z.object({
      type: z.literal("Stack"),
      props: z.object({
        direction: z.enum(["vertical", "horizontal"]).default("vertical"),
        gap: z.enum(["xs", "sm", "md", "lg"]).default("md"),
        children: z.array(uiNodeLazySchema),
      }),
    }),
  ]),
);

export const colineUiNodeSchema = uiNodeLazySchema;
export const colineUiActionSchema = uiActionSchema;

export const actions = {
  openFile(fileId: string, payload: Record<string, unknown> = {}): ColineUiAction {
    return colineUiActionSchema.parse({
      type: "open_file",
      payload: {
        fileId,
        ...payload,
      },
    });
  },

  openAppHome(payload: Record<string, unknown> = {}): ColineUiAction {
    return colineUiActionSchema.parse({
      type: "open_app_home",
      payload,
    });
  },

  navigate(href: string, payload: Record<string, unknown> = {}): ColineUiAction {
    return colineUiActionSchema.parse({
      type: "navigate",
      payload: {
        href,
        ...payload,
      },
    });
  },

  createFile(input: {
    name: string;
    typeKey: string;
    driveId?: string;
    parentId?: string | null;
    document?: Record<string, unknown>;
  }): ColineUiAction {
    const payload: Record<string, unknown> = {
      name: input.name,
      typeKey: input.typeKey,
    };

    if (input.driveId) {
      payload["driveId"] = input.driveId;
    }

    if (input.parentId !== undefined) {
      payload["parentId"] = input.parentId;
    }

    if (input.document) {
      payload["document"] = input.document;
    }

    return colineUiActionSchema.parse({
      type: "create_file",
      payload,
    });
  },

  custom(type: string, payload: Record<string, unknown> = {}): ColineUiAction {
    return colineUiActionSchema.parse({
      type,
      payload,
    });
  },
};

export const ui = {
  text(
    value: string,
    options: {
      tone?: "default" | "muted" | "positive" | "warning" | "danger";
    } = {},
  ): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Text",
      props: {
        value,
        ...(options.tone ? { tone: options.tone } : {}),
      },
    });
  },

  heading(
    value: string,
    options: {
      level?: 1 | 2 | 3 | 4;
    } = {},
  ): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Heading",
      props: {
        value,
        ...(options.level ? { level: options.level } : {}),
      },
    });
  },

  badge(
    value: string,
    options: {
      tone?: "default" | "muted" | "positive" | "warning" | "danger";
    } = {},
  ): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Badge",
      props: {
        value,
        ...(options.tone ? { tone: options.tone } : {}),
      },
    });
  },

  button(
    label: string,
    options: {
      variant?: "primary" | "secondary" | "ghost" | "danger";
      action: ColineUiAction;
    },
  ): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Button",
      props: {
        label,
        action: options.action,
        ...(options.variant ? { variant: options.variant } : {}),
      },
    });
  },

  divider(): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Divider",
      props: {},
    });
  },

  fileCard(input: {
    title: string;
    subtitle?: string;
    fileId?: string;
    action?: ColineUiAction;
  }): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "FileCard",
      props: {
        title: input.title,
        ...(input.subtitle ? { subtitle: input.subtitle } : {}),
        ...(input.fileId ? { fileId: input.fileId } : {}),
        ...(input.action ? { action: input.action } : {}),
      },
    });
  },

  userChip(input: {
    label: string;
    userId?: string;
  }): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "UserChip",
      props: {
        label: input.label,
        ...(input.userId ? { userId: input.userId } : {}),
      },
    });
  },

  emptyState(input: {
    title: string;
    description?: string;
    action?: ColineUiAction;
  }): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "EmptyState",
      props: {
        title: input.title,
        ...(input.description ? { description: input.description } : {}),
        ...(input.action ? { action: input.action } : {}),
      },
    });
  },

  stack(
    children: ColineUiNode[],
    options: {
      direction?: "vertical" | "horizontal";
      gap?: "xs" | "sm" | "md" | "lg";
    } = {},
  ): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Stack",
      props: {
        children,
        ...(options.direction ? { direction: options.direction } : {}),
        ...(options.gap ? { gap: options.gap } : {}),
      },
    });
  },

  /** Alias for `stack(children, { direction: "horizontal", ...options })`. */
  row(
    children: ColineUiNode[],
    options: {
      gap?: "xs" | "sm" | "md" | "lg";
    } = {},
  ): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Stack",
      props: {
        children,
        direction: "horizontal",
        ...(options.gap ? { gap: options.gap } : {}),
      },
    });
  },

  image(input: {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
  }): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Image",
      props: {
        src: input.src,
        ...(input.alt ? { alt: input.alt } : {}),
        ...(input.width ? { width: input.width } : {}),
        ...(input.height ? { height: input.height } : {}),
      },
    });
  },

  link(
    label: string,
    href: string,
    options: { external?: boolean } = {},
  ): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Link",
      props: {
        label,
        href,
        ...(options.external ? { external: true } : {}),
      },
    });
  },

  codeBlock(
    code: string,
    options: { language?: string } = {},
  ): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "CodeBlock",
      props: {
        code,
        ...(options.language ? { language: options.language } : {}),
      },
    });
  },

  input(input: {
    name: string;
    label?: string;
    placeholder?: string;
    defaultValue?: string;
    type?: "text" | "number" | "email" | "url" | "textarea";
    required?: boolean;
  }): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Input",
      props: {
        name: input.name,
        ...(input.label ? { label: input.label } : {}),
        ...(input.placeholder ? { placeholder: input.placeholder } : {}),
        ...(input.defaultValue ? { defaultValue: input.defaultValue } : {}),
        ...(input.type ? { type: input.type } : {}),
        ...(input.required ? { required: true } : {}),
      },
    });
  },

  select(input: {
    name: string;
    label?: string;
    options: Array<{ value: string; label: string }>;
    defaultValue?: string;
    required?: boolean;
  }): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Select",
      props: {
        name: input.name,
        options: input.options,
        ...(input.label ? { label: input.label } : {}),
        ...(input.defaultValue ? { defaultValue: input.defaultValue } : {}),
        ...(input.required ? { required: true } : {}),
      },
    });
  },

  table(input: {
    columns: Array<{
      key: string;
      label: string;
      align?: "left" | "center" | "right";
    }>;
    rows: Array<Record<string, string>>;
  }): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Table",
      props: {
        columns: input.columns,
        rows: input.rows,
      },
    });
  },
};
