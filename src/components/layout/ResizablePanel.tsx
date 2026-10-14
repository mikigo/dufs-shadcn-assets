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

  widthRef.current = width

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      setWidth(Math.max(minWidth, Math.min(maxWidth, startWidth.current + (e.clientX - startX.current))))
    }
    const onUp = () => {
      if (!isResizing.current) return
      isResizing.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    document.addEventListener("mousemove", onMove, { capture: true })
    document.addEventListener("mouseup", onUp, { capture: true })
    return () => {
      document.removeEventListener("mousemove", onMove, { capture: true })
      document.removeEventListener("mouseup", onUp, { capture: true })
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
        className="overflow-hidden flex-shrink-0"
        style={{
          width: collapsed ? 0 : width,
          transition: isResizing.current ? "none" : "width 0.2s ease-in-out",
        }}
      >
        <div style={{ minWidth }}>{children}</div>
      </div>
      {!collapsed && (
        <div
          className="w-2 -mx-[3px] cursor-col-resize flex-shrink-0 flex justify-center"
          onMouseDown={handleMouseDown}
        >
          <div className="w-px h-full bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors" />
        </div>
      )}
    </>
  )
}