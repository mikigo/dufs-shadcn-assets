import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useState, type FormEvent } from "react"

export function SearchBar() {
  const params = Object.fromEntries(new URLSearchParams(window.location.search).entries())
  const [q, setQ] = useState(params.q ?? "")

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const url = new URL(window.location.href)
    if (q) {
      url.searchParams.set("q", q)
    } else {
      url.searchParams.delete("q")
    }
    window.location.href = url.toString()
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
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