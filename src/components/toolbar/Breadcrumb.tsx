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
import { encodedStr } from "@/lib/utils"

export function Breadcrumb() {
  const { state, dispatch } = useAppState()

  const parts = state.currentPath === "/" ? [""] : state.currentPath.split("/")
  const prefix = state.currentData?.uri_prefix ?? ""

  const handleClick = async (path: string) => {
    const { fetchIndexData } = await import("@/api/dufs")
    const data = await fetchIndexData(path)
    dispatch({ type: "SET_CURRENT", path, data })
  }

  let accumulatedPath = prefix

  return (
    <ShadBreadcrumb>
      <BreadcrumbList>
        {parts.map((name, i) => {
          if (i > 0) accumulatedPath += "/" + encodeURIComponent(name)
          const isLast = i === parts.length - 1
          return (
            <div key={i} className="flex items-center gap-1">
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{encodedStr(name || "/")}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    href={accumulatedPath || "/"}
                    onClick={(e) => {
                      e.preventDefault()
                      handleClick(accumulatedPath || "/")
                    }}
                  >
                    {i === 0 ? <Home className="size-4" /> : encodedStr(name)}
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