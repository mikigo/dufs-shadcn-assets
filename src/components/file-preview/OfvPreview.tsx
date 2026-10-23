import { useEffect, useRef } from "react"
import {
  createViewer,
  imagePlugin,
  pdfPlugin,
  videoPlugin,
  audioPlugin,
  textPlugin,
  officePlugin,
  archivePlugin,
  emailPlugin,
  epubPlugin,
  ofdPlugin,
  xpsPlugin,
  drawingPlugin,
  xmindPlugin,
  model3dPlugin,
  cadPlugin,
  gisPlugin,
  assetPlugin,
} from "@open-file-viewer/core"
import type { FileViewer } from "@open-file-viewer/core"
import "@open-file-viewer/core/style.css"
import "leaflet/dist/leaflet.css"
import { baseNameFromUrl } from "@/api/dufs"
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url"
import legacyWorkerSrc from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"
const cMapUrl = "./cmaps/"
const standardFontDataUrl = "./standard_fonts/"

interface Props {
  filePath: string
}

const plugins = [
  officePlugin(),
  pdfPlugin({ workerSrc, legacyWorkerSrc, cMapUrl, standardFontDataUrl, compatibilityMode: "auto" }),
  videoPlugin(),
  audioPlugin(),
  imagePlugin(),
  model3dPlugin(),
  cadPlugin(),
  gisPlugin(),
  archivePlugin(),
  emailPlugin(),
  epubPlugin(),
  ofdPlugin(),
  xpsPlugin(),
  drawingPlugin(),
  xmindPlugin(),
  assetPlugin(),
  textPlugin(),
]

export function OfvPreview({ filePath }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<FileViewer | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const cacheBustedPath = filePath + "?_t=" + Date.now()

    const viewer = createViewer({
      container,
      file: cacheBustedPath,
      fileName: baseNameFromUrl(filePath),
      height: "100%",
      width: "100%",
      plugins,
      theme: "auto",
      toolbar: true,
    })

    viewerRef.current = viewer

    return () => {
      viewer.destroy()
      viewerRef.current = null
    }
  }, [filePath])

  return <div ref={containerRef} className="h-full w-full" />
}