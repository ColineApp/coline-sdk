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

// ---------------------------------------------------------------------------
// Extended component schemas
// ---------------------------------------------------------------------------

const uiAvatarNodeSchema = z.object({
  type: z.literal("Avatar"),
  props: z.object({
    src: z.string().url().max(2000).optional(),
    fallback: z.string().min(1).max(10),
    size: z.enum(["sm", "default", "lg"]).default("default"),
  }),
});

const uiCheckboxNodeSchema = z.object({
  type: z.literal("Checkbox"),
  props: z.object({
    name: z.string().min(1).max(120),
    label: z.string().max(200).optional(),
    defaultChecked: z.boolean().default(false),
    action: uiActionSchema.optional(),
  }),
});

const uiSwitchNodeSchema = z.object({
  type: z.literal("Switch"),
  props: z.object({
    name: z.string().min(1).max(120),
    label: z.string().max(200).optional(),
    defaultChecked: z.boolean().default(false),
    action: uiActionSchema.optional(),
  }),
});

const uiProgressNodeSchema = z.object({
  type: z.literal("Progress"),
  props: z.object({
    value: z.number().min(0).max(100),
    label: z.string().max(200).optional(),
  }),
});

const uiAlertNodeSchema = z.object({
  type: z.literal("Alert"),
  props: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    tone: z.enum(["info", "success", "warning", "error"]).default("info"),
  }),
});

const uiRadioGroupNodeSchema = z.object({
  type: z.literal("RadioGroup"),
  props: z.object({
    name: z.string().min(1).max(120),
    label: z.string().max(200).optional(),
    options: z.array(
      z.object({
        value: z.string().min(1).max(200),
        label: z.string().min(1).max(200),
      }),
    ).min(1).max(50),
    defaultValue: z.string().max(200).optional(),
    action: uiActionSchema.optional(),
  }),
});

const uiBreadcrumbNodeSchema = z.object({
  type: z.literal("Breadcrumb"),
  props: z.object({
    items: z.array(
      z.object({
        label: z.string().min(1).max(200),
        href: z.string().max(2000).optional(),
        action: uiActionSchema.optional(),
      }),
    ).min(1).max(10),
  }),
});

const uiToggleNodeSchema = z.object({
  type: z.literal("Toggle"),
  props: z.object({
    label: z.string().min(1).max(120),
    defaultPressed: z.boolean().default(false),
    variant: z.enum(["default", "outline"]).default("default"),
    action: uiActionSchema.optional(),
  }),
});

const uiSliderNodeSchema = z.object({
  type: z.literal("Slider"),
  props: z.object({
    name: z.string().min(1).max(120),
    label: z.string().max(200).optional(),
    min: z.number().default(0),
    max: z.number().default(100),
    step: z.number().min(0.01).default(1),
    defaultValue: z.number().optional(),
  }),
});

const uiSkeletonNodeSchema = z.object({
  type: z.literal("Skeleton"),
  props: z.object({
    width: z.string().max(50).optional(),
    height: z.string().max(50).optional(),
    rounded: z.boolean().default(false),
  }),
});

const uiMenuNodeSchema = z.object({
  type: z.literal("Menu"),
  props: z.object({
    trigger: z.string().min(1).max(120),
    items: z.array(
      z.object({
        label: z.string().min(1).max(200),
        action: uiActionSchema,
        tone: z.enum(["default", "danger"]).default("default"),
      }),
    ).min(1).max(20),
  }),
});

// ---------------------------------------------------------------------------
// Node types
// ---------------------------------------------------------------------------

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
  | z.infer<typeof uiTableNodeSchema>
  | z.infer<typeof uiAvatarNodeSchema>
  | z.infer<typeof uiCheckboxNodeSchema>
  | z.infer<typeof uiSwitchNodeSchema>
  | z.infer<typeof uiProgressNodeSchema>
  | z.infer<typeof uiAlertNodeSchema>
  | z.infer<typeof uiRadioGroupNodeSchema>
  | z.infer<typeof uiBreadcrumbNodeSchema>
  | z.infer<typeof uiToggleNodeSchema>
  | z.infer<typeof uiSliderNodeSchema>
  | z.infer<typeof uiSkeletonNodeSchema>
  | z.infer<typeof uiMenuNodeSchema>;

export type ColineUiNode =
  | ColineUiNodeBase
  | ColineUiStackNode
  | ColineUiCardNode
  | ColineUiTabsNode
  | ColineUiFormNode
  | ColineUiCollapsibleNode
  | ColineUiFieldNode;

export interface ColineUiStackNode {
  type: "Stack";
  props: {
    direction?: "vertical" | "horizontal" | undefined;
    gap?: "xs" | "sm" | "md" | "lg" | undefined;
    children: ColineUiNode[];
  };
}

export interface ColineUiCardNode {
  type: "Card";
  props: {
    title?: string | undefined;
    description?: string | undefined;
    children?: ColineUiNode[] | undefined;
    footer?: ColineUiNode[] | undefined;
    size?: "default" | "sm" | undefined;
  };
}

export interface ColineUiTabsNode {
  type: "Tabs";
  props: {
    tabs: Array<{
      label: string;
      value: string;
      content: ColineUiNode[];
    }>;
    defaultValue?: string | undefined;
  };
}

export interface ColineUiFormNode {
  type: "Form";
  props: {
    children: ColineUiNode[];
    submitAction: ColineUiAction;
    submitLabel?: string | undefined;
  };
}

export interface ColineUiCollapsibleNode {
  type: "Collapsible";
  props: {
    title: string;
    children: ColineUiNode[];
    defaultOpen?: boolean | undefined;
  };
}

export interface ColineUiFieldNode {
  type: "Field";
  props: {
    label?: string | undefined;
    description?: string | undefined;
    error?: string | undefined;
    children: ColineUiNode[];
  };
}

const uiNodeLazySchema: z.ZodType<ColineUiNode> = z.lazy(() =>
  z.union([
    // Base components
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
    // Extended components
    uiAvatarNodeSchema,
    uiCheckboxNodeSchema,
    uiSwitchNodeSchema,
    uiProgressNodeSchema,
    uiAlertNodeSchema,
    uiRadioGroupNodeSchema,
    uiBreadcrumbNodeSchema,
    uiToggleNodeSchema,
    uiSliderNodeSchema,
    uiSkeletonNodeSchema,
    uiMenuNodeSchema,
    // Container components (recursive)
    z.object({
      type: z.literal("Stack"),
      props: z.object({
        direction: z.enum(["vertical", "horizontal"]).default("vertical"),
        gap: z.enum(["xs", "sm", "md", "lg"]).default("md"),
        children: z.array(uiNodeLazySchema),
      }),
    }),
    z.object({
      type: z.literal("Card"),
      props: z.object({
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(1000).optional(),
        children: z.array(uiNodeLazySchema).optional(),
        footer: z.array(uiNodeLazySchema).optional(),
        size: z.enum(["default", "sm"]).default("default"),
      }),
    }),
    z.object({
      type: z.literal("Tabs"),
      props: z.object({
        tabs: z.array(
          z.object({
            label: z.string().min(1).max(200),
            value: z.string().min(1).max(120),
            content: z.array(uiNodeLazySchema),
          }),
        ).min(1).max(20),
        defaultValue: z.string().max(120).optional(),
      }),
    }),
    z.object({
      type: z.literal("Form"),
      props: z.object({
        children: z.array(uiNodeLazySchema),
        submitAction: uiActionSchema,
        submitLabel: z.string().min(1).max(120).default("Submit"),
      }),
    }),
    z.object({
      type: z.literal("Collapsible"),
      props: z.object({
        title: z.string().min(1).max(200),
        children: z.array(uiNodeLazySchema),
        defaultOpen: z.boolean().default(false),
      }),
    }),
    z.object({
      type: z.literal("Field"),
      props: z.object({
        label: z.string().max(200).optional(),
        description: z.string().max(500).optional(),
        error: z.string().max(500).optional(),
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

  // -------------------------------------------------------------------------
  // Extended components
  // -------------------------------------------------------------------------

  card(input: {
    title?: string;
    description?: string;
    children?: ColineUiNode[];
    footer?: ColineUiNode[];
    size?: "default" | "sm";
  } = {}): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Card",
      props: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.description ? { description: input.description } : {}),
        ...(input.children ? { children: input.children } : {}),
        ...(input.footer ? { footer: input.footer } : {}),
        ...(input.size ? { size: input.size } : {}),
      },
    });
  },

  avatar(input: {
    fallback: string;
    src?: string;
    size?: "sm" | "default" | "lg";
  }): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Avatar",
      props: {
        fallback: input.fallback,
        ...(input.src ? { src: input.src } : {}),
        ...(input.size ? { size: input.size } : {}),
      },
    });
  },

  checkbox(input: {
    name: string;
    label?: string;
    defaultChecked?: boolean;
    action?: ColineUiAction;
  }): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Checkbox",
      props: {
        name: input.name,
        ...(input.label ? { label: input.label } : {}),
        ...(input.defaultChecked ? { defaultChecked: true } : {}),
        ...(input.action ? { action: input.action } : {}),
      },
    });
  },

  switch(input: {
    name: string;
    label?: string;
    defaultChecked?: boolean;
    action?: ColineUiAction;
  }): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Switch",
      props: {
        name: input.name,
        ...(input.label ? { label: input.label } : {}),
        ...(input.defaultChecked ? { defaultChecked: true } : {}),
        ...(input.action ? { action: input.action } : {}),
      },
    });
  },

  tabs(input: {
    tabs: Array<{
      label: string;
      value: string;
      content: ColineUiNode[];
    }>;
    defaultValue?: string;
  }): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Tabs",
      props: {
        tabs: input.tabs,
        ...(input.defaultValue ? { defaultValue: input.defaultValue } : {}),
      },
    });
  },

  progress(
    value: number,
    options: { label?: string } = {},
  ): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Progress",
      props: {
        value,
        ...(options.label ? { label: options.label } : {}),
      },
    });
  },

  alert(input: {
    title: string;
    description?: string;
    tone?: "info" | "success" | "warning" | "error";
  }): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Alert",
      props: {
        title: input.title,
        ...(input.description ? { description: input.description } : {}),
        ...(input.tone ? { tone: input.tone } : {}),
      },
    });
  },

  form(input: {
    children: ColineUiNode[];
    submitAction: ColineUiAction;
    submitLabel?: string;
  }): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Form",
      props: {
        children: input.children,
        submitAction: input.submitAction,
        ...(input.submitLabel ? { submitLabel: input.submitLabel } : {}),
      },
    });
  },

  radioGroup(input: {
    name: string;
    label?: string;
    options: Array<{ value: string; label: string }>;
    defaultValue?: string;
    action?: ColineUiAction;
  }): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "RadioGroup",
      props: {
        name: input.name,
        options: input.options,
        ...(input.label ? { label: input.label } : {}),
        ...(input.defaultValue ? { defaultValue: input.defaultValue } : {}),
        ...(input.action ? { action: input.action } : {}),
      },
    });
  },

  collapsible(input: {
    title: string;
    children: ColineUiNode[];
    defaultOpen?: boolean;
  }): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Collapsible",
      props: {
        title: input.title,
        children: input.children,
        ...(input.defaultOpen ? { defaultOpen: true } : {}),
      },
    });
  },

  breadcrumb(input: {
    items: Array<{
      label: string;
      href?: string;
      action?: ColineUiAction;
    }>;
  }): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Breadcrumb",
      props: {
        items: input.items,
      },
    });
  },

  toggle(input: {
    label: string;
    defaultPressed?: boolean;
    variant?: "default" | "outline";
    action?: ColineUiAction;
  }): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Toggle",
      props: {
        label: input.label,
        ...(input.defaultPressed ? { defaultPressed: true } : {}),
        ...(input.variant ? { variant: input.variant } : {}),
        ...(input.action ? { action: input.action } : {}),
      },
    });
  },

  field(input: {
    children: ColineUiNode[];
    label?: string;
    description?: string;
    error?: string;
  }): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Field",
      props: {
        children: input.children,
        ...(input.label ? { label: input.label } : {}),
        ...(input.description ? { description: input.description } : {}),
        ...(input.error ? { error: input.error } : {}),
      },
    });
  },

  slider(input: {
    name: string;
    label?: string;
    min?: number;
    max?: number;
    step?: number;
    defaultValue?: number;
  }): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Slider",
      props: {
        name: input.name,
        ...(input.label ? { label: input.label } : {}),
        ...(input.min !== undefined ? { min: input.min } : {}),
        ...(input.max !== undefined ? { max: input.max } : {}),
        ...(input.step !== undefined ? { step: input.step } : {}),
        ...(input.defaultValue !== undefined ? { defaultValue: input.defaultValue } : {}),
      },
    });
  },

  skeleton(input: {
    width?: string;
    height?: string;
    rounded?: boolean;
  } = {}): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Skeleton",
      props: {
        ...(input.width ? { width: input.width } : {}),
        ...(input.height ? { height: input.height } : {}),
        ...(input.rounded ? { rounded: true } : {}),
      },
    });
  },

  menu(input: {
    trigger: string;
    items: Array<{
      label: string;
      action: ColineUiAction;
      tone?: "default" | "danger";
    }>;
  }): ColineUiNode {
    return colineUiNodeSchema.parse({
      type: "Menu",
      props: {
        trigger: input.trigger,
        items: input.items,
      },
    });
  },
};
