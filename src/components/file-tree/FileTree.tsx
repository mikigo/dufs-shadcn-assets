import { ScrollArea } from "@/components/ui/scroll-area"
import { TreeNodeComponent } from "./TreeNode"
import { useFileTree } from "@/hooks/useFileTree"

export function FileTree() {
  const { tree, treeLoading, handleToggle, handleSelect } = useFileTree()

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-widest select-none">
        Explorer
      </div>
      <ScrollArea className="flex-1">
        <div className="px-2 py-1">
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