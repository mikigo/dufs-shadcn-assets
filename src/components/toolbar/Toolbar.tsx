import { Breadcrumb } from "./Breadcrumb"
import { SearchBar } from "./SearchBar"
import { ThemeToggle } from "./ThemeToggle"
import { AuthButton } from "./AuthButton"
import { ActionButtons } from "./ActionButtons"

export function Toolbar() {
  return (
    <div className="flex items-center w-full gap-3">
      <Breadcrumb />
      <div className="absolute left-1/2 -translate-x-1/2">
        <SearchBar />
      </div>
      <div className="flex items-center gap-1 ml-auto">
        <ActionButtons />
        <ThemeToggle />
        <AuthButton />
      </div>
    </div>
  )
}