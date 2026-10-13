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
      <button
        className={cn(
          "flex items-center gap-1 w-full px-2 py-1 text-sm hover:bg-accent rounded-sm text-left",
          "transition-colors"
        )}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={() => {
          if (hasChildren) {
            onToggle(node.path, node.loaded)
          }
          onSelect(node.path)
        }}
      >
        {hasChildren && (
          <ChevronRight
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform",
              expanded && "rotate-90"
            )}
          />
        )}
        {!hasChildren && <div className="w-4 shrink-0" />}
        {expanded && hasChildren ? (
          <FolderOpen className="size-4 shrink-0 text-primary" />
        ) : (
          <Folder className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate">{node.name}</span>
        {loading && (
          <span className="ml-auto size-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin shrink-0" />
        )}
      </button>
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