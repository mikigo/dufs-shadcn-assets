import { useEffect, useCallback } from "react"
import { useAppState } from "@/context/AppContext"
import { fetchIndexData, pushHistory } from "@/api/dufs"
import type { TreeNode } from "@/types/dufs"

let pendingSkipCount = 0

/** 外部调用（如 popstate handler）：标记下一次树重建应跳过 */
export function requestSkipTreeRebuild() {
  pendingSkipCount += 1
}

export function useFileTree() {
  const { state, dispatch } = useAppState()

  // 仅在页面初始加载或面板导航（双击表格/面包屑）时重建树
  // 从文件树点击目录导航或 popstate 时跳过树重建（只更新右侧面板）
  useEffect(() => {
    if (pendingSkipCount > 0) {
      console.log("[useFileTree] skip rebuild, remaining:", pendingSkipCount - 1)
      pendingSkipCount -= 1
      return
    }
    if (state.currentData?.paths) {
      console.log("[useFileTree] rebuild tree for", state.currentPath, "with", state.currentData.paths.length, "items")
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
      pendingSkipCount += 1
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
      pendingSkipCount += 1
      pushHistory(dirPath)
      dispatch({ type: "SET_CURRENT", path: dirPath, data })
    } catch (err) {
      console.error("Tree navigation failed:", err)
    }
  }, [dispatch])

  return { tree: state.tree, treeLoading: state.treeLoading, handleToggle, handleSelect, handleNavigate }
}