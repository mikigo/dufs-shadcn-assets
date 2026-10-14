import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useAppState } from "@/context/AppContext"
import { fetchIndexData, deletePath, newUrl, pushHistory } from "@/api/dufs"
import { formatFileSize, formatDirSize, formatMtime, isEditable } from "@/lib/utils"
import { Download, Trash2, Pencil, ArrowRightLeft, FolderSymlink, FileSymlink, FileText, Folder } from "lucide-react"
import { FileIcon } from "@react-symbols/icons/utils"
import { useState } from "react"
import { DeleteDialog } from "@/components/dialogs/DeleteDialog"
import { MoveRenameDialog } from "@/components/dialogs/MoveRenameDialog"
import type { PathItem } from "@/types/dufs"

function getIcon(pathType: string, filename?: string) {
  switch (pathType) {
    case "Dir": return <Folder className="size-5 shrink-0 text-muted-foreground" />
    case "SymlinkDir": return <FolderSymlink className="size-5 shrink-0 text-muted-foreground" />
    case "SymlinkFile": return <FileSymlink className="size-5 shrink-0 text-muted-foreground" />
    default: return <FileIcon fileName={filename || ""} className="size-5 shrink-0" />
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
                <TableCell>{getIcon(item.path_type, item.name)}</TableCell>
                <TableCell className="font-medium">
                  <span className="text-primary hover:underline" onClick={(e) => { e.stopPropagation(); handleRowClick(item) }}>
                    {item.name}
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
                    <Button variant="ghost" size="icon" onClick={(e) => handleDownload(e, item)} title="Download">
                      <Download data-icon />
                    </Button>
                    {!isDir && (
                      <a href={fileUrl + "?view"} target="_blank" title="View">
                        <Button variant="ghost" size="icon">
                          <FileText data-icon />
                        </Button>
                      </a>
                    )}
                    {state.currentData?.allow_upload && (
                      <>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setMoveTarget(item) }} title="Move / Rename">
                          <ArrowRightLeft data-icon />
                        </Button>
                        {!isDir && isEditable(item.name) && (
                          <a href={fileUrl + "?edit"} target="_blank" title="Edit">
                            <Button variant="ghost" size="icon">
                              <Pencil data-icon />
                            </Button>
                          </a>
                        )}
                      </>
                    )}
                    {state.currentData?.allow_delete && (
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteTarget(item) }} title="Delete">
                        <Trash2 data-icon />
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