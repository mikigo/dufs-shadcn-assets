import { useRef, useState, useEffect, type ReactNode } from "react"

interface Props {
  defaultWidth: number
  minWidth: number
  maxWidth: number
  collapsed: boolean
  children: ReactNode
}

export function ResizablePanel({ defaultWidth, minWidth, maxWidth, collapsed, children }: Props) {
  const [width, setWidth] = useState(defaultWidth)
  const widthRef = useRef(width)
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)
  const panelRef = useRef<HTMLDivElement>(null)

  widthRef.current = width

  // Register document-level mousemove/mouseup once, check isResizing ref internally
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      const delta = e.clientX - startX.current
      setWidth(Math.max(minWidth, Math.min(maxWidth, startWidth.current + delta)))
    }
    const onUp = () => {
      isResizing.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
    return () => {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
    }
  }, [minWidth, maxWidth])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    startX.current = e.clientX
    startWidth.current = widthRef.current
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }

  return (
    <>
      <div
        ref={panelRef}
        className="overflow-hidden flex-shrink-0"
        style={{
          width: collapsed ? 0 : width,
          transition: isResizing.current ? "none" : "width 0.2s ease-in-out",
        }}
      >
        <div style={{ width, minWidth }}>{children}</div>
      </div>
      {!collapsed && (
        <div
          className="w-2 -mx-[3px] cursor-col-resize flex-shrink-0 flex justify-center group"
          onMouseDown={handleMouseDown}
        >
          <div className="w-px h-full bg-border group-hover:bg-ring/50 transition-colors" />
        </div>
      )}
    </>
  )
}