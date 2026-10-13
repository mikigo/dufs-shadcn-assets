import { useEffect, useState, useMemo } from "react"
import { fetchFileContent } from "@/api/dufs"
import { ScrollArea } from "@/components/ui/scroll-area"
import hljs from "highlight.js"
import { injectHljsTheme } from "@glitchoff/markify"

// 扩展名 → hljs 语言名映射
const extToLang: Record<string, string> = {
  js: "javascript", jsx: "javascript", mjs: "javascript", cjs: "javascript",
  ts: "typescript", tsx: "typescript",
  py: "python", pyw: "python",
  sh: "bash", bash: "bash", zsh: "bash", bat: "dos", cmd: "dos",
  css: "css", scss: "scss", less: "less",
  html: "xml", htm: "xml", xml: "xml", svg: "xml",
  json: "json", yaml: "yaml", yml: "yaml",
  ini: "ini", cfg: "ini", conf: "ini", env: "ini",
  sql: "sql",
  go: "go", rs: "rust", java: "java", kt: "kotlin", scala: "scala",
  c: "c", h: "c", cpp: "cpp", hpp: "cpp", cc: "cpp", cxx: "cpp",
  php: "php", rb: "ruby", swift: "swift", dart: "dart",
  md: "markdown", mdx: "markdown",
  toml: "ini",
  dockerfile: "dockerfile", makefile: "makefile",
  lua: "lua", r: "r", elm: "elm", erl: "erlang", ex: "elixir",
}

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

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    injectHljsTheme(isDark ? "dark" : "light")
  }, [])

  const highlighted = useMemo(() => {
    if (!content) return null
    const ext = filePath.split(".").pop()?.toLowerCase() || ""
    const lang = extToLang[ext]
    if (lang) {
      const result = hljs.highlight(content, { language: lang })
      if (result.value) return result.value
    }
    return content.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  }, [content, filePath])

  if (error) return <div className="p-4 text-sm text-destructive">Failed to load: {error}</div>
  if (content === null) return <div className="p-4 text-sm text-muted-foreground">Loading...</div>

  return (
    <ScrollArea className="h-full">
      <pre className="p-4 text-[13px] font-mono leading-relaxed">
        <code dangerouslySetInnerHTML={{ __html: highlighted || "" }} />
      </pre>
    </ScrollArea>
  )
}