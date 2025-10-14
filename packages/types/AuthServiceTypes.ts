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
  user: {
    id: string
    email: string
    username: string
  }
}