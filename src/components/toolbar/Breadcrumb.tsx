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
  const rawSegments = state.currentPath.split("/").filter(p => p !== "")
  // decodeURIComponent: currentPath is URL-encoded (e.g. %E7%AA%97 → 窗)
  const segments = rawSegments.map(s => {
    try { return decodeURIComponent(s) } catch { return s }
  })
  const parts = state.currentPath === "/" ? [""] : ["", ...segments]
  const prefix = (state.currentData?.uri_prefix ?? "").replace(/\/+$/, "")

  const handleClick = async (path: string) => {
    const dirPath = path.endsWith("/") || path === "/" ? path : path + "/"
    try {
      const data = await fetchIndexData(dirPath)
      pushHistory(dirPath)
      dispatch({ type: "SET_CURRENT", path: dirPath, data })
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
          const isHome = i === 0
          const targetPath = isHome ? (prefix || "/") : accumulatedPath
          // 主页图标始终可点击
          const showAsLink = isHome || !isLast
          return (
            <div key={i} className="flex items-center gap-1">
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {showAsLink ? (
                  <BreadcrumbLink
                    href={targetPath}
                    onClick={(e) => {
                      e.preventDefault()
                      handleClick(targetPath)
                    }}
                  >
                    {isHome ? <Home data-icon className="size-4" /> : name}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{name}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </div>
          )
        })}
      </BreadcrumbList>
    </ShadBreadcrumb>
  )
}