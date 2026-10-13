import { type ReactNode } from "react"
import { HardDrive } from "lucide-react"

interface Props {
  children: ReactNode
}

export function Sidebar({ children }: Props) {
  return (
    <div className="h-full flex flex-col bg-sidebar">
      {/* Logo 区域 */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-sidebar-border shrink-0">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
          <HardDrive className="w-4 h-4" />
        </div>
        <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">
          Dufs
        </span>
      </div>
      {children}
    </div>
  )
}