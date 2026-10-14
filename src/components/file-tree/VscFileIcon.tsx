import { memo } from "react"
import {
  extToIcon, fileNameToIcon, folderNameToIcon,
  DEFAULT_FILE_ICON, DEFAULT_FOLDER_ICON
} from "@/generated/vsc-icon-map"
import { iconModules } from "@/generated/vsc-icon-modules"

// vscode-icons 对简单扩展名（js、ts 等）通过 languageIds 映射，不是 fileExtensions。
const COMMON_EXT_MAP: Record<string, string> = {
  "3gp": "file_type_video", "7z": "file_type_zip", "ai": "file_type_ai",
  "apk": "file_type_android", "asm": "file_type_assembly", "avi": "file_type_video",
  "bat": "file_type_bat", "bmp": "file_type_image", "c": "file_type_c",
  "cc": "file_type_cpp", "cfg": "file_type_config", "conf": "file_type_config",
  "cpp": "file_type_cpp", "cs": "file_type_csharp", "css": "file_type_css",
  "csv": "file_type_csv", "dll": "file_type_binary", "doc": "file_type_word",
  "docx": "file_type_word", "d.ts": "file_type_typescriptdef", "epub": "file_type_epub",
  "exe": "file_type_binary", "flv": "file_type_video", "gif": "file_type_image",
  "go": "file_type_go", "h": "file_type_c_header", "hpp": "file_type_cpp_header",
  "htm": "file_type_html", "html": "file_type_html", "jar": "file_type_jar",
  "java": "file_type_java", "jpeg": "file_type_image", "jpg": "file_type_image",
  "js": "file_type_js", "jsx": "file_type_reactjs", "json": "file_type_json",
  "kt": "file_type_kotlin", "less": "file_type_less", "log": "file_type_log",
  "lua": "file_type_lua", "map": "file_type_jsmap", "md": "file_type_markdown",
  "mkv": "file_type_video", "mov": "file_type_video", "mp3": "file_type_audio",
  "mp4": "file_type_video", "odt": "file_type_openoffice", "ogg": "file_type_audio",
  "pdf": "file_type_pdf", "php": "file_type_php", "png": "file_type_image",
  "ppt": "file_type_powerpoint", "pptx": "file_type_powerpoint", "psd": "file_type_photoshop",
  "py": "file_type_python", "rb": "file_type_ruby", "rpm": "file_type_rpm",
  "rs": "file_type_rust", "rtf": "file_type_text", "sass": "file_type_sass",
  "scss": "file_type_scss", "sh": "file_type_shell", "sql": "file_type_sql",
  "svg": "file_type_svg", "swift": "file_type_swift", "tar": "file_type_zip",
  "tgz": "file_type_zip", "tiff": "file_type_image", "toml": "file_type_toml",
  "ts": "file_type_typescript", "tsx": "file_type_reactts",
  "txt": "file_type_text", "vue": "file_type_vue", "wav": "file_type_audio",
  "webp": "file_type_image", "xls": "file_type_excel", "xlsx": "file_type_excel",
  "xml": "file_type_xml", "yml": "file_type_yaml", "yaml": "file_type_yaml",
  "zip": "file_type_zip",
}

function iconExists(name: string): boolean {
  return name in iconModules
}

function iconContent(name: string): string | null {
  const raw = iconModules[name]
  if (!raw) return null
  return raw.replace(/<svg([^>]*)>/, (_full: string, attrs: string) =>
    `<svg${attrs.replace(/\s*width\s*=\s*"[^"]*"/i, "").replace(/\s*height\s*=\s*"[^"]*"/i, "")}>`
  )
}

function resolveIconName(fileName: string, isDir: boolean): string {
  if (isDir) {
    const key = fileName.toLowerCase()
    const mapped = folderNameToIcon[key]
    if (mapped && iconExists(mapped)) return mapped
    return DEFAULT_FOLDER_ICON
  }

  const lower = fileName.toLowerCase()

  const fileMatch = fileNameToIcon[lower]
  if (fileMatch && iconExists(fileMatch)) return fileMatch

  const firstDot = lower.indexOf(".")
  if (firstDot >= 0 && firstDot < lower.length - 2) {
    const ext2 = lower.substring(firstDot + 1)
    if (extToIcon[ext2] && iconExists(extToIcon[ext2])) return extToIcon[ext2]
    if (COMMON_EXT_MAP[ext2] && iconExists(COMMON_EXT_MAP[ext2])) return COMMON_EXT_MAP[ext2]
  }

  const dotIdx = lower.lastIndexOf(".")
  if (dotIdx >= 0) {
    const ext = lower.substring(dotIdx + 1)
    if (extToIcon[ext] && iconExists(extToIcon[ext])) return extToIcon[ext]
    if (COMMON_EXT_MAP[ext] && iconExists(COMMON_EXT_MAP[ext])) return COMMON_EXT_MAP[ext]
  }

  return DEFAULT_FILE_ICON
}

interface Props {
  fileName?: string
  isDir?: boolean
  className?: string
}

export const VscFileIcon = memo(function VscFileIcon({ fileName, isDir, className }: Props) {
  const name = resolveIconName(fileName || "", !!isDir)
  const svg = iconContent(name)

  if (!svg) {
    return <span className={className} style={{ width: 20, height: 20 }} />
  }

  return (
    <span
      data-vsc-icon
      className={className}
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
    />
  )
})

export { resolveIconName }