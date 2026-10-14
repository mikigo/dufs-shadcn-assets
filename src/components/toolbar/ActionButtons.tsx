import { useAppState } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Upload, FolderPlus, FilePlus, Download, PanelLeft, LayoutGrid, List, RefreshCw } from "lucide-react"
import { uploadFile, createFolder, createFile, fetchIndexData } from "@/api/dufs"
import { newUrl } from "@/lib/utils"
import { useRef } from "react"

export function ActionButtons() {
  const { state, dispatch } = useAppState()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadId = useRef(0)

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
        onProgress: (id, uploaded, _total) => {
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

  const handleRefresh = async () => {
    const params = new URLSearchParams(window.location.search)
    const q = params.get("q")
    const path = q ? state.currentPath + "?q=" + encodeURIComponent(q) : state.currentPath
    const data = await fetchIndexData(path)
    dispatch({ type: "SET_CURRENT", path: state.currentPath, data })
  }

  return (
    <div className="flex items-center gap-1 ml-auto">
      {state.currentData?.allow_archive && (
        <Button variant="ghost" size="icon" onClick={handleDownload} title="Download ZIP">
          <Download data-icon />
        </Button>
      )}
      {state.currentData?.allow_upload && (
        <>
          <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} title="Upload files">
            <Upload data-icon />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
          />
          <Button variant="ghost" size="icon" onClick={handleNewFolder} title="New folder">
            <FolderPlus data-icon />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNewFile} title="New file">
            <FilePlus data-icon />
          </Button>
        </>
      )}
      <Button variant="ghost" size="icon" onClick={handleRefresh} title="Refresh">
        <RefreshCw data-icon />
      </Button>
      <Button
        variant="ghost" size="icon"
        title={state.viewMode === "icons" ? "Show as list" : "Show as icons"}
        onClick={() => dispatch({ type: "SET_VIEW_MODE", mode: state.viewMode === "icons" ? "list" : "icons" })}
      >
        {state.viewMode === "icons" ? <LayoutGrid data-icon /> : <List data-icon />}
      </Button>
      <Button variant="ghost" size="icon" onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })} title="Toggle sidebar">
        <PanelLeft data-icon />
      </Button>
    </div>
  )
}