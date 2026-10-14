import { useRef, useMemo } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { TreeNodeComponent } from "./TreeNode"
import { useFileTree } from "@/hooks/useFileTree"
import type { TreeNode } from "@/types/dufs"

interface FlatNode extends TreeNode {
  depth: number
}

function flattenTree(nodes: TreeNode[]): FlatNode[] {
  const result: FlatNode[] = []
  function walk(nodes: TreeNode[], depth: number) {
    for (const node of nodes) {
      result.push({ ...node, depth })
      if (node.children) {
        walk(node.children, depth + 1)
      }
    }
  }
  walk(nodes, 0)
  return result
}

export function FileTree() {
  const { tree, treeLoading, selectedPath, handleToggle, handleSelect, handleNavigate } = useFileTree()
  const scrollRef = useRef<HTMLDivElement>(null)

  const flatNodes = useMemo(() => flattenTree(tree), [tree])

  const virtualizer = useVirtualizer({
    count: flatNodes.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 32,
    getItemKey: (index) => flatNodes[index].path,
  })

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-widest select-none shrink-0">
        Explorer
      </div>
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="px-2 pt-1 pb-3 relative" style={{ height: virtualizer.getTotalSize() + 16 }}>
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const node = flatNodes[virtualItem.index]
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                className="absolute top-0 left-0 w-full"
                style={{ transform: `translateY(${virtualItem.start}px)` }}
              >
                <TreeNodeComponent
                  node={node}
                  depth={node.depth}
                  loading={treeLoading.has(node.path)}
                  selected={selectedPath?.replace(/\/$/, "") === node.path}
                  onToggle={handleToggle}
                  onSelect={handleSelect}
                  onNavigate={handleNavigate}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}