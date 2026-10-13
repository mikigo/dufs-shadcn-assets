import { ChevronRight, Folder, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TreeNode as TreeNodeType } from "@/types/dufs"

interface Props {
  node: TreeNodeType
  depth: number
  loading: boolean
  onToggle: (path: string, loaded: boolean) => void
  onSelect: (path: string) => void
}

export function TreeNodeComponent({ node, depth, loading, onToggle, onSelect }: Props) {
  const expanded = node.children !== null
  const hasChildren = node.isDir

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 w-full py-1 text-[13px] hover:bg-muted rounded-md text-left",
          "transition-colors duration-100 leading-tight cursor-pointer"
        )}
        style={{ paddingLeft: depth * 16 + 8, paddingRight: 8 }}
      >
        {/* Chevron: toggle expand/collapse only */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) onToggle(node.path, node.loaded)
          }}
          className={cn(
            "shrink-0 p-0.5 rounded-sm hover:bg-accent transition-colors",
            !hasChildren && "invisible"
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
        {/* Folder icon + name: navigate to directory */}
        <button
          onClick={() => onSelect(node.path)}
          className="flex items-center gap-1.5 min-w-0 flex-1"
        >
          {expanded && hasChildren ? (
            <FolderOpen className="shrink-0 text-primary" />
          ) : (
            <Folder className="shrink-0 text-muted-foreground" />
          )}
          <span className="truncate">{node.name}</span>
          {loading && (
            <span className="ml-auto size-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin shrink-0" />
          )}
        </button>
      </div>
      {expanded && node.children && (
        <div>
          {node.children.map(child => (
            <TreeNodeComponent
              key={child.path}
              node={child}
              depth={depth + 1}
              loading={false}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}