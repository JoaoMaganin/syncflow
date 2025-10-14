import { createContext, useContext, useState, type ReactNode } from "react"
import { authService } from "@/services/auth.service"
import type { AuthContextType } from '../../../../packages/types/AuthTypes'


const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"))

  // Função para logar
  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password })
    console.log('Logado com sucesso!: ', response);
    localStorage.setItem("token", response.accessToken)
    setToken(response.accessToken)
  }

  // Função para deslogar
  const logout = () => {
    localStorage.removeItem("token")
    setToken(null)
    console.log('deslogado!!')
  }

  return (
    <AuthContext.Provider value={{ token, isLoggedIn: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook para usar em qualquer componente
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth deve ser usado dentro do AuthProvider")
  return context
}
