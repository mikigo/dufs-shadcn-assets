import { ScrollArea } from "@/components/ui/scroll-area"
import { TreeNodeComponent } from "./TreeNode"
import { useFileTree } from "@/hooks/useFileTree"

export function FileTree() {
  const { tree, treeLoading, handleToggle, handleSelect } = useFileTree()

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Files
      </div>
      <ScrollArea className="flex-1">
        <div className="py-1">
          {tree.map(node => (
            <TreeNodeComponent
              key={node.path}
              node={node}
              depth={0}
              loading={treeLoading.has(node.path)}
              onToggle={handleToggle}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}