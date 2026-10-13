import { useEffect, useRef, useCallback } from "react"
import { AppProvider, useAppState } from "@/context/AppContext"
import { uploadFile, newUrl, decodeBase64 } from "@/api/dufs"
import { ResizablePanel } from "@/components/layout/ResizablePanel"
import { Sidebar } from "@/components/layout/Sidebar"
import { MainPanel } from "@/components/layout/MainPanel"
import { FileTree } from "@/components/file-tree/FileTree"
import { Toolbar } from "@/components/toolbar/Toolbar"
import { DirTable } from "@/components/dir-table/DirTable"
import { FilePreview } from "@/components/file-preview/FilePreview"
import { UploadProgressSheet } from "@/components/dialogs/UploadProgressSheet"

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