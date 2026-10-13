import { useEffect, useState } from "react"
import { Markify } from "@glitchoff/markify"
import { fetchFileContent, newUrl } from "@/api/dufs"

interface Props {
  currentPath: string
  hasReadme: boolean
}

export function ReadmePreview({ currentPath, hasReadme }: Props) {
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!hasReadme) {
      setContent(null)
      return
    }
    setLoading(true)
    const url = newUrl(currentPath, "README.md")
    fetchFileContent(url)
      .then(setContent)
      .catch(() => setContent(null))
      .finally(() => setLoading(false))
  }, [currentPath, hasReadme])

  if (!hasReadme) return null
  if (loading) return (
    <div className="mt-6 border-t pt-4">
      <div className="h-4 bg-muted rounded animate-pulse w-1/3 mb-3" />
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded animate-pulse" />
        <div className="h-3 bg-muted rounded animate-pulse w-4/5" />
        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
      </div>
    </div>
  )
  if (!content) return null

  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark")

  return (
    <div className="mt-6 border-t pt-4">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        README.md
      </div>
      <div className="max-w-none">
        <Markify hljsTheme={isDark ? "dark" : "light"} codeBlockWorker={false}>
          {content}
        </Markify>
      </div>
    </div>
  )
}