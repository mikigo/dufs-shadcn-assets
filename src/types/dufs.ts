// src/types/dufs.ts
export interface PathItem {
  path_type: "Dir" | "SymlinkDir" | "File" | "SymlinkFile"
  name: string
  mtime: number
  size: number
}

export interface DufsData {
  href: string
  uri_prefix: string
  kind: "Index" | "Edit" | "View"
  paths: PathItem[]
  allow_upload: boolean
  allow_delete: boolean
  allow_search: boolean
  allow_archive: boolean
  auth: boolean
  user: string
  dir_exists: boolean
  editable: string
}

export type ViewMode = "list" | "icons"

export interface AppState {
  tree: TreeNode[]
  treeLoading: Set<string>
  currentPath: string
  currentData: DufsData | null
  selectedPath: string | null
  sidebarOpen: boolean
  viewMode: ViewMode
  auth: {
    required: boolean
    user: string | null
    loading: boolean
  }
  uploads: UploadItem[]
}

export interface TreeNode {
  name: string
  path: string
  isDir: boolean
  children: TreeNode[] | null
  loaded: boolean
}

export interface UploadItem {
  id: number
  name: string
  file: File
  url: string
  uploaded: number
  status: "pending" | "uploading" | "done" | "error"
  errorMessage?: string
  rootDir?: string
}

export type AppAction =
  | { type: "SET_TREE"; path: string; nodes: TreeNode[] }
  | { type: "EXPAND_TREE"; path: string }
  | { type: "COLLAPSE_TREE"; path: string }
  | { type: "SET_CURRENT"; path: string; data: DufsData }
  | { type: "SELECT"; path: string | null }
  | { type: "SET_AUTH"; auth: { required: boolean; user: string | null } }
  | { type: "SET_AUTH_LOADING"; loading: boolean }
  | { type: "ADD_UPLOAD"; item: UploadItem }
  | { type: "UPDATE_UPLOAD"; id: number; updates: Partial<UploadItem> }
  | { type: "REMOVE_UPLOAD"; id: number }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_VIEW_MODE"; mode: ViewMode }