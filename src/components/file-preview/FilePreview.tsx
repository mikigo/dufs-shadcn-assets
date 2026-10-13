import { useAppState } from "@/context/AppContext"
import { baseNameFromUrl } from "@/api/dufs"
import { TextPreview } from "./TextPreview"
import { OfvPreview } from "./OfvPreview"

export function FilePreview() {
  const { state } = useAppState()

  if (!state.selectedPath) return null

  const fileName = baseNameFromUrl(state.selectedPath)
  const isTextLike = [".txt", ".json", ".xml", ".yml", ".yaml", ".toml", ".ini", ".cfg",
    ".conf", ".log", ".csv", ".tsv", ".html", ".htm", ".css", ".js", ".ts", ".tsx", ".jsx",
    ".rs", ".py", ".rb", ".go", ".java", ".c", ".cpp", ".h", ".sh", ".bash", ".zsh",
    ".sql", ".r", ".lua", ".php", ".swift", ".kt", ".scala", ".elm", ".ex", ".exs", ".erl",
    ".hrl", ".hs", ".clj", ".edn", ".dart", ".groovy", ".Makefile", ".Dockerfile",
  ].some(ext => fileName.toLowerCase().endsWith(ext))

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2.5 border-b border-border/40 text-sm font-medium flex items-center gap-2 bg-background">
        {fileName}
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