import { type ReactNode } from "react"

interface Props {
  toolbar: ReactNode
  content: ReactNode
}

export function MainPanel({ toolbar, content }: Props) {
  return (
    <div className="flex flex-col flex-1 min-w-0 h-full">
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-background sticky top-0 z-10 flex-wrap">
        {toolbar}
      </div>
      <div className="flex-1 overflow-auto">
        {content}
      </div>
    </div>
  )
}