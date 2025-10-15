export interface RegisterData {
  email: string
  username: string
  password: string
}

export interface LoginData {
  email: string
  password: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresIn?: number
  user: {
    id: string
    email: string
    username: string
  }
}

export interface AuthContextType {
  token: string | null
  isLoggedIn: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<string>
  username?: string | null
}