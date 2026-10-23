import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { FileEntry } from "@/types/dufs"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(size: number | null | undefined): [number, string] {
  if (size == null) return [0, "B"]
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  if (size === 0) return [0, "B"]
  const i = Math.floor(Math.log(size) / Math.log(1024))
  const raw = size / Math.pow(1024, i)
  const value = i > 0 && raw < 999.95 ? Math.round(raw * 10) / 10 : Math.round(raw)
  return [value, sizes[i]]
}

export function formatDirSize(size: number): string {
  const unit = size === 1 ? "item" : "items"
  const num = size >= 1000 ? `>999` : `${size}`
  return `${num} ${unit}`
}

export function formatMtime(mtime: number): string {
  if (!mtime) return ""
  const date = new Date(mtime)
  const pad = (v: number) => String(v).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatDuration(seconds: number): string {
  seconds = Math.ceil(seconds)
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds - h * 3600) / 60)
  const s = seconds - h * 3600 - m * 60
  const pad = (v: number) => String(v).padStart(2, "0")
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

export function formatPercent(percent: number): string {
  return percent > 10 ? percent.toFixed(1) + "%" : percent.toFixed(2) + "%"
}

export function newUrl(base: string, name: string): string {
  let url = base
  if (!url.endsWith("/")) url += "/"
  url += name.split("/").map(encodeURIComponent).join("/")
  return url
}

/** 根据当前目录和文件/目录项，生成可直接在浏览器打开的绝对链接 */
export function fileLinkUrl(currentPath: string, item: { name: string; path_type: string }): string {
  const path = newUrl(currentPath, item.name)
  const fullPath = item.path_type.endsWith("Dir") ? path + "/" : path
  return new URL(fullPath, window.location.origin).toString()
}

/** 复制文本到剪贴板，兼容非安全上下文（HTTP）环境 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }
    // HTTP 等非安全上下文下 navigator.clipboard 不可用，回退到 execCommand
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const ok = document.execCommand("copy")
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}

/** 可在线编辑的纯文本文件扩展名 */
const EDITABLE_EXTS = new Set([
  "md", "mdx", "txt", "log",
  "py", "pyw",
  "js", "jsx", "mjs", "cjs",
  "ts", "tsx",
  "css", "scss", "less",
  "html", "htm", "xml", "svg",
  "json", "yaml", "yml", "toml",
  "ini", "cfg", "conf", "env",
  "sh", "bash", "zsh", "bat", "cmd", "ps1",
  "go", "rs", "java", "c", "cpp", "h", "hpp",
  "php", "rb", "swift", "kt", "scala", "dart", "lua", "r",
  "sql", "vue", "svelte",
  "gitignore", "dockerfile", "makefile", "editorconfig",
])

export function isEditable(filename: string): boolean {
  const ext = filename.includes(".") ? filename.split(".").pop()?.toLowerCase() || "" : filename.toLowerCase()
  return EDITABLE_EXTS.has(ext)
}

export function pathsToEntries(paths: { name: string; path_type: string }[], basePath: string): FileEntry[] {
  const SYSTEM_DIRS = new Set([".dufs_shadcn_assets"])
  return paths
    .filter(p => !SYSTEM_DIRS.has(p.name))
    .sort((a, b) => {
      const aIsDir = a.path_type.endsWith("Dir") ? 1 : 0
      const bIsDir = b.path_type.endsWith("Dir") ? 1 : 0
      if (aIsDir !== bIsDir) return bIsDir - aIsDir
      return a.name.localeCompare(b.name)
    })
    .map(p => ({
      name: p.name,
      path: basePath.replace(/\/$/, "") + "/" + encodeURIComponent(p.name),
      isDir: p.path_type.endsWith("Dir"),
    }))
}