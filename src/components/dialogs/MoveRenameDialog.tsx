import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { movePath, newUrl } from "@/api/dufs"
import type { PathItem } from "@/types/dufs"

interface Props {
  open: boolean
  item: PathItem | null
  currentPath: string
  onDone: () => void
  onCancel: () => void
}

export function MoveRenameDialog({ open, item, currentPath, onDone, onCancel }: Props) {
  const [newPath, setNewPath] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleOpenChange = (o: boolean) => {
    if (o && item) setNewPath(item.name)
    else onCancel()
  }

  const handleSubmit = async () => {
    if (!item || !newPath) return
    try {
      const fromUrl = newUrl(currentPath, item.name)
      const toUrl = new URL(fromUrl).origin + new URL(fromUrl).pathname.replace(
        decodeURIComponent(new URL(fromUrl).pathname).split("/").slice(-1)[0],
        ""
      ) + newPath.split("/").map(encodeURIComponent).join("/")
      await movePath(fromUrl, toUrl)
      onDone()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move / Rename</DialogTitle>
          <DialogDescription>
            Enter the new path for &quot;{item?.name}&quot;
          </DialogDescription>
        </DialogHeader>
        <Input
          value={newPath}
          onChange={(e) => { setNewPath(e.target.value); setError(null) }}
          placeholder="new/path/name"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSubmit}>Move</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}