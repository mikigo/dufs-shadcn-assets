import { useAppState } from "@/context/AppContext"
import { Progress } from "@/components/ui/progress"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Upload, Check, RefreshCw } from "lucide-react"
import { uploadFile } from "@/api/dufs"

export function UploadProgressSheet() {
  const { state, dispatch } = useAppState()

  const activeUploads = state.uploads.filter(u => u.status !== "done" && u.status !== "error")
  const completeUploads = state.uploads.filter(u => u.status === "done")
  const failedUploads = state.uploads.filter(u => u.status === "error")

  const handleRetry = (id: number) => {
    const upload = state.uploads.find(u => u.id === id)
    if (!upload) return
    dispatch({ type: "UPDATE_UPLOAD", id, updates: { status: "pending", uploaded: 0 } })
    uploadFile(id, upload.file, upload.url, {
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

  const total = activeUploads.length + completeUploads.length + failedUploads.length
  if (total === 0) return null

  return (
    <Sheet>
      <SheetTrigger className="relative size-8 inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none hover:bg-muted hover:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
        <Upload className="size-4" />
          {activeUploads.length > 0 && (
            <Badge className="absolute -top-1 -right-1 size-4 p-0 flex items-center justify-center text-[10px]">
              {activeUploads.length}
            </Badge>
          )}
      </SheetTrigger>
      <SheetContent className="w-80">
        <SheetHeader>
          <SheetTitle>Uploads</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          {[...activeUploads, ...failedUploads].map(u => (
            <div key={u.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate flex-1">{u.name}</span>
                <span className="ml-2 text-muted-foreground text-xs">
                  {u.status === "pending" && "Waiting..."}
                  {u.status === "uploading" && `${Math.round(u.file.size ? u.uploaded / u.file.size * 100 : 0)}%`}
                  {u.status === "error" && (
                    <button onClick={() => handleRetry(u.id)} className="text-primary hover:underline">
                      <RefreshCw className="size-3 inline" /> Retry
                    </button>
                  )}
                </span>
              </div>
              {u.status === "uploading" && (
                <Progress value={u.file.size ? (u.uploaded / u.file.size) * 100 : 0} className="h-1" />
              )}
              {u.status === "error" && u.errorMessage && (
                <p className="text-xs text-destructive">{u.errorMessage}</p>
              )}
            </div>
          ))}
          {completeUploads.length > 0 && (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Check className="size-3 text-green-500" />
              {completeUploads.length} completed
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}