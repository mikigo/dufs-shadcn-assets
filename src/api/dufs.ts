// src/api/dufs.ts
import type { DufsData } from "@/types/dufs"

export function baseUrl(): string {
  return location.href.split(/[?#]/)[0]
}

function baseName(url: string): string {
  return decodeURIComponent(url.split("/").filter(v => v.length > 0).slice(-1)[0])
}

export const baseNameFromUrl = baseName

function extName(filename: string): string {
  const dotIndex = filename.lastIndexOf('.')
  if (dotIndex === -1 || dotIndex === 0 || dotIndex === filename.length - 1) return ''
  return filename.substring(dotIndex)
}

/** 智能解码二进制内容：优先 UTF-8，若出现乱码则回退 GBK */
function decodeContent(buffer: ArrayBuffer): string {
  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(buffer)
  // \uFFFD 是 Unicode 替换字符，UTF-8 解码失败时会插入它
  if (/\uFFFD/.test(utf8)) {
    try {
      return new TextDecoder("gbk", { fatal: false }).decode(buffer)
    } catch {
      // 部分浏览器不支持 GBK，回退到 UTF-8
    }
  }
  return utf8
}

function decodeBase64(b64: string): string {
  const binString = atob(b64)
  const len = binString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binString.charCodeAt(i)
  }
  return decodeContent(bytes.buffer)
}

export { decodeBase64 }

/** 更新浏览器地址栏，支持后退/前进导航 */
export function pushHistory(url: string) {
  history.pushState(null, "", url)
}

function parseIndexData(html: string): DufsData | null {
  // dufs injects data into <script id="index-data"> tag (not <template>)
  const match = html.match(/<script\s+id="index-data"[^>]*>([^<]+)<\/script>/)
  if (!match) return null
  return JSON.parse(decodeBase64(match[1]))
}

async function assertResOK(res: Response): Promise<void> {
  if (!(res.status >= 200 && res.status < 300)) {
    throw new Error(await res.text() || `Invalid status ${res.status}`)
  }
}

export async function fetchIndexData(dirPath: string): Promise<DufsData> {
  const res = await fetch(dirPath)
  await assertResOK(res)
  const html = await res.text()
  const data = parseIndexData(html)
  if (!data) throw new Error("Failed to parse index data")
  return data
}

export async function fetchFileContent(filePath: string): Promise<string> {
  const res = await fetch(filePath)
  await assertResOK(res)
  const buffer = await res.arrayBuffer()
  return decodeContent(buffer)
}

export async function deletePath(url: string): Promise<void> {
  const res = await fetch(url, { method: "DELETE" })
  await assertResOK(res)
}

export async function movePath(fromUrl: string, toUrl: string): Promise<void> {
  const res1 = await fetch(toUrl, { method: "HEAD" })
  if (res1.status === 200 && !confirm("Override existing file?")) return
  const res2 = await fetch(fromUrl, {
    method: "MOVE",
    headers: { "Destination": toUrl },
  })
  await assertResOK(res2)
}

export async function createFolder(folderUrl: string): Promise<void> {
  const res = await fetch(folderUrl, { method: "MKCOL" })
  await assertResOK(res)
}

export async function createFile(fileUrl: string): Promise<void> {
  const res = await fetch(fileUrl, { method: "PUT", body: "" })
  await assertResOK(res)
}

export async function saveFile(fileUrl: string, content: string): Promise<void> {
  const res = await fetch(fileUrl, { method: "PUT", body: content })
  await assertResOK(res)
}

export async function checkAuth(basePath: string): Promise<string> {
  const res = await fetch(basePath, { method: "CHECKAUTH" })
  await assertResOK(res)
  return res.text()
}

export function logout(basePath: string, user: string): void {
  const xhr = new XMLHttpRequest()
  xhr.open("LOGOUT", basePath, true, user)
  xhr.onload = () => { location.href = basePath }
  xhr.send()
}

export interface UploadCallbacks {
  onProgress: (id: number, uploaded: number, total: number) => void
  onComplete: (id: number) => void
  onError: (id: number, error: string) => void
}

export function uploadFile(
  id: number,
  file: File,
  uploadUrl: string,
  callbacks: UploadCallbacks,
): void {
  const xhr = new XMLHttpRequest()
  let lastTime = Date.now()

  xhr.upload.addEventListener("progress", (e) => {
    const now = Date.now()
    if (now - lastTime < 300) return
    lastTime = now
    callbacks.onProgress(id, e.loaded, e.total)
  })

  xhr.addEventListener("readystatechange", () => {
    if (xhr.readyState === 4) {
      if (xhr.status >= 200 && xhr.status < 300) {
        callbacks.onComplete(id)
      } else {
        if (xhr.status !== 0) {
          callbacks.onError(id, `${xhr.status} ${xhr.statusText}`)
        }
      }
    }
  })

  xhr.addEventListener("error", () => callbacks.onError(id, "Network error"))
  xhr.addEventListener("abort", () => callbacks.onError(id, "Aborted"))
  xhr.open("PUT", uploadUrl)
  xhr.send(file)
}

export function newUrl(base: string, name: string): string {
  let url = base
  if (!url.endsWith("/")) url += "/"
  url += name.split("/").map(encodeURIComponent).join("/")
  return url
}

export const IFRAME_FORMATS = [
  ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg",
  ".mp4", ".mov", ".avi", ".wmv", ".flv", ".webm",
  ".mp3", ".ogg", ".wav", ".m4a",
]

export function canIframePreview(filename: string): boolean {
  return IFRAME_FORMATS.includes(extName(baseName(filename)))
}