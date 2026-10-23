import { useEffect, useCallback, useRef } from "react"
import { useAppState, findNode } from "@/context/AppContext"
import { fetchIndexData, pushHistory } from "@/api/dufs"
import { pathsToEntries } from "@/lib/utils"
import type { TreeStateNode } from "@/types/dufs"

export function useFileTree() {
  const { state, dispatch } = useAppState()
  const treeNavRef = useRef(false)
  const collapsedPathsRef = useRef<Set<string>>(new Set())
  const treeRef = useRef(state.tree)

  // 在 effect 中同步最新 tree，供下方 effect 读取而不作为依赖
  // 避免 TREE_COLLAPSE 等仅改变 stale 的 tree 变化误触发自动展开
  useEffect(() => {
    treeRef.current = state.tree
  }, [state.tree])

  useEffect(() => {
    if (state.tree.length > 0) return
    if (state.currentData?.paths) {
      const entries = pathsToEntries(state.currentData.paths, state.currentPath)
      const treePath = state.currentPath.replace(/\/$/, "") || "/"
      dispatch({ type: "TREE_SET_CHILDREN", parentPath: treePath, entries })
    }
  }, [state.currentPath, state.currentData, state.tree.length, dispatch])

  useEffect(() => {
    if (!state.currentPath || state.currentPath === "/") return
    if (treeRef.current.length === 0) return

    const isExternalNav = !treeNavRef.current
    treeNavRef.current = false

    const normalized = state.currentPath.replace(/\/$/, "")
    if (!normalized) return

    const segments = normalized.split("/").filter(Boolean)
    let partialPath = ""

    for (const seg of segments) {
      partialPath += "/" + seg
      const node = findNode(treeRef.current, partialPath)
      if (!node) return
      if (node.element.isDir && (node.children === null || node.stale)) {
        // 用户手动收起的目录不自动展开；正在加载中的目录不重复展开
        if (!collapsedPathsRef.current.has(partialPath) && state.loadingPath !== partialPath) {
          dispatch({ type: "TREE_EXPAND", path: partialPath })
        }
        return
      }
    }

    if (isExternalNav) {
      dispatch({ type: "TREE_SELECT", path: normalized + "/" })
    }
  }, [state.currentPath, state.tree.length, state.loadingPath, dispatch])

  // 当前路径变化时，清空手动收起记录的缓存
  useEffect(() => {
    if (state.currentPath) {
      collapsedPathsRef.current.clear()
    }
  }, [state.currentPath])

  useEffect(() => {
    if (!state.loadingPath) return
    const path = state.loadingPath
    const dirPath = path.endsWith("/") ? path : path + "/"
    fetchIndexData(dirPath)
      .then(data => {
        if (!data.paths) return
        dispatch({ type: "TREE_SET_CHILDREN", parentPath: path, entries: pathsToEntries(data.paths, path) })
      })
      .catch(() => {
        dispatch({ type: "TREE_SET_CHILDREN", parentPath: path, entries: [] })
      })
  }, [state.loadingPath, dispatch])

  const handleToggle = useCallback((path: string) => {
    const node = findNode(state.tree, path)
    if (!node || !node.element.isDir) return
    if (node.children !== null && !node.stale) {
      // 用户手动收起目录，记录路径以防止自动展开
      collapsedPathsRef.current.add(path)
      dispatch({ type: "TREE_COLLAPSE", path })
    } else {
      // 用户手动展开目录，从记录中移除
      collapsedPathsRef.current.delete(path)
      dispatch({ type: "TREE_EXPAND", path })
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
    dispatch({ type: "TREE_SELECT", path })
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

  const handleCollapseAll = useCallback(() => {
    // 收集所有目录路径加入手动收起记录，防止 auto-expand effect 立即重新展开
    const collect = (nodes: TreeStateNode[]): void => {
      for (const n of nodes) {
        if (n.element.isDir) collapsedPathsRef.current.add(n.element.path)
        if (n.children) collect(n.children)
      }
    }
    collect(state.tree)
    dispatch({ type: "TREE_COLLAPSE_ALL" })
  }, [state.tree, dispatch])

  return { tree: state.tree, loadingPath: state.loadingPath, selectedPath: state.selectedPath, handleToggle, handleSelect, handleNavigate, handleCollapseAll }
}