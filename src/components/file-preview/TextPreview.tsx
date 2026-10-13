import { useEffect, useState } from "react"
import { fetchFileContent } from "@/api/dufs"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Props {
  filePath: string
}

export function TextPreview({ filePath }: Props) {
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setContent(null)
    setError(null)
    fetchFileContent(filePath)
      .then(setContent)
      .catch(err => setError(err.message))
  }, [filePath])

  if (error) return <div className="p-4 text-sm text-destructive">Failed to load: {error}</div>
  if (content === null) return <div className="p-4 text-sm text-muted-foreground">Loading...</div>

  return (
    <ScrollArea className="h-full">
      <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-all">{content}</pre>
    </ScrollArea>
  )
}