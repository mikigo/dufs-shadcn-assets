import { useAppState } from "@/context/AppContext"
import { fetchIndexData, deletePath, newUrl, pushHistory } from "@/api/dufs"
import { formatFileSize, formatDirSize, isEditable } from "@/lib/utils"
import { Download, Trash2, Pencil, ArrowRightLeft, FolderSymlink, FileSymlink, FileText, Folder } from "lucide-react"
import { FileIcon } from "@react-symbols/icons/utils"
import { useState } from "react"
import { DeleteDialog } from "@/components/dialogs/DeleteDialog"
import { MoveRenameDialog } from "@/components/dialogs/MoveRenameDialog"
import { Button } from "@/components/ui/button"
import type { PathItem } from "@/types/dufs"

function getLargeIcon(pathType: string, filename?: string) {
  switch (pathType) {
    case "Dir": return <Folder className="size-10" />
    case "SymlinkDir": return <FolderSymlink className="size-10" />
    case "SymlinkFile": return <FileSymlink className="size-10" />
    default: return <FileIcon fileName={filename || ""} className="size-10" />
  }
}

export function IconView() {
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

  const handleClick = async (item: PathItem) => {
    if (item.path_type.endsWith("Dir")) {
      const dirPath = newUrl(state.currentPath, item.name) + "/"
      const data = await fetchIndexData(dirPath)
      pushHistory(dirPath)
      dispatch({ type: "SET_CURRENT", path: dirPath, data })
    } else {
      const filePath = newUrl(state.currentPath, item.name)
      pushHistory(filePath + "?view")
      dispatch({ type: "SELECT", path: filePath })
    }
  }

  const handleDownload = async (e: React.MouseEvent, item: PathItem) => {
    e.stopPropagation()
    const fileUrl = newUrl(state.currentPath, item.name)
    const isDir = item.path_type.endsWith("Dir")
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
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const url = newUrl(state.currentPath, deleteTarget.name)
    await deletePath(url)
    const data = await fetchIndexData(state.currentPath)
    dispatch({ type: "SET_CURRENT", path: state.currentPath, data })
    setDeleteTarget(null)
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground">
          {sorted.length} {sorted.length === 1 ? "item" : "items"}
        </span>
        <div className="flex gap-1 ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6"
            onClick={() => setSort(prev => ({
              key: "name",
              order: prev.key === "name" && prev.order === "asc" ? "desc" : "asc",
            }))}
          >
            Name {sort.key === "name" ? (sort.order === "asc" ? "↑" : "↓") : ""}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-6"
            onClick={() => setSort(prev => ({
              key: "mtime",
              order: prev.key === "mtime" && prev.order === "asc" ? "desc" : "asc",
            }))}
          >
            Date {sort.key === "mtime" ? (sort.order === "asc" ? "↑" : "↓") : ""}
          </Button>
        </div>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        {sorted.map(item => {
          const isDir = item.path_type.endsWith("Dir")
          const fileUrl = newUrl(state.currentPath, item.name)
          return (
            <div
              key={item.name}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border
                         hover:bg-muted/50 cursor-pointer transition-colors group relative"
              onDoubleClick={() => handleClick(item)}
            >
              {/* Actions on hover */}
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                {!isDir && (
                  <a href={fileUrl + "?view"} target="_blank" title="View">
                    <Button variant="ghost" size="icon" className="size-6">
                      <FileText className="size-3" />
                    </Button>
                  </a>
                )}
                {state.currentData?.allow_upload && !isDir && isEditable(item.name) && (
                  <a href={fileUrl + "?edit"} target="_blank" title="Edit">
                    <Button variant="ghost" size="icon" className="size-6">
                      <Pencil className="size-3" />
                    </Button>
                  </a>
                )}
                {state.currentData?.allow_upload && (
                  <Button variant="ghost" size="icon" className="size-6"
                    onClick={(e) => { e.stopPropagation(); setMoveTarget(item) }} title="Move / Rename">
                    <ArrowRightLeft className="size-3" />
                  </Button>
                )}
                {state.currentData?.allow_delete && (
                  <Button variant="ghost" size="icon" className="size-6"
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(item) }} title="Delete">
                    <Trash2 className="size-3" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="size-6" onClick={(e) => handleDownload(e, item)} title="Download">
                  <Download className="size-3" />
                </Button>
              </div>

              {/* Icon */}
              <div className="mt-3 text-muted-foreground">
                {getLargeIcon(item.path_type, item.name)}
              </div>

              {/* Name */}
              <span
                className="text-sm text-center leading-tight break-all line-clamp-2 text-primary hover:underline"
                onClick={(e) => { e.stopPropagation(); handleClick(item) }}
              >
                {item.name}
              </span>

              {/* Meta info */}
              <span className="text-[11px] text-muted-foreground text-center">
                {isDir ? formatDirSize(item.size) : formatFileSize(item.size).join(" ")}
              </span>
            </div>
          )
        })}
      </div>

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