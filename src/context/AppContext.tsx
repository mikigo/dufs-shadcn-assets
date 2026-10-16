// src/context/AppContext.tsx
import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react"
import type { AppState, AppAction, TreeStateNode, FileEntry } from "@/types/dufs"

const initialState: AppState = {
  tree: [],
  loadingPath: null,
  currentPath: "",
  currentData: null,
  selectedPath: null,
  sidebarOpen: true,
  viewMode: "icons",
  footerText: null,
  auth: {
    required: false,
    user: null,
    loading: false,
  },
  uploads: [],
}

function findNode(nodes: TreeStateNode[], path: string): TreeStateNode | null {
  for (const node of nodes) {
    if (node.element.path === path) return node
    if (node.children) {
      const found = findNode(node.children, path)
      if (found) return found
    }
  }
  return null
}

function updateNode(
  nodes: TreeStateNode[],
  path: string,
  updater: (node: TreeStateNode) => TreeStateNode,
): TreeStateNode[] {
  return nodes.map(n => {
    if (n.element.path === path) return updater(n)
    if (n.children) return { ...n, children: updateNode(n.children, path, updater) }
    return n
  })
}

function markStale(nodes: TreeStateNode[], path: string): TreeStateNode[] {
  return nodes.map(n => {
    if (n.element.path === path) {
      const mark = (kids: TreeStateNode[] | null): TreeStateNode[] | null =>
        kids ? kids.map(c => ({ ...c, stale: true, children: mark(c.children) })) : kids
      return { ...n, stale: true, children: mark(n.children) }
    }
    if (n.children) return { ...n, children: markStale(n.children, path) }
    return n
  })
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "TREE_REPLACE_ROOT":
      return { ...state, tree: action.nodes }

    case "TREE_SET_CHILDREN": {
      const { parentPath, entries } = action
      const wrapped = (entries: FileEntry[], parent: TreeStateNode | null): TreeStateNode[] => {
        return entries.map(entry => {
          const existing = parent?.children?.find(c => c.element.path === entry.path)
          if (existing) {
            return {
              element: entry,
              parent,
              children: existing.children,
              stale: existing.stale,
              loaded: existing.loaded || existing.children !== null,
            }
          }
          return { element: entry, parent, children: null, stale: false, loaded: false }
        })
      }

      if (parentPath === "/" || parentPath === "") {
        const nodes = wrapped(entries, null)
        return { ...state, tree: nodes, loadingPath: null }
      }

      const newTree = updateNode(state.tree, parentPath, node => ({
        ...node,
        stale: false,
        loaded: true,
        children: wrapped(entries, node),
      }))
      return { ...state, tree: newTree, loadingPath: null }
    }

    case "TREE_EXPAND": {
      const node = findNode(state.tree, action.path)
      if (!node || !node.element.isDir) return state
      if (node.children !== null && !node.stale) return state
      return { ...state, loadingPath: action.path }
    }

    case "TREE_COLLAPSE":
      return { ...state, tree: markStale(state.tree, action.path) }

    case "TREE_SELECT":
      return { ...state, selectedPath: action.path }

    case "SET_LOADING":
      return { ...state, loadingPath: action.path }

    case "SET_CURRENT":
      return {
        ...state,
        currentPath: action.path.endsWith("/") ? action.path : action.path + "/",
        currentData: action.data,
        selectedPath: null,
      }

    case "SET_AUTH":
      return { ...state, auth: { ...state.auth, ...action.auth, loading: false } }

    case "SET_AUTH_LOADING":
      return { ...state, auth: { ...state.auth, loading: action.loading } }

    case "ADD_UPLOAD":
      return { ...state, uploads: [...state.uploads, action.item] }

    case "UPDATE_UPLOAD": {
      const uploads = state.uploads.map(u =>
        u.id === action.id ? { ...u, ...action.updates } : u
      )
      return { ...state, uploads }
    }

    case "REMOVE_UPLOAD":
      return { ...state, uploads: state.uploads.filter(u => u.id !== action.id) }

    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen }

    case "SET_VIEW_MODE":
      return { ...state, viewMode: action.mode }

    case "SET_FOOTER":
      return { ...state, footerText: action.text }

    default:
      return state
  }
}

export { findNode }

interface AppContextValue {
  state: AppState
  dispatch: Dispatch<AppAction>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useAppState must be used within AppProvider")
  return ctx
}