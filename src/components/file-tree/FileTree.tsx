import { TreeNodeComponent } from "./TreeNode"
import { useFileTree } from "@/hooks/useFileTree"

export function FileTree() {
  const { tree, treeLoading, handleToggle, handleSelect, handleNavigate } = useFileTree()

  // Debug: log tree state
  if (typeof window !== "undefined") {
    (window as any).__fileTreeDebug = { tree, treeLoading }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-widest select-none shrink-0">
        Explorer ({tree.length})
      </div>
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="px-2 py-1">
          {tree.map(node => (
            <TreeNodeComponent
              key={node.path}
              node={node}
              depth={0}
              loading={treeLoading.has(node.path)}
              onToggle={handleToggle}
              onSelect={handleSelect}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      </div>
    </div>
  )
}