import { type ReactNode } from "react"

interface DufsConfig {
  logo_text?: string
  logo?: string
  dark_logo?: string
  logo_size?: string
  logo_text_font_size?: string
  _logoData?: string
  _darkLogoData?: string
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
  const isDark = document.documentElement.classList.contains("dark")
  const logoData = isDark ? config._darkLogoData : config._logoData
  const logoSrc = logoData || (isDark ? config.dark_logo : config.logo)

  return (
    <div className="h-full flex flex-col bg-sidebar">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-sidebar-border shrink-0">
        {logoSrc && (
          <img src={logoSrc} alt="Logo" style={{ width: logoSize, height: logoSize }} className="rounded-md" />
        )}
        {config.logo_text && (
          <span
            className="font-semibold text-sidebar-foreground tracking-tight"
            style={{ fontSize: config.logo_text_font_size || "20px" }}
          >
            {config.logo_text}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}