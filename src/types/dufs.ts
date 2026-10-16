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

export interface FileEntry {
  name: string
  path: string
  isDir: boolean
}

export interface TreeStateNode {
  element: FileEntry
  parent: TreeStateNode | null
  children: TreeStateNode[] | null
  stale: boolean
  loaded: boolean
}

export interface AppState {
  tree: TreeStateNode[]
  loadingPath: string | null
  currentPath: string
  currentData: DufsData | null
  selectedPath: string | null
  sidebarOpen: boolean
  viewMode: ViewMode
  lockedFiles: string[]
  footerText: string | null
  auth: {
    required: boolean
    user: string | null
    loading: boolean
  }
  uploads: UploadItem[]
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
  | { type: "TREE_EXPAND"; path: string }
  | { type: "TREE_COLLAPSE"; path: string }
  | { type: "TREE_SET_CHILDREN"; parentPath: string; entries: FileEntry[] }
  | { type: "TREE_SELECT"; path: string | null }
  | { type: "SET_CURRENT"; path: string; data: DufsData }
  | { type: "SET_AUTH"; auth: { required: boolean; user: string | null } }
  | { type: "SET_AUTH_LOADING"; loading: boolean }
  | { type: "ADD_UPLOAD"; item: UploadItem }
  | { type: "UPDATE_UPLOAD"; id: number; updates: Partial<UploadItem> }
  | { type: "REMOVE_UPLOAD"; id: number }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_VIEW_MODE"; mode: ViewMode }
  | { type: "SET_LOADING"; path: string | null }
  | { type: "TREE_REPLACE_ROOT"; nodes: TreeStateNode[] }
  | { type: "SET_FOOTER"; text: string | null }
  | { type: "SET_LOCKED_FILES"; paths: string[] }