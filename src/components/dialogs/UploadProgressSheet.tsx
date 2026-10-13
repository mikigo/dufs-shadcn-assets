import { Button } from "@/components/ui/button"
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
      <SheetTrigger>
        <Button variant="ghost" size="icon" className="relative">
          <Upload data-icon />
          {activeUploads.length > 0 && (
            <Badge className="absolute -top-1 -right-1 size-4 p-0 flex items-center justify-center text-[10px]">
              {activeUploads.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-80">
        <SheetHeader>
          <SheetTitle>Uploads</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex flex-col gap-3">
          {[...activeUploads, ...failedUploads].map(u => (
            <div key={u.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate flex-1">{u.name}</span>
                <span className="ml-2 text-muted-foreground text-xs">
                  {u.status === "pending" && "Waiting..."}
                  {u.status === "uploading" && `${Math.round(u.file.size ? u.uploaded / u.file.size * 100 : 0)}%`}
                  {u.status === "error" && (
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => handleRetry(u.id)}>
                      <RefreshCw data-icon="inline-start" /> Retry
                    </Button>
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
              <Check data-icon />
              <Badge variant="secondary">{completeUploads.length} completed</Badge>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}