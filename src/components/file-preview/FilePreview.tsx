import { useState, useCallback } from "react"
import { useAppState } from "@/context/AppContext"
import { baseNameFromUrl, pushHistory } from "@/api/dufs"
import { isEditable } from "@/lib/utils"
import { TextPreview } from "./TextPreview"
import { EditPreview } from "./EditPreview"
import { OfvPreview } from "./OfvPreview"
import { X, Pen, RefreshCw } from "lucide-react"

export function FilePreview() {
  const { state, dispatch } = useAppState()
  const [editing, setEditing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  if (!state.selectedPath) return null

  const fileName = baseNameFromUrl(state.selectedPath)
  const editable = isEditable(fileName)
  const isTextLike = [".txt", ".json", ".xml", ".yml", ".yaml", ".toml", ".ini", ".cfg",
    ".conf", ".log", ".csv", ".tsv", ".html", ".htm", ".css", ".js", ".ts", ".tsx", ".jsx",
    ".rs", ".py", ".rb", ".go", ".java", ".c", ".cpp", ".h", ".sh", ".bash", ".zsh",
    ".sql", ".r", ".lua", ".php", ".swift", ".kt", ".scala", ".elm", ".ex", ".exs", ".erl",
    ".hrl", ".hs", ".clj", ".edn", ".dart", ".groovy", ".Makefile", ".Dockerfile",
  ].some(ext => fileName.toLowerCase().endsWith(ext))

  const parentDir = state.selectedPath.substring(0, state.selectedPath.lastIndexOf("/") + 1) || "/"

  const handleClose = () => {
    dispatch({ type: "SELECT", path: null })
    pushHistory(parentDir)
  }

  const handleRefresh = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2.5 border-b border-border/40 text-sm font-medium flex items-center gap-2 bg-background">
        <span className="truncate">{fileName}</span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-0.5 rounded-sm hover:bg-muted transition-colors shrink-0"
            title="Refresh"
          >
            <RefreshCw className="size-3.5" />
          </button>
          {editable && isTextLike && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-0.5 rounded-sm hover:bg-muted transition-colors shrink-0"
              title="Edit"
            >
              <Pen className="size-4" />
            </button>
          )}
          <button
            onClick={handleClose}
            className="p-0.5 rounded-sm hover:bg-muted transition-colors shrink-0"
            title="Close"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden bg-muted/30">
        {isTextLike ? (
          editing ? (
            <EditPreview
              key={refreshKey}
              filePath={state.selectedPath}
              onSave={() => setEditing(false)}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <TextPreview key={refreshKey} filePath={state.selectedPath} />
          )
        ) : (
          <OfvPreview key={refreshKey} filePath={state.selectedPath} />
        )}
      </div>
    </div>
  )
}