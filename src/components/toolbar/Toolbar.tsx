import { Breadcrumb } from "./Breadcrumb"
import { SearchBar } from "./SearchBar"
import { ThemeToggle } from "./ThemeToggle"
import { AuthButton } from "./AuthButton"
import { ActionButtons } from "./ActionButtons"

export function Toolbar() {
  return (
    <>
      <Breadcrumb />
      <SearchBar />
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <AuthButton />
      </div>
      <ActionButtons />
    </>
  )
}