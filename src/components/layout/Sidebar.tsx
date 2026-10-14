import { type ReactNode } from "react"
import { HardDrive } from "lucide-react"

interface DufsConfig {
  logo_text?: string
  logo_size?: string
  logo_text_font_size?: string
}

function getConfig(): DufsConfig {
  try {
    const el = document.getElementById("dufs-config")
    if (el?.textContent) return JSON.parse(el.textContent)
  } catch {}
  return {}
}

interface Props {
  children: ReactNode
}

export function Sidebar({ children }: Props) {
  const config = getConfig()
  const logoSize = config.logo_size || "28px"

  return (
    <div className="h-full flex flex-col bg-sidebar">
      {/* Logo 区域 */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-sidebar-border shrink-0">
        <div
          className="flex items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"
          style={{ width: logoSize, height: logoSize }}
        >
          <HardDrive style={{ width: `calc(${logoSize} * 0.55)`, height: `calc(${logoSize} * 0.55)` }} />
        </div>
        <span
          className="font-semibold text-sidebar-foreground tracking-tight"
          style={{ fontSize: config.logo_text_font_size || "14px" }}
        >
          {document.title || "Dufs"}
        </span>
      </div>
      {children}
    </div>
  )
}