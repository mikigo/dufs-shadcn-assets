import { useAppState } from "@/context/AppContext"
import { checkAuth, logout as doLogout } from "@/api/dufs"
import { Button } from "@/components/ui/button"
import { LogIn, LogOut } from "lucide-react"

export function AuthButton() {
  const { state, dispatch } = useAppState()

  if (!state.auth.required) return null

  const handleLogin = async () => {
    dispatch({ type: "SET_AUTH_LOADING", loading: true })
    try {
      const user = await checkAuth(state.currentPath)
      dispatch({ type: "SET_AUTH", auth: { required: true, user } })
    } catch {
      dispatch({ type: "SET_AUTH_LOADING", loading: false })
      window.location.reload()
    }
  }

  const handleLogout = () => {
    if (state.auth.user) {
      doLogout(state.currentPath, state.auth.user)
    }
  }

  if (state.auth.user) {
    return (
      <div className="flex items-center gap-1 text-sm">
        <span className="text-muted-foreground">{state.auth.user}</span>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut data-icon />
        </Button>
      </div>
    )
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleLogin}
      disabled={state.auth.loading}
    >
      <LogIn data-icon />
    </Button>
  )
}