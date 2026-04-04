import type { CreateNotificationInputInput } from "./manifest";
import type { ColineUiAction, ColineUiNode } from "./ui";

export interface ColineActorIdentity {
  userId: string;
  email?: string | undefined;
  handle?: string | null | undefined;
  firstName?: string | null | undefined;
  lastName?: string | null | undefined;
}

export interface ColineWorkspaceIdentity {
  workspaceId: string;
  workspaceSlug: string;
  workspaceName?: string;
}

export interface ColineAppIdentity {
  appKey: string;
  appInstallId?: string;
}

export interface ColineFileReference {
  id: string;
  typeKey: string;
  title?: string | undefined;
}

export interface ColineFileListItem extends ColineFileReference {
  name: string;
  fileType: string;
  driveId: string;
  parentId: string | null;
  appKey: string;
  appName: string;
  openHref: string;
  version: number;
  updatedAt: string;
  createdAt: string;
  capabilities: {
    canRead: boolean;
    canWrite: boolean;
    canManage: boolean;
  };
}

export interface ColineFilesApi {
  listFiles(input?: {
    driveId?: string;
    typeKey?: string;
    limit?: number;
  }): Promise<{
    files: ColineFileListItem[];
    availableFileTypes: Array<{
      typeKey: string;
      name: string;
      description: string | null;
    }>;
  }>;
  getDocument(fileId: string): Promise<Record<string, unknown>>;
  updateDocument(
    fileId: string,
    document: Record<string, unknown>,
  ): Promise<{ version: number; updatedAt: string }>;
}

export interface ColineIndexApi {
  upsert(input: {
    documents: Array<{
      documentKey: string;
      documentType: string;
      fileId?: string;
      title: string;
      body: string;
      url?: string;
      metadata?: Record<string, unknown>;
    }>;
  }): Promise<{
    documents: Array<{
      id: string;
      documentKey: string;
      visibilityMode: string;
    }>;
  }>;
  delete(input: {
    documentKeys: string[];
  }): Promise<{
    deleted: Array<{
      id: string;
      documentKey: string;
    }>;
  }>;
}

export interface ColineNotificationsApi {
  create(
    input: CreateNotificationInputInput,
  ): Promise<{ ok: true }>;
}

export interface ColineRoutesApi {
  openFile(fileId: string): ColineUiAction;
  openAppHome(): ColineUiAction;
  navigate(href: string): ColineUiAction;
  createFile(input: {
    name: string;
    typeKey: string;
    driveId?: string;
    parentId?: string | null;
    document?: Record<string, unknown>;
  }): ColineUiAction;
  custom(type: string, payload?: Record<string, unknown>): ColineUiAction;
}

export interface ColineBaseContext {
  workspace: ColineWorkspaceIdentity;
  app: ColineAppIdentity;
  actor?: ColineActorIdentity | null;
  routes: ColineRoutesApi;
  files?: ColineFilesApi;
  index?: ColineIndexApi;
  notifications?: ColineNotificationsApi;
}

export interface HomeRenderContext extends ColineBaseContext {}

export interface FileRenderContext extends ColineBaseContext {
  file: ColineFileReference;
  document: Record<string, unknown>;
}

export interface IndexSyncContext extends ColineBaseContext {
  file?: ColineFileReference;
}

export type HomeRenderResult = ColineUiNode;
export type FileRenderResult = ColineUiNode;
