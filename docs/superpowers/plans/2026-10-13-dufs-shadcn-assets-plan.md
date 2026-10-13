# dufs-shadcn-assets 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建双面板文件管理器 UI 主题，用于 dufs 的 `--assets` 参数。

**Architecture:** Vite + React + TypeScript + shadcn/ui + Tailwind CSS，构建时通过 vite-plugin-singlefile 将所有 JS/CSS 内联到单个 index.html，配合 favicon.ico 组成 dufs 的 assets 目录。

**Tech Stack:** React 18, TypeScript, Vite, shadcn/ui (Radix + Tailwind CSS v3), lucide-react, vite-plugin-singlefile, pnpm

---

### Task 1: 项目脚手架 & shadcn 初始化

**Files:**
- Create: `C:\Users\Administrator\Desktop\code\dufs-shadcn-assets/package.json` 等全部项目文件

- [ ] **Step 1: 用 Vite 创建 React + TypeScript 项目**

```bash
cd C:\Users\Administrator\Desktop\code
pnpm create vite dufs-shadcn-assets --template react-ts
cd dufs-shadcn-assets
pnpm install
```

- [ ] **Step 2: 安装 Tailwind CSS v3 + 依赖**

```bash
pnpm add tailwindcss@3 postcss autoprefixer
pnpm dlx tailwindcss@3 init -p --ts
```

- [ ] **Step 3: 配置 tailwind.config.ts**

```ts
// tailwind.config.ts
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 4: 配置 src/index.css**

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: 初始化 shadcn/ui**

编辑 `tsconfig.json` 添加 path alias：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

```bash
pnpm add -D @types/node
```

编辑 `vite.config.ts`：

```ts
import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

运行 shadcn init：

```bash
pnpm dlx shadcn@latest init --defaults
```

Expected: 创建 `components.json`，生成 `src/lib/utils.ts`。

- [ ] **Step 6: 安装 shadcn 组件**

```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add table
pnpm dlx shadcn@latest add input
pnpm dlx shadcn@latest add breadcrumb
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add alert-dialog
pnpm dlx shadcn@latest add progress
pnpm dlx shadcn@latest add tooltip
pnpm dlx shadcn@latest add sheet
pnpm dlx shadcn@latest add scroll-area
pnpm dlx shadcn@latest add separator
pnpm dlx shadcn@latest add badge
pnpm dlx shadcn@latest add dropdown-menu
pnpm dlx shadcn@latest add skeleton
```

- [ ] **Step 7: 安装其他运行时依赖**

```bash
pnpm add lucide-react
```

- [ ] **Step 8: 安装构建依赖**

```bash
pnpm add -D vite-plugin-singlefile
```

- [ ] **Step 9: 验证项目可运行**

```bash
pnpm dev
```

Expected: Vite 开发服务器正常启动，无报错。

- [ ] **Step 10: Commit**

```bash
git init
git add -A
git commit -m "feat: project scaffold with vite + react + shadcn"
```

---

### Task 2: 类型定义、API 层、工具函数

**Files:**
- Create: `src/types/dufs.ts`
- Create: `src/api/dufs.ts`
- Modify: `src/lib/utils.ts` (追加工具函数)

- [ ] **Step 1: 创建 dufs 类型定义**

```ts
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

export interface AppState {
  tree: TreeNode[]
  treeLoading: Set<string>
  currentPath: string
  currentData: DufsData | null
  selectedPath: string | null
  sidebarOpen: boolean
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
```

- [ ] **Step 2: 创建 dufs API 层**

```ts
// src/api/dufs.ts
import type { DufsData, PathItem } from "@/types/dufs"

function baseUrl(): string {
  return location.href.split(/[?#]/)[0]
}

function baseName(url: string): string {
  return decodeURIComponent(url.split("/").filter(v => v.length > 0).slice(-1)[0])
}

function extName(filename: string): string {
  const dotIndex = filename.lastIndexOf('.')
  if (dotIndex === -1 || dotIndex === 0 || dotIndex === filename.length - 1) return ''
  return filename.substring(dotIndex)
}

function decodeBase64(b64: string): string {
  const binString = atob(b64)
  const len = binString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binString.charCodeAt(i)
  }
  return new TextDecoder().decode(bytes)
}

function parseIndexData(html: string): DufsData | null {
  const match = html.match(/<template\s+id="index-data"[^>]*>([^<]+)<\/template>/)
  if (!match) return null
  return JSON.parse(decodeBase64(match[1]))
}

async function assertResOK(res: Response): Promise<void> {
  if (!(res.status >= 200 && res.status < 300)) {
    throw new Error(await res.text() || `Invalid status ${res.status}`)
  }
}

export async function fetchIndexData(dirPath: string): Promise<DufsData> {
  const res = await fetch(dirPath)
  await assertResOK(res)
  const html = await res.text()
  const data = parseIndexData(html)
  if (!data) throw new Error("Failed to parse index data")
  return data
}

export async function fetchFileContent(filePath: string): Promise<string> {
  const res = await fetch(filePath)
  await assertResOK(res)
  return res.text()
}

export async function deletePath(url: string): Promise<void> {
  const res = await fetch(url, { method: "DELETE" })
  await assertResOK(res)
}

export async function movePath(fromUrl: string, toUrl: string): Promise<void> {
  const res1 = await fetch(toUrl, { method: "HEAD" })
  if (res1.status === 200 && !confirm("Override existing file?")) return
  const res2 = await fetch(fromUrl, {
    method: "MOVE",
    headers: { "Destination": toUrl },
  })
  await assertResOK(res2)
}

export async function createFolder(folderUrl: string): Promise<void> {
  const res = await fetch(folderUrl, { method: "MKCOL" })
  await assertResOK(res)
}

export async function createFile(fileUrl: string): Promise<void> {
  const res = await fetch(fileUrl, { method: "PUT", body: "" })
  await assertResOK(res)
}

export async function saveFile(fileUrl: string, content: string): Promise<void> {
  const res = await fetch(fileUrl, { method: "PUT", body: content })
  await assertResOK(res)
}

export async function checkAuth(basePath: string): Promise<string> {
  const res = await fetch(basePath, { method: "CHECKAUTH" })
  await assertResOK(res)
  return res.text()
}

export function logout(basePath: string, user: string): void {
  const xhr = new XMLHttpRequest()
  xhr.open("LOGOUT", basePath, true, user)
  xhr.onload = () => { location.href = basePath }
  xhr.send()
}

export interface UploadCallbacks {
  onProgress: (id: number, uploaded: number, total: number) => void
  onComplete: (id: number) => void
  onError: (id: number, error: string) => void
}

export function uploadFile(
  id: number,
  file: File,
  uploadUrl: string,
  callbacks: UploadCallbacks,
): void {
  const xhr = new XMLHttpRequest()
  let lastTime = Date.now()
  let lastLoaded = 0

  xhr.upload.addEventListener("progress", (e) => {
    const now = Date.now()
    if (now - lastTime < 300) return
    lastTime = now
    lastLoaded = e.loaded
    callbacks.onProgress(id, e.loaded, e.total)
  })

  xhr.addEventListener("readystatechange", () => {
    if (xhr.readyState === 4) {
      if (xhr.status >= 200 && xhr.status < 300) {
        callbacks.onComplete(id)
      } else {
        if (xhr.status !== 0) {
          callbacks.onError(id, `${xhr.status} ${xhr.statusText}`)
        }
      }
    }
  })

  xhr.addEventListener("error", () => callbacks.onError(id, "Network error"))
  xhr.addEventListener("abort", () => callbacks.onError(id, "Aborted"))
  xhr.open("PUT", uploadUrl)
  xhr.send(file)
}

export const IFRAME_FORMATS = [
  ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg",
  ".mp4", ".mov", ".avi", ".wmv", ".flv", ".webm",
  ".mp3", ".ogg", ".wav", ".m4a",
]

export function canIframePreview(filename: string): boolean {
  return IFRAME_FORMATS.includes(extName(baseName(filename)))
}
```

- [ ] **Step 3: 追加工具函数到 src/lib/utils.ts**

在已有 `cn` 函数后追加：

```ts
export function formatFileSize(size: number | null | undefined): [number, string] {
  if (size == null) return [0, "B"]
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  if (size === 0) return [0, "B"]
  const i = Math.floor(Math.log(size) / Math.log(1024))
  const raw = size / Math.pow(1024, i)
  const value = i > 0 && raw < 999.95 ? Math.round(raw * 10) / 10 : Math.round(raw)
  return [value, sizes[i]]
}

export function formatDirSize(size: number): string {
  const unit = size === 1 ? "item" : "items"
  const num = size >= 1000 ? `>999` : `${size}`
  return `${num} ${unit}`
}

export function formatMtime(mtime: number): string {
  if (!mtime) return ""
  const date = new Date(mtime)
  const pad = (v: number) => String(v).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatDuration(seconds: number): string {
  seconds = Math.ceil(seconds)
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds - h * 3600) / 60)
  const s = seconds - h * 3600 - m * 60
  const pad = (v: number) => String(v).padStart(2, "0")
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

export function formatPercent(percent: number): string {
  return percent > 10 ? percent.toFixed(1) + "%" : percent.toFixed(2) + "%"
}

export function encodedStr(rawStr: string): string {
  return rawStr.replace(/[\u00A0-\u9999<>\&]/g, (i) => '&#' + i.charCodeAt(0) + ';')
}

export function newUrl(base: string, name: string): string {
  let url = base
  if (!url.endsWith("/")) url += "/"
  url += name.split("/").map(encodeURIComponent).join("/")
  return url
}

export function baseNameFromUrl(url: string): string {
  return decodeURIComponent(url.split("/").filter(v => v.length > 0).slice(-1)[0])
}
```

- [ ] **Step 4: 验证 TypeScript 编译**

```bash
pnpm typecheck
```

Expected: 无类型错误。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add types, API layer, and utility functions"
```

---

### Task 3: 全局状态管理 (Context)

**Files:**
- Create: `src/context/AppContext.tsx`

- [ ] **Step 1: 创建 AppContext**

```tsx
// src/context/AppContext.tsx
import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react"
import type { AppState, AppAction } from "@/types/dufs"

const initialState: AppState = {
  tree: [],
  treeLoading: new Set(),
  currentPath: "",
  currentData: null,
  selectedPath: null,
  sidebarOpen: true,
  auth: {
    required: false,
    user: null,
    loading: false,
  },
  uploads: [],
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_TREE": {
      const { path, nodes } = action
      const updateChildren = (items: typeof state.tree): typeof state.tree =>
        items.map(item => {
          if (item.path === path) return { ...item, children: nodes, loaded: true }
          if (item.children) return { ...item, children: updateChildren(item.children) }
          return item
        })
      return { ...state, tree: updateChildren(state.tree) }
    }
    case "EXPAND_TREE": {
      for (const p of state.treeLoading) break
      const loading = new Set(state.treeLoading)
      const node = findNode(state.tree, action.path)
      if (node && !node.loaded) loading.add(action.path)
      return { ...state, treeLoading: loading }
    }
    case "COLLAPSE_TREE": {
      const collapse = (items: typeof state.tree): typeof state.tree =>
        items.map(item => {
          if (item.path === action.path) return { ...item, children: null }
          if (item.children) return { ...item, children: collapse(item.children) }
          return item
        })
      return { ...state, tree: collapse(state.tree) }
    }
    case "SET_CURRENT":
      return { ...state, currentPath: action.path, currentData: action.data, selectedPath: null }
    case "SELECT":
      return { ...state, selectedPath: action.path }
    case "SET_AUTH":
      return { ...state, auth: { ...state.auth, ...action.auth, loading: false } }
    case "SET_AUTH_LOADING":
      return { ...state, auth: { ...state.auth, loading: action.loading } }
    case "ADD_UPLOAD":
      return { ...state, uploads: [...state.uploads, action.item] }
    case "UPDATE_UPLOAD": {
      const uploads = state.uploads.map(u =>
        u.id === action.id ? { ...u, ...action.updates } : u as typeof state.uploads[number]
      )
      return { ...state, uploads }
    }
    case "REMOVE_UPLOAD":
      return { ...state, uploads: state.uploads.filter(u => u.id !== action.id) }
    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen }
    default:
      return state
  }
}

function findNode(nodes: typeof initialState.tree, path: string): (typeof nodes)[number] | null {
  for (const node of nodes) {
    if (node.path === path) return node
    if (node.children) {
      const found = findNode(node.children as typeof nodes, path)
      if (found) return found
    }
  }
  return null
}

interface AppContextValue {
  state: AppState
  dispatch: Dispatch<AppAction>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useAppState must be used within AppProvider")
  return ctx
}
```

- [ ] **Step 2: 验证编译**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add global state context with reducer"
```

---

### Task 4: 布局骨架 — 可调宽面板 + 侧栏 + 主区域

**Files:**
- Create: `src/components/layout/ResizablePanel.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/MainPanel.tsx`

- [ ] **Step 1: 创建可调宽度面板组件**

```tsx
// src/components/layout/ResizablePanel.tsx
import { useCallback, useRef, useState, useEffect, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface Props {
  defaultWidth: number
  minWidth: number
  maxWidth: number
  collapsed: boolean
  children: ReactNode
}

export function ResizablePanel({ defaultWidth, minWidth, maxWidth, collapsed, children }: Props) {
  const [width, setWidth] = useState(defaultWidth)
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    startX.current = e.clientX
    startWidth.current = width
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }, [width])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      const delta = e.clientX - startX.current
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth.current + delta))
      setWidth(newWidth)
    }
    const onMouseUp = () => {
      isResizing.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
    return () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }
  }, [minWidth, maxWidth])

  if (collapsed) return null

  return (
    <>
      <div style={{ width, minWidth, maxWidth, flexShrink: 0 }}>
        {children}
      </div>
      <div
        className="w-1 bg-border hover:bg-primary/50 cursor-col-resize flex-shrink-0 transition-colors"
        onMouseDown={onMouseDown}
      />
    </>
  )
}
```

- [ ] **Step 2: 创建侧栏骨架**

```tsx
// src/components/layout/Sidebar.tsx
import { type ReactNode } from "react"

interface Props {
  children: ReactNode
}

export function Sidebar({ children }: Props) {
  return (
    <div className="h-full flex flex-col border-r bg-background">
      {children}
    </div>
  )
}
```

- [ ] **Step 3: 创建主区域骨架**

```tsx
// src/components/layout/MainPanel.tsx
import { type ReactNode } from "react"

interface Props {
  toolbar: ReactNode
  content: ReactNode
}

export function MainPanel({ toolbar, content }: Props) {
  return (
    <div className="flex flex-col flex-1 min-w-0 h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-background sticky top-0 z-10 flex-wrap">
        {toolbar}
      </div>
      <div className="flex-1 overflow-auto">
        {content}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 验证编译**

```bash
pnpm typecheck
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add layout shell components (resizable panel, sidebar, main panel)"
```

---

### Task 5: 文件树组件

**Files:**
- Create: `src/components/file-tree/FileTree.tsx`
- Create: `src/components/file-tree/TreeNode.tsx`
- Create: `src/hooks/useFileTree.ts`

- [ ] **Step 1: 创建 useFileTree hook**

```ts
// src/hooks/useFileTree.ts
import { useEffect, useCallback } from "react"
import { useAppState } from "@/context/AppContext"
import { fetchIndexData } from "@/api/dufs"
import type { TreeNode } from "@/types/dufs"

export function useFileTree() {
  const { state, dispatch } = useAppState()

  useEffect(() => {
    if (state.currentData) {
      const nodes: TreeNode[] = state.currentData.paths
        .filter(p => p.path_type.endsWith("Dir"))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(p => ({
          name: p.name,
          path: state.currentPath.replace(/\/$/, "") + "/" + encodeURIComponent(p.name),
          isDir: true,
          children: null,
          loaded: false,
        }))
      dispatch({ type: "SET_TREE", path: state.currentPath || "/", nodes })
    }
  }, [state.currentPath, state.currentData, dispatch])

  useEffect(() => {
    const loadingPaths = Array.from(state.treeLoading)
    if (loadingPaths.length === 0) return
    const path = loadingPaths[0]
    fetchIndexData(path)
      .then(data => {
        const nodes: TreeNode[] = data.paths
          .filter(p => p.path_type.endsWith("Dir"))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(p => ({
            name: p.name,
            path: path.replace(/\/$/, "") + "/" + encodeURIComponent(p.name),
            isDir: true,
            children: null,
            loaded: false,
          }))
        dispatch({ type: "SET_TREE", path, nodes })
      })
      .catch(() => {
        dispatch({ type: "SET_TREE", path, nodes: [] })
      })
  }, [state.treeLoading, dispatch])

  const handleToggle = useCallback((path: string, loaded: boolean) => {
    const findNode = (nodes: TreeNode[]): TreeNode | null => {
      for (const n of nodes) {
        if (n.path === path) return n
        if (n.children) {
          const f = findNode(n.children)
          if (f) return f
        }
      }
      return null
    }
    const node = findNode(state.tree)
    if (!node) return
    if (node.children !== null) {
      dispatch({ type: "COLLAPSE_TREE", path })
    } else if (!loaded) {
      dispatch({ type: "EXPAND_TREE", path })
    }
  }, [state.tree, dispatch])

  const handleSelect = useCallback((path: string) => {
    dispatch({ type: "SELECT", path })
  }, [dispatch])

  return { tree: state.tree, treeLoading: state.treeLoading, handleToggle, handleSelect }
}
```

- [ ] **Step 2: 创建 TreeNode 组件**

```tsx
// src/components/file-tree/TreeNode.tsx
import { ChevronRight, Folder, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TreeNode as TreeNodeType } from "@/types/dufs"

interface Props {
  node: TreeNodeType
  depth: number
  loading: boolean
  onToggle: (path: string, loaded: boolean) => void
  onSelect: (path: string) => void
}

export function TreeNodeComponent({ node, depth, loading, onToggle, onSelect }: Props) {
  const expanded = node.children !== null
  const hasChildren = node.isDir

  return (
    <div>
      <button
        className={cn(
          "flex items-center gap-1 w-full px-2 py-1 text-sm hover:bg-accent rounded-sm text-left",
          "transition-colors"
        )}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={() => {
          if (hasChildren) {
            onToggle(node.path, node.loaded)
          }
          onSelect(node.path)
        }}
      >
        {hasChildren && (
          <ChevronRight
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-90"
            )}
          />
        )}
        {!hasChildren && <div className="w-4 shrink-0" />}
        {expanded && hasChildren ? (
          <FolderOpen className="size-4 shrink-0 text-primary" />
        ) : (
          <Folder className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate">{node.name}</span>
        {loading && (
          <span className="ml-auto size-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin shrink-0" />
        )}
      </button>
      {expanded && node.children && (
        <div>
          {node.children.map(child => (
            <TreeNodeComponent
              key={child.path}
              node={child}
              depth={depth + 1}
              loading={false}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: 创建 FileTree 容器组件**

```tsx
// src/components/file-tree/FileTree.tsx
import { ScrollArea } from "@/components/ui/scroll-area"
import { TreeNodeComponent } from "./TreeNode"
import { useFileTree } from "@/hooks/useFileTree"

export function FileTree() {
  const { tree, treeLoading, handleToggle, handleSelect } = useFileTree()

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Files
      </div>
      <ScrollArea className="flex-1">
        <div className="py-1">
          {tree.map(node => (
            <TreeNodeComponent
              key={node.path}
              node={node}
              depth={0}
              loading={treeLoading.has(node.path)}
              onToggle={handleToggle}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
```

- [ ] **Step 4: 验证编译**

```bash
pnpm typecheck
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add file tree components with lazy loading"
```

---

### Task 6: 工具栏组件

**Files:**
- Create: `src/components/toolbar/Toolbar.tsx`
- Create: `src/components/toolbar/Breadcrumb.tsx`
- Create: `src/components/toolbar/SearchBar.tsx`
- Create: `src/components/toolbar/ThemeToggle.tsx`
- Create: `src/components/toolbar/AuthButton.tsx`
- Create: `src/components/toolbar/ActionButtons.tsx`

- [ ] **Step 1: 创建 Breadcrumb 组件**

```tsx
// src/components/toolbar/Breadcrumb.tsx
import { useAppState } from "@/context/AppContext"
import {
  Breadcrumb as ShadBreadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"
import { encodedStr } from "@/lib/utils"

export function Breadcrumb() {
  const { state, dispatch } = useAppState()

  const parts = state.currentPath === "/" ? [""] : state.currentPath.split("/")
  const prefix = state.currentData?.uri_prefix ?? ""

  const handleClick = async (path: string) => {
    const { fetchIndexData } = await import("@/api/dufs")
    const data = await fetchIndexData(path)
    dispatch({ type: "SET_CURRENT", path, data })
  }

  let accumulatedPath = prefix

  return (
    <ShadBreadcrumb>
      <BreadcrumbList>
        {parts.map((name, i) => {
          if (i > 0) accumulatedPath += "/" + encodeURIComponent(name)
          const isLast = i === parts.length - 1
          return (
            <div key={i} className="flex items-center gap-1">
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{encodedStr(name || "/")}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href={accumulatedPath || "/"}
                    onClick={(e) => {
                      e.preventDefault()
                      handleClick(accumulatedPath || "/")
                    }}
                  >
                    {i === 0 ? <Home className="size-4" /> : encodedStr(name)}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          )
        })}
      </BreadcrumbList>
    </ShadBreadcrumb>
  )
}
```

- [ ] **Step 2: 创建 SearchBar 组件**

```tsx
// src/components/toolbar/SearchBar.tsx
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useState, type FormEvent } from "react"

export function SearchBar() {
  const params = Object.fromEntries(new URLSearchParams(window.location.search).entries())
  const [q, setQ] = useState(params.q ?? "")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const url = new URL(window.location.href)
    if (q) {
      url.searchParams.set("q", q)
    } else {
      url.searchParams.delete("q")
    }
    window.location.href = url.toString()
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      <Input
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search..."
        maxLength={128}
        autoComplete="off"
        className="pl-8 h-8 w-48 text-sm"
      />
    </form>
  )
}
```

- [ ] **Step 3: 创建 ThemeToggle 组件**

```tsx
// src/components/toolbar/ThemeToggle.tsx
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
    }
    return false
  })

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  return (
    <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} className="size-8">
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
```

- [ ] **Step 4: 创建 AuthButton 组件**

```tsx
// src/components/toolbar/AuthButton.tsx
import { useAppState } from "@/context/AppContext"
import { checkAuth, logout as doLogout } from "@/api/dufs"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut } from "lucide-react"

export function AuthButton() {
  const { state, dispatch } = useAppState()

  if (!state.auth.required) return null

  const handleLogin = async () => {
    dispatch({ type: "SET_AUTH_LOADING", loading: true })
    try {
      const user = await checkAuth(state.currentPath)
      dispatch({ type: "SET_AUTH", auth: { required: true, user } })
    } catch {
      dispatch({ type: "SET_AUTH_LOADING", loading: false })
      window.location.reload()
    }
  }

  const handleLogout = () => {
    if (state.auth.user) {
      doLogout(state.currentPath, state.auth.user)
    }
  }

  if (state.auth.user) {
    return (
      <div className="flex items-center gap-1 text-sm">
        <span className="text-muted-foreground">{state.auth.user}</span>
        <Button variant="ghost" size="icon" onClick={handleLogout} className="size-8">
          <LogOut className="size-4" />
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleLogin}
      disabled={state.auth.loading}
      className="size-8"
    >
      <LogIn className="size-4" />
    </Button>
  )
}
```

- [ ] **Step 5: 创建 ActionButtons 组件**

```tsx
// src/components/toolbar/ActionButtons.tsx
import { useAppState } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Upload, FolderPlus, FilePlus, Download, PanelLeft } from "lucide-react"
import { uploadFile, createFolder, createFile, newUrl } from "@/api/dufs"
import { useRef } from "react"

export function ActionButtons() {
  const { state, dispatch } = useAppState()
  const fileInputRef = useRef<HTMLInputElement>(null)
  let uploadId = useRef(0)

  const handleUpload = (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size === 0) continue
      const id = ++uploadId.current
      const item = {
        id,
        name: file.name,
        file,
        url: newUrl(state.currentPath, file.name),
        uploaded: 0,
        status: "pending" as const,
      }
      dispatch({ type: "ADD_UPLOAD", item })
      uploadFile(id, file, item.url, {
        onProgress: (id, uploaded, total) => {
          dispatch({ type: "UPDATE_UPLOAD", id, updates: { uploaded, status: "uploading" } })
        },
        onComplete: (id) => {
          dispatch({ type: "UPDATE_UPLOAD", id, updates: { status: "done" } })
        },
        onError: (id, error) => {
          dispatch({ type: "UPDATE_UPLOAD", id, updates: { status: "error", errorMessage: error } })
        },
      })
    }
  }

  const handleNewFolder = async () => {
    const name = prompt("Enter folder name")
    if (!name) return
    const url = newUrl(state.currentPath, name)
    await createFolder(url)
    const { fetchIndexData } = await import("@/api/dufs")
    const data = await fetchIndexData(state.currentPath)
    dispatch({ type: "SET_CURRENT", path: state.currentPath, data })
  }

  const handleNewFile = async () => {
    const name = prompt("Enter file name")
    if (!name) return
    const url = newUrl(state.currentPath, name)
    await createFile(url)
    window.location.href = url + "?edit"
  }

  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = state.currentPath + "?zip"
    a.download = ""
    a.click()
  }

  return (
    <div className="flex items-center gap-1 ml-auto">
      {state.currentData?.allow_archive && (
        <Button variant="ghost" size="icon" onClick={handleDownload} className="size-8">
          <Download className="size-4" />
        </Button>
      )}
      {state.currentData?.allow_upload && (
        <>
          <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="size-8">
            <Upload className="size-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
          />
          <Button variant="ghost" size="icon" onClick={handleNewFolder} className="size-8">
            <FolderPlus className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNewFile} className="size-8">
            <FilePlus className="size-4" />
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
        className="size-8"
      >
        <PanelLeft className="size-4" />
      </Button>
    </div>
  )
}
```

- [ ] **Step 6: 创建 Toolbar (组合以上组件)**

```tsx
// src/components/toolbar/Toolbar.tsx
import { Breadcrumb } from "./Breadcrumb"
import { SearchBar } from "./SearchBar"
import { ThemeToggle } from "./ThemeToggle"
import { AuthButton } from "./AuthButton"
import { ActionButtons } from "./ActionButtons"

export function Toolbar() {
  return (
    <>
      <Breadcrumb />
      <SearchBar />
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <AuthButton />
      </div>
      <ActionButtons />
    </>
  )
}
```

- [ ] **Step 7: 验证编译**

```bash
pnpm typecheck
```

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add toolbar components (breadcrumb, search, theme, auth, actions)"
```

---

### Task 7: 目录表格组件

**Files:**
- Create: `src/components/dir-table/DirTable.tsx`

- [ ] **Step 1: 创建 DirTable 组件**

```tsx
// src/components/dir-table/DirTable.tsx
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useAppState } from "@/context/AppContext"
import { fetchIndexData, deletePath, movePath, newUrl } from "@/api/dufs"
import { formatFileSize, formatDirSize, formatMtime, encodedStr } from "@/lib/utils"
import { Download, Trash2, Pencil, ArrowRightLeft, File, Folder, FolderSymlink, FileSymlink, FileText } from "lucide-react"
import { useState } from "react"
import { DeleteDialog } from "@/components/dialogs/DeleteDialog"
import { MoveRenameDialog } from "@/components/dialogs/MoveRenameDialog"
import type { PathItem } from "@/types/dufs"

function getIcon(pathType: string) {
  switch (pathType) {
    case "Dir": return <Folder className="size-4 text-muted-foreground" />
    case "SymlinkDir": return <FolderSymlink className="size-4 text-muted-foreground" />
    case "SymlinkFile": return <FileSymlink className="size-4 text-muted-foreground" />
    default: return <File className="size-4 text-muted-foreground" />
  }
}

export function DirTable() {
  const { state, dispatch } = useAppState()
  const [deleteTarget, setDeleteTarget] = useState<PathItem | null>(null)
  const [moveTarget, setMoveTarget] = useState<PathItem | null>(null)
  const [sort, setSort] = useState<{ key: string; order: "asc" | "desc" }>({ key: "name", order: "asc" })

  if (!state.currentData || !state.currentData.paths?.length) return null

  const sorted = [...state.currentData.paths].sort((a, b) => {
    const aIsDir = a.path_type.endsWith("Dir") ? 1 : 0
    const bIsDir = b.path_type.endsWith("Dir") ? 1 : 0
    if (aIsDir !== bIsDir) return bIsDir - aIsDir
    let cmp = 0
    if (sort.key === "name") cmp = a.name.localeCompare(b.name)
    else if (sort.key === "mtime") cmp = a.mtime - b.mtime
    else if (sort.key === "size") cmp = a.size - b.size
    return sort.order === "asc" ? cmp : -cmp
  })

  const handleSort = (key: string) => {
    setSort(prev => ({
      key,
      order: prev.key === key && prev.order === "asc" ? "desc" : "asc",
    }))
  }

  const handleRowClick = async (item: PathItem) => {
    if (item.path_type.endsWith("Dir")) {
      const dirPath = newUrl(state.currentPath, item.name) + "/"
      const data = await fetchIndexData(dirPath)
      dispatch({ type: "SET_CURRENT", path: dirPath, data })
    } else {
      const filePath = newUrl(state.currentPath, item.name)
      dispatch({ type: "SELECT", path: filePath })
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const url = newUrl(state.currentPath, deleteTarget.name)
    await deletePath(url)
    const data = await fetchIndexData(state.currentPath)
    dispatch({ type: "SET_CURRENT", path: state.currentPath, data })
    setDeleteTarget(null)
  }

  const sortHeader = (label: string, key: string) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-normal text-muted-foreground hover:text-foreground"
      onClick={() => handleSort(key)}
    >
      {label}
      {sort.key === key && (
        <span className="ml-1 text-xs">{sort.order === "asc" ? "↑" : "↓"}</span>
      )}
    </Button>
  )

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8" />
            <TableHead>{sortHeader("Name", "name")}</TableHead>
            <TableHead className="w-36">{sortHeader("Last Modified", "mtime")}</TableHead>
            <TableHead className="w-24 text-right">{sortHeader("Size", "size")}</TableHead>
            <TableHead className="w-28">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map(item => {
            const isDir = item.path_type.endsWith("Dir")
            const sizeDisplay = isDir ? formatDirSize(item.size) : formatFileSize(item.size).join(" ")
            const fileUrl = newUrl(state.currentPath, item.name)
            return (
              <TableRow
                key={item.name}
                className="cursor-pointer hover:bg-muted/50"
                onDoubleClick={() => handleRowClick(item)}
              >
                <TableCell>{getIcon(item.path_type)}</TableCell>
                <TableCell className="font-medium">
                  <span className="text-primary hover:underline" onClick={(e) => { e.stopPropagation(); handleRowClick(item) }}>
                    {encodedStr(item.name)}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground tabular-nums">
                  {formatMtime(item.mtime)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground text-right tabular-nums">
                  {sizeDisplay}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={async (e) => {
                        e.stopPropagation()
                        const url = fileUrl + (isDir ? "?zip" : "")
                        if (state.auth.user) {
                          try {
                            const tokengenUrl = new URL(url)
                            tokengenUrl.searchParams.set("tokengen", "")
                            const res = await fetch(tokengenUrl)
                            if (res.ok) {
                              const token = await res.text()
                              const dlUrl = new URL(url)
                              dlUrl.searchParams.set("token", token)
                              const a = document.createElement("a")
                              a.href = dlUrl.toString()
                              a.download = ""
                              a.click()
                              return
                            }
                          } catch {}
                        }
                        const a = document.createElement("a")
                        a.href = url
                        a.download = ""
                        a.click()
                      }}
                      title="Download"
                    >
                      <Download className="size-3.5" />
                    </Button>
                    {!isDir && (
                      <a href={fileUrl + "?view"} target="_blank" title="View">
                        <Button variant="ghost" size="icon" className="size-7">
                          <FileText className="size-3.5" />
                        </Button>
                      </a>
                    )}
                    {state.currentData.allow_upload && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={(e) => { e.stopPropagation(); setMoveTarget(item) }}
                          title="Move / Rename"
                        >
                          <ArrowRightLeft className="size-3.5" />
                        </Button>
                        {!isDir && (
                          <a href={fileUrl + "?edit"} target="_blank" title="Edit">
                            <Button variant="ghost" size="icon" className="size-7">
                              <Pencil className="size-3.5" />
                            </Button>
                          </a>
                        )}
                      </>
                    )}
                    {state.currentData.allow_delete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(item) }}
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <DeleteDialog
        open={!!deleteTarget}
        name={deleteTarget?.name ?? ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <MoveRenameDialog
        open={!!moveTarget}
        item={moveTarget}
        currentPath={state.currentPath}
        onDone={async () => {
          setMoveTarget(null)
          const data = await fetchIndexData(state.currentPath)
          dispatch({ type: "SET_CURRENT", path: state.currentPath, data })
        }}
        onCancel={() => setMoveTarget(null)}
      />
    </>
  )
}
```

- [ ] **Step 2: 验证编译**

```bash
pnpm typecheck
```

注意：此步骤编译会因缺少 DeleteDialog 和 MoveRenameDialog 失败，这是预期的。继续下一个任务。

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add directory table with sorting and row actions"
```

---

### Task 8: 文件预览组件

**Files:**
- Create: `src/components/file-preview/FilePreview.tsx`
- Create: `src/components/file-preview/TextPreview.tsx`
- Create: `src/components/file-preview/MediaPreview.tsx`

- [ ] **Step 1: 创建 TextPreview 组件**

```tsx
// src/components/file-preview/TextPreview.tsx
import { useEffect, useState } from "react"
import { fetchFileContent } from "@/api/dufs"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Props {
  filePath: string
}

export function TextPreview({ filePath }: Props) {
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setContent(null)
    setError(null)
    fetchFileContent(filePath)
      .then(setContent)
      .catch(err => setError(err.message))
  }, [filePath])

  if (error) return <div className="p-4 text-sm text-destructive">Failed to load: {error}</div>
  if (content === null) return <div className="p-4 text-sm text-muted-foreground">Loading...</div>

  return (
    <ScrollArea className="h-full">
      <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-all">{content}</pre>
    </ScrollArea>
  )
}
```

- [ ] **Step 2: 创建 MediaPreview 组件**

```tsx
// src/components/file-preview/MediaPreview.tsx
interface Props {
  filePath: string
}

export function MediaPreview({ filePath }: Props) {
  return (
    <div className="flex items-center justify-center h-full">
      <iframe
        src={filePath}
        className="w-full h-full border-0"
        sandbox="allow-scripts"
        title="Media Preview"
      />
    </div>
  )
}
```

- [ ] **Step 3: 创建 FilePreview (路由组件)**

```tsx
// src/components/file-preview/FilePreview.tsx
import { useAppState } from "@/context/AppContext"
import { canIframePreview, baseNameFromUrl } from "@/api/dufs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TextPreview } from "./TextPreview"
import { MediaPreview } from "./MediaPreview"
import { FileWarning } from "lucide-react"

export function FilePreview() {
  const { state } = useAppState()

  if (!state.selectedPath) return null

  const fileName = baseNameFromUrl(state.selectedPath)
  const isMedia = canIframePreview(state.selectedPath)
  const isTextLike = [".txt", ".md", ".json", ".xml", ".yml", ".yaml", ".toml", ".ini", ".cfg",
    ".conf", ".log", ".csv", ".tsv", ".html", ".htm", ".css", ".js", ".ts", ".tsx", ".jsx",
    ".rs", ".py", ".rb", ".go", ".java", ".c", ".cpp", ".h", ".sh", ".bash", ".zsh",
    ".sql", ".r", ".lua", ".php", ".swift", ".kt", ".scala", ".elm", ".ex", ".exs", ".erl",
    ".hrl", ".hs", ".clj", ".edn", ".dart", ".groovy", ".Makefile", ".Dockerfile",
  ].some(ext => fileName.toLowerCase().endsWith(ext))

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b bg-muted/30 text-sm font-medium flex items-center gap-2">
        {fileName}
      </div>
      <div className="flex-1 overflow-hidden">
        {isTextLike ? (
          <TextPreview filePath={state.selectedPath} />
        ) : isMedia ? (
          <MediaPreview filePath={state.selectedPath} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <FileWarning className="size-12" />
            <p className="text-sm">File format not supported for preview</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 验证编译**

```bash
pnpm typecheck
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add file preview components (text, media, unsupported)"
```

---

### Task 9: 对话框组件

**Files:**
- Create: `src/components/dialogs/DeleteDialog.tsx`
- Create: `src/components/dialogs/MoveRenameDialog.tsx`
- Create: `src/components/dialogs/UploadProgressSheet.tsx`

- [ ] **Step 1: 创建 DeleteDialog**

```tsx
// src/components/dialogs/DeleteDialog.tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Props {
  open: boolean
  name: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteDialog({ open, name, onConfirm, onCancel }: Props) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete &quot;{name}&quot;? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

- [ ] **Step 2: 创建 MoveRenameDialog**

```tsx
// src/components/dialogs/MoveRenameDialog.tsx
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { movePath, newUrl } from "@/api/dufs"
import type { PathItem } from "@/types/dufs"

interface Props {
  open: boolean
  item: PathItem | null
  currentPath: string
  onDone: () => void
  onCancel: () => void
}

export function MoveRenameDialog({ open, item, currentPath, onDone, onCancel }: Props) {
  const [newPath, setNewPath] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleOpenChange = (o: boolean) => {
    if (o && item) setNewPath(item.name)
    else onCancel()
  }

  const handleSubmit = async () => {
    if (!item || !newPath) return
    try {
      const fromUrl = newUrl(currentPath, item.name)
      const toUrl = new URL(fromUrl).origin + new URL(fromUrl).pathname.replace(
        decodeURIComponent(new URL(fromUrl).pathname).split("/").slice(-1)[0],
        ""
      ) + newPath.split("/").map(encodeURIComponent).join("/")
      await movePath(fromUrl, toUrl)
      onDone()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move / Rename</DialogTitle>
          <DialogDescription>
            Enter the new path for &quot;{item?.name}&quot;
          </DialogDescription>
        </DialogHeader>
        <Input
          value={newPath}
          onChange={(e) => { setNewPath(e.target.value); setError(null) }}
          placeholder="new/path/name"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSubmit}>Move</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: 创建 UploadProgressSheet**

```tsx
// src/components/dialogs/UploadProgressSheet.tsx
import { useAppState } from "@/context/AppContext"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Upload, X, Check, AlertCircle, RefreshCw } from "lucide-react"
import { uploadFile } from "@/api/dufs"

export function UploadProgressSheet() {
  const { state, dispatch } = useAppState()

  const activeUploads = state.uploads.filter(u => u.status !== "done" && u.status !== "error")
  const completeUploads = state.uploads.filter(u => u.status === "done")
  const failedUploads = state.uploads.filter(u => u.status === "error")

  const handleRetry = (id: number) => {
    const upload = state.uploads.find(u => u.id === id)
    if (!upload) return
    dispatch({ type: "UPDATE_UPLOAD", id, updates: { status: "pending", uploaded: 0 } })
    uploadFile(id, upload.file, upload.url, {
      onProgress: (id, uploaded, total) => {
        dispatch({ type: "UPDATE_UPLOAD", id, updates: { uploaded, status: "uploading" } })
      },
      onComplete: (id) => {
        dispatch({ type: "UPDATE_UPLOAD", id, updates: { status: "done" } })
      },
      onError: (id, error) => {
        dispatch({ type: "UPDATE_UPLOAD", id, updates: { status: "error", errorMessage: error } })
      },
    })
  }

  const total = activeUploads.length + completeUploads.length + failedUploads.length
  if (total === 0) return null

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-8">
          <Upload className="size-4" />
          {activeUploads.length > 0 && (
            <Badge className="absolute -top-1 -right-1 size-4 p-0 flex items-center justify-center text-[10px]">
              {activeUploads.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-80">
        <SheetHeader>
          <SheetTitle>Uploads</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          {[...activeUploads, ...failedUploads].map(u => (
            <div key={u.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate flex-1">{u.name}</span>
                <span className="ml-2 text-muted-foreground text-xs">
                  {u.status === "pending" && "Waiting..."}
                  {u.status === "uploading" && `${Math.round(u.file.size ? u.uploaded / u.file.size * 100 : 0)}%`}
                  {u.status === "error" && (
                    <button onClick={() => handleRetry(u.id)} className="text-primary hover:underline">
                      <RefreshCw className="size-3 inline" /> Retry
                    </button>
                  )}
                </span>
              </div>
              {u.status === "uploading" && (
                <Progress value={u.file.size ? (u.uploaded / u.file.size) * 100 : 0} className="h-1" />
              )}
              {u.status === "error" && u.errorMessage && (
                <p className="text-xs text-destructive">{u.errorMessage}</p>
              )}
            </div>
          ))}
          {completeUploads.length > 0 && (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Check className="size-3 text-green-500" />
              {completeUploads.length} completed
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 4: 验证编译**

```bash
pnpm typecheck
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add dialog components (delete, move/rename, upload progress)"
```

---

### Task 10: App.tsx 整合 & 入口文件

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`
- Modify: `index.html`

- [ ] **Step 1: 更新 App.tsx — 主应用整合**

`src/App.tsx` 完整替换为：

```tsx
// src/App.tsx
import { useEffect } from "react"
import { AppProvider, useAppState } from "@/context/AppContext"
import { fetchIndexData, uploadFile, newUrl } from "@/api/dufs"
import { ResizablePanel } from "@/components/layout/ResizablePanel"
import { Sidebar } from "@/components/layout/Sidebar"
import { MainPanel } from "@/components/layout/MainPanel"
import { FileTree } from "@/components/file-tree/FileTree"
import { Toolbar } from "@/components/toolbar/Toolbar"
import { DirTable } from "@/components/dir-table/DirTable"
import { FilePreview } from "@/components/file-preview/FilePreview"
import { UploadProgressSheet } from "@/components/dialogs/UploadProgressSheet"
import { useRef, useCallback } from "react"

function decodeBase64(b64: string): string {
  const binString = atob(b64)
  const bytes = new Uint8Array(binString.length)
  for (let i = 0; i < binString.length; i++) bytes[i] = binString.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

let uploadIdCounter = 0

function AppContent() {
  const { state, dispatch } = useAppState()
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = document.getElementById("index-data")
    if (!el) return
    const data = JSON.parse(decodeBase64(el.innerHTML))
    dispatch({ type: "SET_CURRENT", path: data.href, data })
    if (data.auth) {
      dispatch({ type: "SET_AUTH", auth: { required: true, user: data.user || null } })
    }
  }, [dispatch])

  const startUpload = useCallback((files: FileList | File[]) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size === 0) continue
      const id = ++uploadIdCounter
      const item = {
        id,
        name: file.name,
        file,
        url: newUrl(state.currentPath, file.name),
        uploaded: 0,
        status: "pending" as const,
      }
      dispatch({ type: "ADD_UPLOAD", item })
      uploadFile(id, file, item.url, {
        onProgress: (id, uploaded, total) => {
          dispatch({ type: "UPDATE_UPLOAD", id, updates: { uploaded, status: "uploading" } })
        },
        onComplete: (id) => {
          dispatch({ type: "UPDATE_UPLOAD", id, updates: { status: "done" } })
        },
        onError: (id, error) => {
          dispatch({ type: "UPDATE_UPLOAD", id, updates: { status: "error", errorMessage: error } })
        },
      })
    }
  }, [state.currentPath, dispatch])

  useEffect(() => {
    const el = dropRef.current
    if (!el) return
    const prevent = (e: DragEvent) => { e.preventDefault(); e.stopPropagation() }
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!e.dataTransfer?.files.length) return
      startUpload(e.dataTransfer.files)
    }
    const events: [string, (e: DragEvent) => void][] = [
      ["drag", prevent], ["dragstart", prevent], ["dragend", prevent],
      ["dragover", prevent], ["dragenter", prevent], ["dragleave", prevent],
      ["drop", handleDrop],
    ]
    events.forEach(([name, fn]) => el.addEventListener(name, fn))
    return () => events.forEach(([name, fn]) => el.removeEventListener(name, fn))
  }, [startUpload])

  const showPreview = state.selectedPath && !state.selectedPath.endsWith("/")

  return (
    <div ref={dropRef} className="h-screen flex overflow-hidden">
      <ResizablePanel
        defaultWidth={240}
        minWidth={160}
        maxWidth={480}
        collapsed={!state.sidebarOpen}
      >
        <Sidebar>
          <FileTree />
        </Sidebar>
      </ResizablePanel>
      <MainPanel
        toolbar={<Toolbar />}
        content={
          showPreview ? (
            <FilePreview />
          ) : (
            <div className="p-4">
              {!state.currentData?.paths?.length ? (
                <div className="text-muted-foreground italic py-8 text-center">
                  {state.currentData?.dir_exists ? "Empty folder" : "Folder will be created when a file is uploaded"}
                </div>
              ) : (
                <DirTable />
              )}
            </div>
          )
        }
      />
      <UploadProgressSheet />
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}
```

- [ ] **Step 2: 更新 main.tsx**

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 3: 更新 index.html — 添加 dark class 检测脚本**

在 `index.html` 的 `<head>` 中添加（Tailwind dark mode 初始化）：

```html
<script>
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark')
  }
</script>
```

完整文件：

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/x-icon" href="favicon.ico" />
    <script>
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark')
      }
    </script>
    <title>Dufs</title>
  </head>
  <body>
    <div id="root"></div>
    <template id="index-data">__INDEX_DATA__</template>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 4: 验证 dev 运行 & 编译**

```bash
pnpm typecheck
pnpm dev
```

Expected: Vite 开发服务器启动，无编译错误。

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: integrate all components into App shell"
```

---

### Task 11: 构建配置 & 验证

**Files:**
- Modify: `vite.config.ts`
- Create: `public/favicon.ico`

- [ ] **Step 1: 配置 vite-plugin-singlefile**

更新 `vite.config.ts`：

```ts
import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
})
```

- [ ] **Step 2: 复制 favicon.ico**

```bash
Copy-Item -Path "C:\Users\Administrator\Desktop\dufs\assets\favicon.ico" -Destination "C:\Users\Administrator\Desktop\code\dufs-shadcn-assets\public\favicon.ico"
```

- [ ] **Step 3: 创建构建后处理脚本**

构建后的 `index.html` 中 `<template id="index-data">__INDEX_DATA__</template>` 需要保留占位符，让 dufs 在运行时替换。验证构建产物中占位符存在。

```bash
pnpm build
```

- [ ] **Step 4: 验证构建产物**

```bash
Get-ChildItem dist/
```

Expected: `dist/index.html`（单文件）和 `dist/favicon.ico`。

检查 `dist/index.html` 包含 `__INDEX_DATA__` 占位符：

```bash
Select-String -Path "dist\index.html" -Pattern "__INDEX_DATA__"
```

- [ ] **Step 5: 用 dufs 验证**

构建完成后，用 dufs 的 `--assets` 参数测试：

```bash
dufs ./some-test-dir --assets ./dist
```

打开浏览器验证 UI 正常工作。

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add build config with vite-plugin-singlefile"
```

---

### Task 12: 最终验证 & README

**Files:**
- Create: `README.md`
- Create: `.gitignore`

- [ ] **Step 1: 创建 .gitignore**

```
node_modules
dist
.DS_Store
*.local
```

- [ ] **Step 2: 创建 README.md**

```md
# dufs-shadcn-assets

A modern React + shadcn/ui theme for [dufs](https://github.com/sigoden/dufs) file server.

## Features

- Dual-pane file manager layout (tree + detail)
- File tree with lazy-loading directories
- File preview (text files, images, video/audio, PDF)
- Drag-and-drop upload with progress
- Delete, move/rename, new folder/file
- Search, sorting, breadcrumb navigation
- Dark/light mode
- Auth support (login/logout)

## Usage

```bash
# Build
pnpm install
pnpm build

# Use with dufs
dufs ./serve-path --assets ./dist
```

## Development

```bash
pnpm install
pnpm dev
```

## License

MIT
```

- [ ] **Step 3: 最终验证**

```bash
pnpm typecheck
pnpm build
```

Expected: 编译通过，构建成功。

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: add README and .gitignore"
```