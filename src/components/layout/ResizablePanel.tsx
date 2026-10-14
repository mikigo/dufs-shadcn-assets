import { useRef, useState, useEffect, useCallback, type ReactNode } from "react"

interface Props {
  defaultWidth: number
  minWidth: number
  maxWidth: number
  collapsed: boolean
  storageKey?: string
  children: ReactNode
}

function loadWidth(key: string, fallback: number): number {
  try {
    const saved = localStorage.getItem(key)
    if (saved != null) {
      const val = Number(saved)
      if (!isNaN(val) && val > 0) return val
    }
  } catch {}
  return fallback
}

export function ResizablePanel({ defaultWidth, minWidth, maxWidth, collapsed, storageKey, children }: Props) {
  const initialWidth = storageKey ? loadWidth(storageKey, defaultWidth) : defaultWidth
  const [width, setWidth] = useState(initialWidth)
  const [isDragging, setIsDragging] = useState(false)
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
      setIsDragging(false)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      // 持久化宽度
      if (storageKey) {
        try { localStorage.setItem(storageKey, String(widthRef.current)) } catch {}
      }
    }
    document.addEventListener("mousemove", onMove, { capture: true })
    document.addEventListener("mouseup", onUp, { capture: true })
    return () => {
      document.removeEventListener("mousemove", onMove, { capture: true })
      document.removeEventListener("mouseup", onUp, { capture: true })
    }
  }, [minWidth, maxWidth, storageKey])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    isResizing.current = true
    setIsDragging(true)
    startX.current = e.clientX
    startWidth.current = widthRef.current
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }

  const handleDoubleClick = useCallback(() => {
    setWidth(defaultWidth)
    if (storageKey) {
      try { localStorage.setItem(storageKey, String(defaultWidth)) } catch {}
    }
  }, [defaultWidth, storageKey])

  const isActive = isDragging

  return (
    <>
      <div
        className="overflow-x-hidden flex-shrink-0"
        style={{
          width: collapsed ? 0 : width,
          transition: isResizing.current ? "none" : "width 0.2s ease-in-out",
        }}
      >
        <div style={{ minWidth }}>{children}</div>
      </div>
      {!collapsed && (
        <div
          className="cursor-col-resize flex-shrink-0 flex items-center justify-center relative select-none group z-20"
          style={{
            width: 6,
            marginLeft: 0,
            marginRight: -5,
          }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
        >
          {/* 分割线 — 位于侧边栏与主面板交界处，也是拖拽区的左边缘 */}
          <div
            className={[
              "absolute inset-y-0 left-0 w-px transition-all duration-200",
              isActive
                ? "bg-ring shadow-[0_0_6px_0_var(--ring)]"
                : "bg-border group-hover:bg-muted-foreground/20",
            ].join(" ")}
          />

          {/* 拖拽手柄指示器 — 居中于线右侧的拖拽区内 */}
          <div
            className={[
              "absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-[3px] transition-all duration-200 z-10",
              isActive
                ? "opacity-100 scale-110"
                : "opacity-0 group-hover:opacity-100",
            ].join(" ")}
            style={{ left: 3 }}
          >
            <div
              className={[
                "w-[3px] h-[3px] rounded-full transition-all duration-200",
                isActive
                  ? "bg-ring shadow-[0_0_4px_0_var(--ring)]"
                  : "bg-muted-foreground/40 group-hover:bg-muted-foreground/50",
              ].join(" ")}
            />
            <div
              className={[
                "w-[3px] h-[3px] rounded-full transition-all duration-200",
                isActive
                  ? "bg-ring shadow-[0_0_4px_0_var(--ring)]"
                  : "bg-muted-foreground/40 group-hover:bg-muted-foreground/50",
              ].join(" ")}
            />
            <div
              className={[
                "w-[3px] h-[3px] rounded-full transition-all duration-200",
                isActive
                  ? "bg-ring shadow-[0_0_4px_0_var(--ring)]"
                  : "bg-muted-foreground/40 group-hover:bg-muted-foreground/50",
              ].join(" ")}
            />
          </div>
        </div>
      )}
    </>
  )
}