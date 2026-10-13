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
  const isResizing = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    startX.current = e.clientX
    startWidth.current = width
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }, [width])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return
      const delta = e.clientX - startX.current
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth.current + delta))
      setWidth(newWidth)
    }
    const onMouseUp = () => {
      isResizing.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseup", onMouseUp)
    return () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }
  }, [minWidth, maxWidth])

  if (collapsed) return null

  return (
    <>
      <div style={{ width, minWidth, maxWidth, flexShrink: 0 }}>
        {children}
      </div>
      <div
        className="w-px bg-border hover:bg-ring/30 cursor-col-resize flex-shrink-0 transition-colors"
        onMouseDown={onMouseDown}
      />
    </>
  )
}