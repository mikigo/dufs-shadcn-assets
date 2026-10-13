import { useAppState } from "@/context/AppContext"
import { canIframePreview, baseNameFromUrl } from "@/api/dufs"
import { TextPreview } from "./TextPreview"
import { MediaPreview } from "./MediaPreview"
import { FileWarning } from "lucide-react"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"

export function FilePreview() {
  const { state } = useAppState()

  if (!state.selectedPath) return null

  const fileName = baseNameFromUrl(state.selectedPath)
  const isMedia = canIframePreview(state.selectedPath)
  const isTextLike = [".txt", ".md", ".json", ".xml", ".yml", ".yaml", ".toml", ".ini", ".cfg",
    ".conf", ".log", ".csv", ".tsv", ".html", ".htm", ".css", ".js", ".ts", ".tsx", ".jsx",
    ".rs", ".py", ".rb", ".go", ".java", ".c", ".cpp", ".h", ".sh", ".bash", ".zsh",
    ".sql", ".r", ".lua", ".php", ".swift", ".kt", ".scala", ".elm", ".ex", ".exs", ".erl",
    ".hrl", ".hs", ".clj", ".edn", ".dart", ".groovy", ".Makefile", ".Dockerfile",
  ].some(ext => fileName.toLowerCase().endsWith(ext))

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-2 border-b bg-muted/30 text-sm font-medium flex items-center gap-2">
        {fileName}
      </div>
      <div className="flex-1 overflow-hidden">
        {isTextLike ? (
          <TextPreview filePath={state.selectedPath} />
        ) : isMedia ? (
          <MediaPreview filePath={state.selectedPath} />
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileWarning />
              </EmptyMedia>
              <EmptyTitle>Preview not available</EmptyTitle>
              <EmptyDescription>File format not supported for preview</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  )
}