import { useCallback, useRef, useState, useEffect, type ReactNode } from "react"

interface Props {
  defaultWidth: number
  minWidth: number
  maxWidth: number
  collapsed: boolean
  children: ReactNode
}

export function ResizablePanel({ defaultWidth, minWidth, maxWidth, collapsed, children }: Props) {
  const [width, setWidth] = useState(defaultWidth)
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setDragging(true)
    startX.current = e.clientX
    startWidth.current = width
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }, [width])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return
      const delta = e.clientX - startX.current
      setWidth(Math.max(minWidth, Math.min(maxWidth, startWidth.current + delta)))
    }
    const onMouseUp = () => {
      setDragging(false)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
    return () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }
  }, [dragging, minWidth, maxWidth])

  return (
    <>
      <div
        className="overflow-hidden flex-shrink-0"
        style={{
          width: collapsed ? 0 : width,
          transition: dragging ? "none" : "width 0.2s ease-in-out",
        }}
      >
        <div style={{ width, minWidth }}>{children}</div>
      </div>
      {!collapsed && (
        <div
          className="w-2 -mx-[3px] cursor-col-resize flex-shrink-0 flex justify-center group"
          onMouseDown={onMouseDown}
        >
          <div className="w-px h-full bg-border group-hover:bg-ring/30 transition-colors" />
        </div>
      )}
    </>
  )
}