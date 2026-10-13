import { useEffect, useCallback } from "react"
import { useAppState } from "@/context/AppContext"
import { fetchIndexData } from "@/api/dufs"
import type { TreeNode } from "@/types/dufs"

export function useFileTree() {
  const { state, dispatch } = useAppState()

  useEffect(() => {
    if (state.currentData) {
      const nodes: TreeNode[] = state.currentData.paths
        .filter(p => p.path_type.endsWith("Dir"))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(p => ({
          name: p.name,
          path: state.currentPath.replace(/\/$/, "") + "/" + encodeURIComponent(p.name),
          isDir: true,
          children: null,
          loaded: false,
        }))
      dispatch({ type: "SET_TREE", path: state.currentPath || "/", nodes })
    }
  }, [state.currentPath, state.currentData, dispatch])

  useEffect(() => {
    const loadingPaths = Array.from(state.treeLoading)
    if (loadingPaths.length === 0) return
    const path = loadingPaths[0]
    fetchIndexData(path)
      .then(data => {
        const nodes: TreeNode[] = data.paths
          .filter(p => p.path_type.endsWith("Dir"))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(p => ({
            name: p.name,
            path: path.replace(/\/$/, "") + "/" + encodeURIComponent(p.name),
            isDir: true,
            children: null,
            loaded: false,
          }))
        dispatch({ type: "SET_TREE", path, nodes })
      })
      .catch(() => {
        dispatch({ type: "SET_TREE", path, nodes: [] })
      })
  }, [state.treeLoading, dispatch])

  const handleToggle = useCallback((path: string, loaded: boolean) => {
    const findNode = (nodes: TreeNode[]): TreeNode | null => {
      for (const n of nodes) {
        if (n.path === path) return n
        if (n.children) {
          const f = findNode(n.children)
          if (f) return f
        }
      }
      return null
    }
    const node = findNode(state.tree)
    if (!node) return
    if (node.children !== null) {
      dispatch({ type: "COLLAPSE_TREE", path })
    } else if (!loaded) {
      dispatch({ type: "EXPAND_TREE", path })
    }
  }, [state.tree, dispatch])

  const handleSelect = useCallback((path: string) => {
    dispatch({ type: "SELECT", path })
  }, [dispatch])

  return { tree: state.tree, treeLoading: state.treeLoading, handleToggle, handleSelect }
}