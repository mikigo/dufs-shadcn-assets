import { type ReactNode } from "react"
import { useAppState } from "@/context/AppContext"

interface Props {
  toolbar: ReactNode
  content: ReactNode
}

export function MainPanel({ toolbar, content }: Props) {
  const { state } = useAppState()
  return (
    <div className="flex flex-col flex-1 min-w-0 h-full">
      <div className="flex items-center gap-3 px-5 py-2.5 bg-background sticky top-0 z-10 flex-wrap relative"
        style={{ boxShadow: '0 1px 0 0 rgba(0,0,0,0.06)' }}>
        {toolbar}
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        {content}
        {state.footerText && (
          <div
            className="px-4 py-2 text-xs text-center border-t border-border"
            style={{ color: "var(--color-muted-foreground, rgba(120,120,120,0.5))" }}
            dangerouslySetInnerHTML={{ __html: state.footerText }}
          />
        )}
      </div>
    </div>
  )
}