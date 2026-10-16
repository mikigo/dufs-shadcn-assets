import { useEffect, useCallback, useRef } from "react"
import { useAppState } from "@/context/AppContext"
import { fetchIndexData, pushHistory } from "@/api/dufs"
import type { TreeNode } from "@/types/dufs"

function findNode(nodes: TreeNode[], path: string): TreeNode | null {
  for (const n of nodes) {
    if (n.path === path) return n
    if (n.children) {
      const f = findNode(n.children, path)
      if (f) return f
    }
  }
  return null
}

export function useFileTree() {
  const { state, dispatch } = useAppState()
  const prevPathRef = useRef(state.currentPath)
  const treeNavRef = useRef(false)

  // 仅在树为空时重建（初始加载或整页刷新如搜索）。
  // SPA 导航（树点击/popstate/表格双击）不重建，只更新右侧面板。
  useEffect(() => {
    if (state.tree.length > 0) return
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
  }, [state.currentPath, state.currentData, state.tree.length, dispatch])

  // 当 currentPath 变化时（从主内容区导航），在文件树中展开并选中对应目录
  useEffect(() => {
    if (!state.currentPath || state.currentPath === "/") return
    if (state.tree.length === 0) return

    const isExternalNav = !treeNavRef.current
    treeNavRef.current = false

    const normalized = state.currentPath.replace(/\/$/, "")
    if (!normalized) return

    const segments = normalized.split("/").filter(Boolean)
    let partialPath = ""

    for (const seg of segments) {
      partialPath += "/" + seg
      const node = findNode(state.tree, partialPath)
      if (!node) return
      if (node.isDir && node.children === null && !node.loaded) {
        dispatch({ type: "EXPAND_TREE", path: partialPath })
        return
      }
    }

    if (isExternalNav && state.currentPath !== prevPathRef.current) {
      dispatch({ type: "SELECT", path: normalized + "/" })
    }
  }, [state.currentPath, state.tree, dispatch])

  // 跟踪 currentPath，避免树展开后选中时误判为路径变化
  useEffect(() => {
    prevPathRef.current = state.currentPath
  }, [state.currentPath])

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
    const node = findNode(state.tree, path)
    if (!node) return
    if (node.children !== null) {
      dispatch({ type: "COLLAPSE_TREE", path })
    } else if (!loaded) {
      dispatch({ type: "EXPAND_TREE", path })
    }
  }, [state.tree, dispatch])

  const handleSelect = useCallback(async (path: string) => {
    treeNavRef.current = true
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
    treeNavRef.current = true
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