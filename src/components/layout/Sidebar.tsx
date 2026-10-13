import { type ReactNode } from "react"

interface Props {
  children: ReactNode
}

export function Sidebar({ children }: Props) {
  return (
    <div className="h-full flex flex-col bg-sidebar">
      {children}
    </div>
  )
}