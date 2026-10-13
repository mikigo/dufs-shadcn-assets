import { type ReactNode } from "react"

interface Props {
  toolbar: ReactNode
  content: ReactNode
}

export function MainPanel({ toolbar, content }: Props) {
  return (
    <div className="flex flex-col flex-1 min-w-0 h-full">
      <div className="flex items-center gap-3 px-5 py-2.5 bg-background sticky top-0 z-10 flex-wrap"
        style={{ boxShadow: '0 1px 0 0 rgba(0,0,0,0.06)' }}>
        {toolbar}
      </div>
      <div className="flex-1 overflow-auto">
        {content}
      </div>
    </div>
  )
}