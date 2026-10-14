import { useEffect, useCallback } from "react"
import { useAppState } from "@/context/AppContext"
import { fetchIndexData, pushHistory } from "@/api/dufs"
import type { TreeNode } from "@/types/dufs"

let initialTreeBuilt = false

export function useFileTree() {
  const { state, dispatch } = useAppState()

  // 仅首次初始化时从 __INDEX_DATA__ 构建树，之后永不重建
  // 后续所有导航（树点击、popstate、表格双击）通过懒加载更新树的子节点
  useEffect(() => {
    if (initialTreeBuilt) return
    if (state.currentData?.paths) {
      initialTreeBuilt = true
      console.log("[useFileTree] initial build tree for", state.currentPath, "with", state.currentData.paths.length, "items")
      const nodes: TreeNode[] = state.currentData.paths
        .sort((a, b) => {
          const aIsDir = a.path_type.endsWith("Dir") ? 1 : 0
          const bIsDir = b.path_type.endsWith("Dir") ? 1 : 0
          if (aIsDir !== bIsDir) return bIsDir - aIsDir
          return a.name.localeCompare(b.name)
        })
        .map(p => ({
          name: p.name,
          path: state.currentPath.replace(/\/$/, "") + "/" + encodeURIComponent(p.name),
          isDir: p.path_type.endsWith("Dir"),
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
    const dirPath = path.endsWith("/") ? path : path + "/"
    fetchIndexData(dirPath)
      .then(data => {
        if (!data.paths) return
        const nodes: TreeNode[] = data.paths
          .sort((a, b) => {
            const aIsDir = a.path_type.endsWith("Dir") ? 1 : 0
            const bIsDir = b.path_type.endsWith("Dir") ? 1 : 0
            if (aIsDir !== bIsDir) return bIsDir - aIsDir
            return a.name.localeCompare(b.name)
          })
          .map(p => ({
            name: p.name,
            path: path.replace(/\/$/, "") + "/" + encodeURIComponent(p.name),
            isDir: p.path_type.endsWith("Dir"),
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

  const handleSelect = useCallback(async (path: string) => {
    pushHistory(path + "?view")
    const parentDir = path.substring(0, path.lastIndexOf("/") + 1) || "/"
    try {
      const data = await fetchIndexData(parentDir)
      dispatch({ type: "SET_CURRENT", path: parentDir, data })
    } catch {
      // 静默失败
    }
    dispatch({ type: "SELECT", path })
  }, [dispatch])

  const handleNavigate = useCallback(async (path: string) => {
    try {
      const dirPath = path.endsWith("/") ? path : path + "/"
      const data = await fetchIndexData(dirPath)
      pushHistory(dirPath)
      dispatch({ type: "SET_CURRENT", path: dirPath, data })
    } catch (err) {
      console.error("Tree navigation failed:", err)
    }
  }, [dispatch])

  return { tree: state.tree, treeLoading: state.treeLoading, selectedPath: state.selectedPath, handleToggle, handleSelect, handleNavigate }
}