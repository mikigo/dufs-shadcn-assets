import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

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

/** 根据文件扩展名返回对应的图标名称 */
const EXT_ICON_MAP: Record<string, string> = {
  // 图片
  jpg: "image", jpeg: "image", png: "image", gif: "image", svg: "image",
  webp: "image", bmp: "image", ico: "image", tiff: "image",
  // 视频
  mp4: "video", mov: "video", avi: "video", wmv: "video", flv: "video",
  webm: "video", mkv: "video",
  // 音频
  mp3: "audio", wav: "audio", ogg: "audio", flac: "audio", m4a: "audio",
  aac: "audio", wma: "audio",
  // 脚本（终端可执行）
  py: "terminal", sh: "terminal", bash: "terminal", zsh: "terminal",
  rb: "terminal", ps1: "terminal", bat: "terminal", cmd: "terminal",
  // 代码
  js: "code", ts: "code", jsx: "code", tsx: "code",
  css: "code", scss: "code", less: "code", html: "code", htm: "code",
  xml: "code", go: "code", rs: "code", java: "code", c: "code",
  cpp: "code", h: "code", php: "code", swift: "code", kt: "code",
  scala: "code", dart: "code", lua: "code", r: "code", sql: "code",
  vue: "code", svelte: "code",
  // 配置（JSON样式）
  json: "json", yaml: "json", yml: "json", toml: "json",
  // 系统配置
  ini: "cog", cfg: "cog", conf: "cog", env: "cog",
  // Markdown / 纯文本
  md: "text", mdx: "text", txt: "text", log: "text", pdf: "text",
  // Word 文档
  doc: "pen", docx: "pen", pages: "pen", odt: "pen", rtf: "pen",
  // 演示文稿
  ppt: "presentation", pptx: "presentation", odp: "presentation", key: "presentation",
  // 表格
  xls: "spreadsheet", xlsx: "spreadsheet", csv: "spreadsheet",
  tsv: "spreadsheet", ods: "spreadsheet", numbers: "spreadsheet",
  // 压缩包
  zip: "archive", tar: "archive", gz: "archive", rar: "archive",
  "7z": "archive", bz2: "archive", xz: "archive",
}

export type FileIconType =
  | "default" | "image" | "video" | "audio"
  | "code" | "terminal" | "json" | "cog"
  | "text" | "pen" | "presentation" | "spreadsheet" | "archive"

export function getFileIconType(filename: string): FileIconType {
  const ext = filename.split(".").pop()?.toLowerCase() || ""
  return (EXT_ICON_MAP[ext] as FileIconType) || "default"
}

export function baseNameFromUrl(url: string): string {
  return decodeURIComponent(url.split("/").filter(v => v.length > 0).slice(-1)[0])
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