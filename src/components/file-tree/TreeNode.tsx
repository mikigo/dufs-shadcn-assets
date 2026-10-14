import { ChevronRight, Folder, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TreeNode as TreeNodeType } from "@/types/dufs"
import { FileIcon } from "@react-symbols/icons/utils"

interface Props {
  node: TreeNodeType
  depth: number
  loading: boolean
  selected: boolean
  onToggle: (path: string, loaded: boolean) => void
  onSelect: (path: string) => void
  onNavigate: (path: string) => void
}

const iconCls = "shrink-0 size-5"

export function TreeNodeComponent({ node, depth, loading, selected, onToggle, onSelect, onNavigate }: Props) {
  const expanded = node.children !== null

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 w-full py-1 text-[13px] hover:bg-muted hover:text-foreground rounded-md text-left",
          "transition-colors duration-100 leading-tight cursor-pointer group",
          selected && "bg-muted text-foreground font-semibold"
        )}
        style={{ paddingLeft: depth * 16 + 8, paddingRight: 8 }}
      >
        {/* Chevron: toggle expand/collapse (directories only) */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (node.isDir) onToggle(node.path, node.loaded)
          }}
          className={cn(
            "shrink-0 p-0.5 rounded-sm hover:bg-accent transition-colors",
            !node.isDir && "invisible"
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

        {/* Icon + name */}
        <button
          onClick={() => {
            if (node.isDir) {
              onToggle(node.path, node.loaded)
              onNavigate(node.path)
            } else {
              onSelect(node.path)
            }
          }}
          className="flex items-center gap-1.5 min-w-0 flex-1"
        >
          {node.isDir ? (
            expanded
              ? <FolderOpen className={iconCls + " text-primary"} />
              : <Folder className={iconCls + " text-muted-foreground"} />
          ) : (
            <FileIcon fileName={node.name} className={iconCls} />
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
              selected={false}
              onToggle={onToggle}
              onSelect={onSelect}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  )
}