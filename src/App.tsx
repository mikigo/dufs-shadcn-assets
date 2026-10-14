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

let uploadIdCounter = 0

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

      // 文件预览页（kind: "View"）：拉取父目录数据填充文件树
      if (data.kind === "View") {
        // 无尾部斜杠的路径可能是目录，尝试获取目录列表
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
        try {
          dirData = await fetchIndexData(parentDir)
        } catch {
          // 父目录拉取失败，至少显示 FilePreview
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
        dispatch({ type: "SELECT", path: data.href })
        return
      }

      dispatch({ type: "SET_CURRENT", path: data.href, data })
      if (data.auth) {
        dispatch({ type: "SET_AUTH", auth: { required: true, user: data.user || null } })
      }
    }
    init()
  }, [dispatch])

  // 从 dufs-config 读取 view_mode 配置
  useEffect(() => {
    try {
      const el = document.getElementById("dufs-config")
      if (el?.textContent) {
        const cfg = JSON.parse(el.textContent)
        if (cfg.view_mode === "list" || cfg.view_mode === "icons") {
          dispatch({ type: "SET_VIEW_MODE", mode: cfg.view_mode })
        }
      }
    } catch {}
  }, [dispatch])

// 监听浏览器前进/后退，同步导航
  useEffect(() => {
    const handlePopState = async () => {
      const path = location.pathname + location.search
      // ?view URL → 文件预览，需要先拉取父目录数据填充树
      if (location.search === "?view") {
        const parentDir = location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1) || "/"
        try {
          const dirData = await fetchIndexData(parentDir)
          if (location.search !== "?view" || location.pathname + location.search !== path) return
          dispatch({ type: "SET_TREE", path: "/", nodes: [] })
          dispatch({ type: "SET_CURRENT", path: dirData.href, data: dirData })
        } catch (e) {
          if (location.pathname + location.search !== path) return
          dispatch({ type: "SET_TREE", path: "/", nodes: [] })
          dispatch({ type: "SET_CURRENT", path: parentDir, data: {
            href: parentDir, uri_prefix: "", kind: "Index" as const, paths: [],
            allow_upload: false, allow_delete: false,
            allow_search: false, allow_archive: false,
            auth: false, user: "", dir_exists: true, editable: "",
          }})
        }
        dispatch({ type: "SELECT", path: location.pathname })
        return
      }

      let targetPath = path || "/"
      try {
        let data = await fetchIndexData(targetPath)
        if (location.pathname + location.search !== path) return

        // 无尾部斜杠的路径可能是目录，尝试获取目录列表
        if (data.kind === "View" && !targetPath.endsWith("/")) {
          try {
            const indexData = await fetchIndexData(targetPath + "/")
            if (location.pathname + location.search !== path) return
            if (indexData.kind === "Index") {
              data = indexData
              pushHistory(indexData.href)
            }
          } catch {}
        }

        dispatch({ type: "SET_TREE", path: "/", nodes: [] })
        dispatch({ type: "SET_CURRENT", path: data.href, data })
      } catch (err) {
      }
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [dispatch])

  // Debug: expose state globally
  useEffect(() => {
    (window as any).__appState = state
  }, [state])

  const ensureAuth = useCallback(async () => {
    if (state.auth.required && !state.auth.user) {
      try {
        const user = await checkAuth(state.currentPath)
        dispatch({ type: "SET_AUTH", auth: { required: true, user } })
      } catch {
        // 认证失败则不继续上传
        return false
      }
    }
    return true
  }, [state.auth.required, state.auth.user, state.currentPath, dispatch])

  const startUpload = useCallback(async (files: FileList | File[], baseDir?: string) => {
    if (!await ensureAuth()) return
    const dirPath = baseDir || state.currentPath
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
        },
        onError: (id, error) => {
          dispatch({ type: "UPDATE_UPLOAD", id, updates: { status: "error", errorMessage: error } })
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
      // 文件夹递归上传
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

  // beforeunload 保护：上传中阻止页面离开
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