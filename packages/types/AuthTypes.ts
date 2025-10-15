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

export interface User {
  userId: string;
  username: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}