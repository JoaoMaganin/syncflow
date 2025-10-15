import { createContext, useContext, useState, type ReactNode } from "react"
import { authService } from "@/services/auth.service"
import type { AuthContextType } from '../../../../packages/types/AuthTypes'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("accessToken"))
  const [username, setUsername] = useState<string | null>(() => {
    const storedToken = localStorage.getItem("accessToken")
    if (storedToken) {
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]))
        return payload.username
      } catch {
        return null
      }
    }
    return null
  })

  // Login
  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password })
    setToken(response.accessToken)

    // Decodifica o username do accessToken
    const payload = JSON.parse(atob(response.accessToken.split('.')[1]))
    setUsername(payload.username)
    console.log('[DEBUG] Logado com sucesso:', payload.username)
  }

  // Logout
  const logout = () => {
    authService.logout()
    setToken(null)
    setUsername(null)
  }

  // Atualiza o accessToken (usado pelo interceptor)
  const refreshToken = async () => {
    try {
      const newAccessToken = await authService.refresh()
      setToken(newAccessToken)
      const payload = JSON.parse(atob(newAccessToken.split('.')[1]))
      setUsername(payload.username ?? null)
      console.log('[DEBUG] accessToken renovado via refresh')
      return newAccessToken
    } catch (err) {
      logout()
      throw err
    }
  }

  return (
    <AuthContext.Provider value={{ token, username, isLoggedIn: !!token, login, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth deve ser usado dentro do AuthProvider")
  return context
}
