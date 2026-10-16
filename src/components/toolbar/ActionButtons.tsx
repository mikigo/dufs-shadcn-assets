import { useAppState } from "@/context/AppContext"
import { Button } from "@/components/ui/button"
import { Upload, FolderPlus, FilePlus, Download, PanelLeft, LayoutGrid, List, RefreshCw } from "lucide-react"
import { enqueueUpload, createFolder, createFile, fetchIndexData } from "@/api/dufs"
import { newUrl } from "@/lib/utils"
import { useRef, type Dispatch } from "react"
import type { AppAction } from "@/types/dufs"

async function refreshDir(currentPath: string, dispatch: Dispatch<AppAction>) {
  try {
    const data = await fetchIndexData(currentPath)
    if (data.paths) {
      const dirPath = data.href.replace(/\/$/, "")
      const nodes = data.paths
        .sort((a, b) => {
          const aIsDir = a.path_type.endsWith("Dir") ? 1 : 0
          const bIsDir = b.path_type.endsWith("Dir") ? 1 : 0
          if (aIsDir !== bIsDir) return bIsDir - aIsDir
          return a.name.localeCompare(b.name)
        })
        .map(p => ({
          name: p.name,
          path: dirPath + "/" + encodeURIComponent(p.name),
          isDir: p.path_type.endsWith("Dir"),
          children: null,
          loaded: false,
        }))
      dispatch({ type: "REFRESH_DIR", path: data.href, data, nodes, treePath: dirPath })
    } else {
      dispatch({ type: "SET_CURRENT", path: data.href, data })
    }
  } catch {}
}

export function ActionButtons() {
  const { state, dispatch } = useAppState()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadId = useRef(0)

  const handleUpload = (files: FileList) => {
    let completed = 0
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
      enqueueUpload(id, file, item.url, {
        onProgress: (id: number, uploaded: number) => {
          dispatch({ type: "UPDATE_UPLOAD", id, updates: { uploaded, status: "uploading" } })
        },
        onComplete: (id: number) => {
          dispatch({ type: "UPDATE_UPLOAD", id, updates: { status: "done" } })
          if (++completed === files.length) {
            refreshDir(state.currentPath, dispatch)
          }
        },
        onError: (id: number, error: string) => {
          dispatch({ type: "UPDATE_UPLOAD", id, updates: { status: "error", errorMessage: error } })
          if (++completed === files.length) {
            refreshDir(state.currentPath, dispatch)
          }
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
    dispatch({ type: "SET_TREE", path: "/", nodes: [] })
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
        onClick={() => { const next = state.viewMode === "icons" ? "list" : "icons"; dispatch({ type: "SET_VIEW_MODE", mode: next }); localStorage.setItem("dufs-view-mode", next) }}
      >
        {state.viewMode === "icons" ? <LayoutGrid data-icon /> : <List data-icon />}
      </Button>
      <Button variant="ghost" size="icon" onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })} title="Toggle sidebar">
        <PanelLeft data-icon />
      </Button>
    </div>
  )
}