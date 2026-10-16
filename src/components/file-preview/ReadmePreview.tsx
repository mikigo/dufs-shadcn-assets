import { useEffect, useRef } from "react"
import { createViewer, textPlugin } from "@open-file-viewer/core"
import type { FileViewer } from "@open-file-viewer/core"
import "@open-file-viewer/core/style.css"

interface Props {
  currentPath: string
  hasReadme: boolean
}

export function ReadmePreview({ currentPath, hasReadme }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<FileViewer | null>(null)

  useEffect(() => {
    if (!hasReadme) return
    const container = containerRef.current
    if (!container) return

    const filePath = currentPath.replace(/\/$/, "") + "/README.md"
    const viewer = createViewer({
      container,
      file: filePath + "?_t=" + Date.now(),
      fileName: "README.md",
      plugins: [textPlugin()],
      theme: "auto",
      toolbar: false,
    })

    viewerRef.current = viewer
    return () => { viewer.destroy(); viewerRef.current = null }
  }, [currentPath, hasReadme])

  if (!hasReadme) return null

  return (
    <div className="mt-6 border-t pt-4">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        README.md
      </div>
      <div ref={containerRef} className="w-full" />
    </div>
  )
}