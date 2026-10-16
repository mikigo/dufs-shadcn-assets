import { useEffect, useRef, useCallback } from "react"
import { AppProvider, useAppState } from "@/context/AppContext"
import { enqueueUpload, isUploading, checkAuth, newUrl, decodeBase64, fetchIndexData, pushHistory } from "@/api/dufs"
import { ResizablePanel } from "@/components/layout/ResizablePanel"
import { Sidebar } from "@/components/layout/Sidebar"
import { MainPanel } from "@/components/layout/MainPanel"
import { FileTree } from "@/components/file-tree/FileTree"
import { Toolbar } from "@/components/toolbar/Toolbar"
import { DirTable } from "@/components/dir-table/DirTable"
import { IconView } from "@/components/dir-table/IconView"
import { FilePreview } from "@/components/file-preview/FilePreview"
import { ReadmePreview } from "@/components/file-preview/ReadmePreview"
import { UploadProgressSheet } from "@/components/dialogs/UploadProgressSheet"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { FolderOpen } from "lucide-react"
import { pathsToEntries } from "@/lib/utils"
import type { TreeStateNode, FileEntry } from "@/types/dufs"

let uploadIdCounter = 0

function entriesToRootNodes(entries: FileEntry[]): TreeStateNode[] {
  return entries.map(e => ({ element: e, parent: null, children: null, stale: false, loaded: false }))
}

function AppContent() {
  const { state, dispatch } = useAppState()
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function init() {
      const el = document.getElementById("index-data")
      if (!el) return
      const raw = el.textContent || el.innerHTML
      if (!raw || raw.length < 100) return
      const data = JSON.parse(decodeBase64(raw))

      if (data.kind === "View") {
        if (!data.href.endsWith("/")) {
          try {
            const indexData = await fetchIndexData(data.href + "/")
            if (indexData.kind === "Index") {
              dispatch({ type: "SET_CURRENT", path: indexData.href, data: indexData })
              pushHistory(indexData.href)
              return
            }
          } catch {}
        }

        const parentDir = data.href.substring(0, data.href.lastIndexOf("/") + 1) || "/"
        let dirData
        try { dirData = await fetchIndexData(parentDir) } catch {}

        if (parentDir !== "/") {
          try {
            const rootData = await fetchIndexData("/")
            if (rootData.paths) {
              dispatch({ type: "TREE_REPLACE_ROOT", nodes: entriesToRootNodes(pathsToEntries(rootData.paths, "/")) })
            }
          } catch {}
        }

        if (dirData) {
          dispatch({ type: "SET_CURRENT", path: dirData.href, data: dirData })
        } else {
          dispatch({ type: "SET_CURRENT", path: parentDir, data: {
            href: parentDir, uri_prefix: data.uri_prefix,
            kind: "Index" as const, paths: [],
            allow_upload: data.allow_upload, allow_delete: data.allow_delete,
            allow_search: false, allow_archive: false,
            auth: data.auth, user: data.user || "",
            dir_exists: true, editable: "",
          }})
        }
        dispatch({ type: "TREE_SELECT", path: data.href })
        return
      }

      dispatch({ type: "SET_CURRENT", path: data.href, data })
      if (data.auth) {
        dispatch({ type: "SET_AUTH", auth: { required: true, user: data.user || null } })
      }

      if (data.href !== "/") {
        try {
          const rootData = await fetchIndexData("/")
          if (rootData.paths) {
            dispatch({ type: "TREE_REPLACE_ROOT", nodes: entriesToRootNodes(pathsToEntries(rootData.paths, "/")) })
          }
        } catch {}
      }
    }
    init()
  }, [dispatch])

  useEffect(() => {
    async function loadConfig() {
      let cfg: Record<string, any> = {}

      try {
        const el = document.getElementById("dufs-config")
        if (el?.textContent) cfg = JSON.parse(el.textContent)
      } catch {}

      try {
        const res = await fetch("/dufs_shadcn_assets_config.json", { cache: "no-store" })
        if (res.ok) {
          const runtimeCfg = await res.json()
          cfg = { ...cfg, ...runtimeCfg }
        }
      } catch {}

      if (cfg.footer != null) {
        dispatch({ type: "SET_FOOTER", text: typeof cfg.footer === "string" ? cfg.footer : String(cfg.footer) })
      }
      if (Array.isArray(cfg.lock_edit_files)) {
        dispatch({ type: "SET_LOCKED_FILES", paths: cfg.lock_edit_files })
      }

      const savedView = localStorage.getItem("dufs-view-mode")
      const viewMode = savedView || cfg.view_mode
      if (viewMode === "list" || viewMode === "icons") {
        dispatch({ type: "SET_VIEW_MODE", mode: viewMode })
      }

      if (!localStorage.getItem("dufs-theme") && (cfg.theme === "dark" || cfg.theme === "light")) {
        localStorage.setItem("dufs-theme", cfg.theme)
        document.documentElement.classList.toggle("dark", cfg.theme === "dark")
      }
    }
    loadConfig()
  }, [dispatch])

  useEffect(() => {
    const handlePopState = async () => {
      const savedPath = location.pathname + location.search

      if (location.search === "?view") {
        const parentDir = location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1) || "/"
        try {
          const dirData = await fetchIndexData(parentDir)
          if (location.search !== "?view" || location.pathname + location.search !== savedPath) return
          if (parentDir !== "/") {
            try {
              const rootData = await fetchIndexData("/")
              if (rootData.paths) {
                dispatch({ type: "TREE_REPLACE_ROOT", nodes: entriesToRootNodes(pathsToEntries(rootData.paths, "/")) })
              }
            } catch {}
          }
          dispatch({ type: "SET_CURRENT", path: dirData.href, data: dirData })
        } catch {
          if (location.pathname + location.search !== savedPath) return
          dispatch({ type: "SET_CURRENT", path: parentDir, data: {
            href: parentDir, uri_prefix: "", kind: "Index" as const, paths: [],
            allow_upload: false, allow_delete: false,
            allow_search: false, allow_archive: false,
            auth: false, user: "", dir_exists: true, editable: "",
          }})
        }
        dispatch({ type: "TREE_SELECT", path: location.pathname })
        return
      }

      let targetPath = savedPath || "/"
      try {
        let data = await fetchIndexData(targetPath)
        if (location.pathname + location.search !== savedPath) return

        if (data.kind === "View" && !targetPath.endsWith("/")) {
          try {
            const indexData = await fetchIndexData(targetPath + "/")
            if (location.pathname + location.search !== savedPath) return
            if (indexData.kind === "Index") {
              data = indexData
              pushHistory(indexData.href)
            }
          } catch {}
        }

        if (data.href !== "/") {
          try {
            const rootData = await fetchIndexData("/")
            if (rootData.paths) {
              dispatch({ type: "TREE_REPLACE_ROOT", nodes: entriesToRootNodes(pathsToEntries(rootData.paths, "/")) })
            }
          } catch {}
        }
        dispatch({ type: "SET_CURRENT", path: data.href, data })
      } catch {}
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [dispatch])

  useEffect(() => {
    (window as any).__appState = state
  }, [state])

  const ensureAuth = useCallback(async () => {
    if (state.auth.required && !state.auth.user) {
      try {
        const user = await checkAuth(state.currentPath)
        dispatch({ type: "SET_AUTH", auth: { required: true, user } })
      } catch {
        return false
      }
    }
    return true
  }, [state.auth.required, state.auth.user, state.currentPath, dispatch])

  const refreshDirRef = useRef<(path: string) => void>(() => {})

  useEffect(() => {
    refreshDirRef.current = async (path: string) => {
      try {
        const data = await fetchIndexData(path)
        if (data.paths) {
          const entries = pathsToEntries(data.paths, data.href)
          dispatch({ type: "TREE_SET_CHILDREN", parentPath: data.href.replace(/\/$/, "") || "/", entries })
          dispatch({ type: "SET_CURRENT", path: data.href, data })
        }
      } catch {}
    }
  }, [dispatch])

  const startUpload = useCallback(async (files: FileList | File[], baseDir?: string) => {
    if (!await ensureAuth()) return
    const dirPath = baseDir || state.currentPath
    let completed = 0
    for (let i = 0; i < files.length; i++) {
      const file = files[i as unknown as number]
      if (!file || file.size === 0) continue
      const id = ++uploadIdCounter
      const item = {
        id,
        name: (file as any).webkitRelativePath || file.name,
        file: file as File,
        url: newUrl(dirPath, (file as any).webkitRelativePath || file.name),
        uploaded: 0,
        status: "pending" as const,
        rootDir: baseDir,
      }
      dispatch({ type: "ADD_UPLOAD", item })
      enqueueUpload(id, file as File, item.url, {
        onProgress: (id, uploaded) => {
          dispatch({ type: "UPDATE_UPLOAD", id, updates: { uploaded, status: "uploading" } })
        },
        onComplete: (id) => {
          dispatch({ type: "UPDATE_UPLOAD", id, updates: { status: "done" } })
          if (++completed === files.length) {
            refreshDirRef.current(dirPath)
          }
        },
        onError: (id, error) => {
          dispatch({ type: "UPDATE_UPLOAD", id, updates: { status: "error", errorMessage: error } })
          if (++completed === files.length) {
            refreshDirRef.current(dirPath)
          }
        },
      })
    }
  }, [ensureAuth, state.currentPath, dispatch])

  const startFolderUpload = useCallback(async (entry: any) => {
    const files: File[] = []
    const dirs: string[] = []
    async function traverse(e: any, prefix: string) {
      if (e.isFile) {
        const file = await new Promise<File>((resolve) => e.file(resolve))
        Object.defineProperty(file, "webkitRelativePath", { value: prefix + e.name, writable: false })
        files.push(file)
      } else if (e.isDirectory) {
        dirs.push(prefix + e.name)
        const reader = e.createReader()
        const readAll = (): Promise<any[]> => {
          return new Promise((resolve) => {
            const entries: any[] = []
            function readBatch() {
              reader.readEntries((batch: any[]) => {
                if (batch.length === 0) resolve(entries)
                else { entries.push(...batch); readBatch() }
              })
            }
            readBatch()
          })
        }
        const children = await readAll()
        for (const child of children) {
          await traverse(child, prefix + e.name + "/")
        }
      }
    }
    await traverse(entry, "")
    if (!await ensureAuth()) return
    for (const d of dirs) {
      const dirUrl = newUrl(state.currentPath, d) + "/"
      try { await fetch(dirUrl, { method: "MKCOL" }) } catch {}
    }
    startUpload(files, state.currentPath)
  }, [ensureAuth, state.currentPath, startUpload])

  useEffect(() => {
    const el = dropRef.current
    if (!el) return
    const prevent = (e: DragEvent) => { e.preventDefault(); e.stopPropagation() }
    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const items = e.dataTransfer?.items
      if (!items?.length) return
      if (typeof items[0].webkitGetAsEntry === "function") {
        const entry = items[0].webkitGetAsEntry()
        if (entry) {
          startFolderUpload(entry)
          return
        }
      }
      if (e.dataTransfer?.files.length) {
        startUpload(e.dataTransfer.files)
      }
    }
    const events: [string, (e: Event) => void][] = [
      ["drag", prevent], ["dragstart", prevent], ["dragend", prevent],
      ["dragover", prevent], ["dragenter", prevent], ["dragleave", prevent],
      ["drop", handleDrop as any],
    ]
    events.forEach(([name, fn]) => el.addEventListener(name, fn))
    return () => events.forEach(([name, fn]) => el.removeEventListener(name, fn))
  }, [startUpload, startFolderUpload])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isUploading()) {
        e.preventDefault()
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [])

  const showPreview = state.selectedPath && !state.selectedPath.endsWith("/")

  const sidebarDefaultWidth = Math.floor(window.innerWidth * 0.2)

  return (
    <div ref={dropRef} className="h-screen flex overflow-hidden">
      <ResizablePanel
        defaultWidth={sidebarDefaultWidth}
        minWidth={200}
        maxWidth={Math.floor(window.innerWidth * 0.5)}
        collapsed={!state.sidebarOpen}
        storageKey="sidebar-width"
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
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FolderOpen />
                    </EmptyMedia>
                    <EmptyTitle>
                      {state.currentData?.dir_exists ? "Empty folder" : "No folder"}
                    </EmptyTitle>
                    <EmptyDescription>
                      {state.currentData?.dir_exists
                        ? "This folder has no files or subdirectories yet."
                        : "Folder will be created when a file is uploaded."}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <>
                  {state.viewMode === "icons" ? <IconView /> : <DirTable />}
                  <ReadmePreview
                    currentPath={state.currentPath}
                    hasReadme={
                      !!state.currentData?.paths?.some(
                        p => p.name.toLowerCase() === "readme.md"
                      )
                    }
                  />
                </>
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