import { useAppState } from "@/context/AppContext"
import { baseNameFromUrl, pushHistory } from "@/api/dufs"
import { isEditable } from "@/lib/utils"
import { TextPreview } from "./TextPreview"
import { OfvPreview } from "./OfvPreview"
import { X, Pen } from "lucide-react"

export function FilePreview() {
  const { state, dispatch } = useAppState()

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

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2.5 border-b border-border/40 text-sm font-medium flex items-center gap-2 bg-background">
        <span className="truncate">{fileName}</span>
        {editable && (
          <a
            href={state.selectedPath + "?edit"}
            target="_blank"
            className="p-0.5 rounded-sm hover:bg-muted transition-colors shrink-0"
            title="Edit"
          >
            <Pen className="size-4" />
          </a>
        )}
        <button
          onClick={handleClose}
          className="ml-auto p-0.5 rounded-sm hover:bg-muted transition-colors shrink-0"
          title="Close"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="flex-1 overflow-hidden bg-muted/30">
        {isTextLike ? (
          <TextPreview filePath={state.selectedPath} />
        ) : (
          <OfvPreview filePath={state.selectedPath} />
        )}
      </div>
    </div>
  )
}