import { ChevronRight, Folder, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TreeStateNode } from "@/types/dufs"
import { VscFileIcon } from "./VscFileIcon"

interface Props {
  node: TreeStateNode
  depth: number
  loading: boolean
  selected: boolean
  onToggle: (path: string) => void
  onSelect: (path: string) => void
  onNavigate: (path: string) => void
}

const iconCls = "shrink-0 size-5"

export function TreeNodeComponent({ node, depth, loading, selected, onToggle, onSelect, onNavigate }: Props) {
  const { element } = node
  const expanded = node.children !== null && !node.stale

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 w-full py-1 text-[13px] rounded-md text-left",
        "transition-colors duration-100 leading-tight cursor-pointer group",
        "hover:bg-gray-100 dark:hover:bg-white/10",
        selected && "bg-gray-100 dark:bg-white/10 font-semibold"
      )}
      style={{ paddingLeft: depth * 16 + 8, paddingRight: 8 }}
      onClick={() => {
        if (element.isDir) {
          onNavigate(element.path)
        } else {
          onSelect(element.path)
        }
      }}
    >
      <button
        onClick={(e) => {
          e.stopPropagation()
          if (element.isDir) onToggle(element.path)
        }}
        className={cn(
          "shrink-0 p-0.5 rounded-sm hover:bg-accent transition-colors",
          !element.isDir && "invisible"
        )}
        aria-label={expanded ? "Collapse" : "Expand"}
      >
        <ChevronRight
          className={cn(
            "shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-90"
          )}
        />
      </button>

      <div className="flex items-center gap-1.5 min-w-0 flex-1 pointer-events-none">
        {element.isDir ? (
          expanded
            ? <FolderOpen className={iconCls + " text-primary"} />
            : <Folder className={iconCls + " text-muted-foreground"} />
        ) : (
          <VscFileIcon fileName={element.name} className={iconCls} />
        )}
        <span className="truncate">{element.name}</span>
        {loading && (
          <span className="ml-auto size-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin shrink-0" />
        )}
      </div>
    </div>
  )
}