// src/context/AppContext.tsx
import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react"
import type { AppState, AppAction } from "@/types/dufs"

const initialState: AppState = {
  tree: [],
  treeLoading: new Set(),
  currentPath: "",
  currentData: null,
  selectedPath: null,
  sidebarOpen: true,
  auth: {
    required: false,
    user: null,
    loading: false,
  },
  uploads: [],
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_TREE": {
      const { path, nodes } = action
      // Initial load or navigation: replace entire tree with current directory nodes
      if (state.currentPath === path || state.tree.length === 0) {
        return { ...state, tree: nodes }
      }
      // Lazy load: update children of an existing expanded node
      const updateChildren = (items: typeof state.tree): typeof state.tree =>
        items.map(item => {
          if (item.path === path) return { ...item, children: nodes, loaded: true }
          if (item.children) return { ...item, children: updateChildren(item.children) }
          return item
        })
      return { ...state, tree: updateChildren(state.tree) }
    }
    case "EXPAND_TREE": {
      const loading = new Set(state.treeLoading)
      const node = findNode(state.tree, action.path)
      if (node && !node.loaded) loading.add(action.path)
      return { ...state, treeLoading: loading }
    }
    case "COLLAPSE_TREE": {
      const collapse = (items: typeof state.tree): typeof state.tree =>
        items.map(item => {
          if (item.path === action.path) return { ...item, children: null }
          if (item.children) return { ...item, children: collapse(item.children) }
          return item
        })
      return { ...state, tree: collapse(state.tree) }
    }
    case "SET_CURRENT":
      return { ...state, currentPath: action.path, currentData: action.data, selectedPath: null }
    case "SELECT":
      return { ...state, selectedPath: action.path }
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
    default:
      return state
  }
}

function findNode(nodes: AppState["tree"], path: string): AppState["tree"][number] | null {
  for (const node of nodes) {
    if (node.path === path) return node
    if (node.children) {
      const found = findNode(node.children, path)
      if (found) return found
    }
  }
  return null
}

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