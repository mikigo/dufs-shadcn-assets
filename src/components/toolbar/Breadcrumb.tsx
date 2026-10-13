import { useAppState } from "@/context/AppContext"
import {
  Breadcrumb as ShadBreadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Home } from "lucide-react"
import { fetchIndexData, pushHistory } from "@/api/dufs"

export function Breadcrumb() {
  const { state, dispatch } = useAppState()

  // Split path, filter empty segments. Always prepend root "" so Home button appears at all depths.
  const segments = state.currentPath.split("/").filter(p => p !== "")
  const parts = state.currentPath === "/" ? [""] : ["", ...segments]
  const prefix = (state.currentData?.uri_prefix ?? "").replace(/\/+$/, "")

  const handleClick = async (path: string) => {
    try {
      const data = await fetchIndexData(path)
      pushHistory(path)
      dispatch({ type: "SET_CURRENT", path, data })
    } catch (err) {
      console.error("Breadcrumb navigation failed:", err)
    }
  }

  let accumulatedPath = prefix

  return (
    <ShadBreadcrumb>
      <BreadcrumbList>
        {parts.map((name, i) => {
          if (i > 0) accumulatedPath += "/" + encodeURIComponent(name)
          const isLast = i === parts.length - 1
          const targetPath = i === 0 ? (prefix || "/") : accumulatedPath
          return (
            <div key={i} className="flex items-center gap-1">
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{i === 0 ? <Home data-icon /> : name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href={targetPath}
                    onClick={(e) => {
                      e.preventDefault()
                      handleClick(targetPath)
                    }}
                  >
                    {i === 0 ? <Home data-icon /> : name}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          )
        })}
      </BreadcrumbList>
    </ShadBreadcrumb>
  )
}