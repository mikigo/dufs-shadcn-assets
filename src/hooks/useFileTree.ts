import { useEffect, useCallback, useRef } from "react"
import { useAppState } from "@/context/AppContext"
import { fetchIndexData, pushHistory } from "@/api/dufs"
import type { TreeNode } from "@/types/dufs"

export function useFileTree() {
  const { state, dispatch } = useAppState()
  const treeNavRef = useRef(false)

  // 仅在页面初始加载或面板导航（双击表格/面包屑）时重建树
  // 从文件树点击目录导航时，跳过树重建（只更新右侧面板）
  useEffect(() => {
    if (treeNavRef.current) {
      treeNavRef.current = false
      return
    }
    if (state.currentData?.paths) {
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
    // 目录请求必须带尾部斜杠
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

  // Click a tree node → dir toggles expand, file selects for preview
  const handleSelect = useCallback(async (path: string) => {
    // File node: select it for preview, update URL for back/forward
    pushHistory(path + "?view")

    // 先同步更新 currentPath 为父目录，使面包屑正确显示
    const parentDir = path.substring(0, path.lastIndexOf("/") + 1) || "/"
    try {
      const data = await fetchIndexData(parentDir)
      treeNavRef.current = true  // 防止触发树重建
      dispatch({ type: "SET_CURRENT", path: parentDir, data })
    } catch {
      // 静默失败 — 面包屑可能不更新，FilePreview 仍正常
    }

    // 后 SELECT，确保 selectedPath 不被 SET_CURRENT 覆盖
    dispatch({ type: "SELECT", path })
  }, [dispatch])

  // Click a directory node → navigate right panel to this directory
  const handleNavigate = useCallback(async (path: string) => {
    try {
      const dirPath = path.endsWith("/") ? path : path + "/"
      const data = await fetchIndexData(dirPath)
      treeNavRef.current = true
      pushHistory(dirPath)
      dispatch({ type: "SET_CURRENT", path: dirPath, data })
    } catch (err) {
      console.error("Tree navigation failed:", err)
    }
  }, [dispatch])

  return { tree: state.tree, treeLoading: state.treeLoading, handleToggle, handleSelect, handleNavigate }
}