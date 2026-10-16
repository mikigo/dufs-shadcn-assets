import { type ReactNode, useState, useEffect } from "react"

interface DufsConfig {
  logo_text?: string
  logo?: string
  dark_logo?: string
  logo_size?: string
  logo_text_font_size?: string
}

const CONFIG_PATH = "/.dufs_shadcn_assets_config"

function getBuildConfig(): DufsConfig {
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
  const [config, setConfig] = useState<DufsConfig>(getBuildConfig)
  const isDark = document.documentElement.classList.contains("dark")

  useEffect(() => {
    fetch(CONFIG_PATH + "/config.json", { cache: "no-store" })
      .then(r => { if (r.ok) return r.json() })
      .then(runtimeCfg => {
        if (runtimeCfg) setConfig(prev => ({ ...prev, ...runtimeCfg }))
      })
      .catch(() => {})
  }, [])

  const logoSize = config.logo_size || "28px"
  const logoSrc = isDark ? (config.dark_logo ?? config.logo) : config.logo
  const fullLogoSrc = logoSrc?.startsWith(".") ? CONFIG_PATH + logoSrc.slice(1) : logoSrc

  return (
    <div className="h-full flex flex-col bg-sidebar">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-sidebar-border shrink-0">
        {fullLogoSrc && (
          <img src={fullLogoSrc} alt="Logo" style={{ width: logoSize, height: logoSize }} className="rounded-md" />
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