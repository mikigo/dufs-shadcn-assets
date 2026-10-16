import { useEffect, useCallback, useRef } from "react"
import { useAppState, findNode } from "@/context/AppContext"
import { fetchIndexData, pushHistory } from "@/api/dufs"
import type { FileEntry } from "@/types/dufs"

function pathToFileEntry(p: { name: string; path_type: string }, parentPath: string): FileEntry {
  return {
    name: p.name,
    path: parentPath.replace(/\/$/, "") + "/" + encodeURIComponent(p.name),
    isDir: p.path_type.endsWith("Dir"),
  }
}

export function useFileTree() {
  const { state, dispatch } = useAppState()
  const treeNavRef = useRef(false)

  useEffect(() => {
    if (state.tree.length > 0) return
    if (state.currentData?.paths) {
      const entries: FileEntry[] = state.currentData.paths
        .sort((a, b) => {
          const aIsDir = a.path_type.endsWith("Dir") ? 1 : 0
          const bIsDir = b.path_type.endsWith("Dir") ? 1 : 0
          if (aIsDir !== bIsDir) return bIsDir - aIsDir
          return a.name.localeCompare(b.name)
        })
        .map(p => pathToFileEntry(p, state.currentPath))
      const treePath = state.currentPath.replace(/\/$/, "") || "/"
      dispatch({ type: "TREE_SET_CHILDREN", parentPath: treePath, entries })
    }
  }, [state.currentPath, state.currentData, state.tree.length, dispatch])

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
      if (node.element.isDir && (node.children === null || node.stale)) {
        dispatch({ type: "TREE_EXPAND", path: partialPath })
        return
      }
    }

    if (isExternalNav) {
      dispatch({ type: "TREE_SELECT", path: normalized + "/" })
    }
  }, [state.currentPath, state.tree, dispatch])

  useEffect(() => {
    if (!state.loadingPath) return
    const path = state.loadingPath
    const dirPath = path.endsWith("/") ? path : path + "/"
    fetchIndexData(dirPath)
      .then(data => {
        if (!data.paths) return
        const entries: FileEntry[] = data.paths
          .sort((a, b) => {
            const aIsDir = a.path_type.endsWith("Dir") ? 1 : 0
            const bIsDir = b.path_type.endsWith("Dir") ? 1 : 0
            if (aIsDir !== bIsDir) return bIsDir - aIsDir
            return a.name.localeCompare(b.name)
          })
          .map(p => pathToFileEntry(p, path))
        dispatch({ type: "TREE_SET_CHILDREN", parentPath: path, entries })
      })
      .catch(() => {
        dispatch({ type: "TREE_SET_CHILDREN", parentPath: path, entries: [] })
      })
  }, [state.loadingPath, dispatch])

  const handleToggle = useCallback((path: string) => {
    const node = findNode(state.tree, path)
    if (!node || !node.element.isDir) return
    if (node.children !== null && !node.stale) {
      dispatch({ type: "TREE_COLLAPSE", path })
    } else {
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

  return { tree: state.tree, loadingPath: state.loadingPath, selectedPath: state.selectedPath, handleToggle, handleSelect, handleNavigate }
}