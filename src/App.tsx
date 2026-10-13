import { useEffect, useRef, useCallback } from "react"
import { AppProvider, useAppState } from "@/context/AppContext"
import { uploadFile, newUrl, decodeBase64, fetchIndexData } from "@/api/dufs"
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
    const el = document.getElementById("index-data")
    if (!el) return
    const raw = el.textContent || el.innerHTML
    // 注意: 不能使用 raw === "__INDEX_DATA__" 来检测占位符
    // 因为 dufs 在服务 HTML 时会全局替换 __INDEX_DATA__，
    // JS 代码中的字面量字符串也会被替换成 base64 数据，导致比较永远为 true
    // 改用长度判断: 占位符只有 15 个字符，真实数据至少几百个字符
    if (!raw || raw.length < 100) return
    const data = JSON.parse(decodeBase64(raw))
    // 跳过文件预览页（kind: "View"），其数据不含 paths 字段
    if (data.kind === "View") return
    dispatch({ type: "SET_CURRENT", path: data.href, data })
    if (data.auth) {
      dispatch({ type: "SET_AUTH", auth: { required: true, user: data.user || null } })
    }
  }, [dispatch])

  // 监听浏览器前进/后退，同步导航
  useEffect(() => {
    const handlePopState = async () => {
      const path = location.pathname + location.search
      try {
        const data = await fetchIndexData(path || "/")
        dispatch({ type: "SET_CURRENT", path: data.href, data })
      } catch (err) {
        console.error("PopState navigation failed:", err)
      }
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [dispatch])

  // Debug: expose state globally
  useEffect(() => {
    (window as any).__appState = state
  }, [state])

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
    const events: [string, (e: Event) => void][] = [
      ["drag", prevent], ["dragstart", prevent], ["dragend", prevent],
      ["dragover", prevent], ["dragenter", prevent], ["dragleave", prevent],
      ["drop", handleDrop as any],
    ]
    events.forEach(([name, fn]) => el.addEventListener(name, fn))
    return () => events.forEach(([name, fn]) => el.removeEventListener(name, fn))
  }, [startUpload])

  const showPreview = state.selectedPath && !state.selectedPath.endsWith("/")

  const sidebarDefaultWidth = Math.floor(window.innerWidth * 0.2)

  return (
    <div ref={dropRef} className="h-screen flex overflow-hidden">
      <ResizablePanel
        defaultWidth={sidebarDefaultWidth}
        minWidth={200}
        maxWidth={Math.floor(window.innerWidth * 0.5)}
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