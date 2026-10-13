import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
    }
    return false
  })

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  return (
    <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} className="size-8">
      {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}