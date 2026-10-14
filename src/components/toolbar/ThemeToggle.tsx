import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

const THEME_KEY = "dufs-theme"

function getInitialTheme(): boolean {
  if (typeof window === "undefined") return false
  const stored = localStorage.getItem(THEME_KEY)
  if (stored !== null) return stored === "dark"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

export function ThemeToggle() {
  const [dark, setDark] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    localStorage.setItem(THEME_KEY, dark ? "dark" : "light")
  }, [dark])

  return (
    <Button variant="ghost" size="icon" onClick={() => setDark(!dark)}>
      {dark ? <Sun data-icon /> : <Moon data-icon />}
    </Button>
  )
}