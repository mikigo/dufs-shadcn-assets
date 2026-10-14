import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useState, type FormEvent } from "react"
import { useAppState } from "@/context/AppContext"
import { fetchIndexData, pushHistory } from "@/api/dufs"

export function SearchBar() {
  const params = Object.fromEntries(new URLSearchParams(window.location.search).entries())
  const [q, setQ] = useState(params.q ?? "")
  const { state, dispatch } = useAppState()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const dirPath = state.currentPath || "/"
    const searchPath = q ? dirPath + "?q=" + encodeURIComponent(q) : dirPath
    try {
      const data = await fetchIndexData(searchPath)
      pushHistory(searchPath)
      dispatch({ type: "SET_CURRENT", path: dirPath, data })
    } catch {
      // search failed, do nothing
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0 size-4" data-icon />
      <Input
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search..."
        maxLength={128}
        autoComplete="off"
        className="pl-8 h-8 w-48 text-sm"
      />
    </form>
  )
}