import { useEffect, useState, useRef } from "react"
import { fetchFileContent, saveFile } from "@/api/dufs"
import { Check, X } from "lucide-react"

interface Props {
  filePath: string
  onSave: () => void
  onCancel: () => void
}

export function EditPreview({ filePath, onSave, onCancel }: Props) {
  const [content, setContent] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetchFileContent(filePath)
      .then(setContent)
      .catch(err => setError(err.message))
  }, [filePath])

  useEffect(() => {
    if (content !== null && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [content])

  const handleSave = async () => {
    if (content === null) return
    setSaving(true)
    setError(null)
    try {
      await saveFile(filePath, content)
      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onCancel()
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault()
      handleSave()
    }
  }

  if (content === null) {
    return <div className="p-4 text-sm text-muted-foreground">Loading...</div>
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-1 px-2 py-1 border-b border-border/40 bg-background">
        <button
          onClick={handleSave}
          disabled={saving}
          className="p-0.5 rounded-sm hover:bg-muted transition-colors disabled:opacity-50"
          title="Save (Ctrl+S)"
        >
          <Check className="size-4 text-green-600" />
        </button>
        <button
          onClick={onCancel}
          className="p-0.5 rounded-sm hover:bg-muted transition-colors"
          title="Cancel (Esc)"
        >
          <X className="size-4" />
        </button>
        {error && (
          <span className="text-xs text-destructive ml-2">{error}</span>
        )}
      </div>
      <textarea
        ref={textareaRef}
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 w-full p-4 text-[13px] font-mono bg-muted/30 resize-none outline-none"
        spellCheck={false}
      />
    </div>
  )
}