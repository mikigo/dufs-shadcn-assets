import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
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

  return (
    <div className="mt-6 border-t pt-4">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        README.md
      </div>
      <div className="prose prose-sm max-w-none dark:prose-invert
        prose-headings:text-foreground
        prose-p:text-foreground/80 prose-p:leading-relaxed
        prose-code:text-foreground/80 prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
        prose-pre:bg-muted prose-pre:border prose-pre:border-border
        prose-a:text-primary prose-a:no-underline hover:prose-a:underline
        prose-strong:text-foreground
        prose-li:text-foreground/80
        prose-img:rounded-lg prose-img:border prose-img:border-border
        prose-hr:border-border
        prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:bg-muted/50 prose-blockquote:py-0.5 prose-blockquote:px-4 prose-blockquote:rounded-r-md
      ">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}