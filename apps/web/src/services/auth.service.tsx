import { publicClient } from './base'
import type { AuthResponse, LoginData, RegisterData } from '../../../../packages/types/AuthTypes'

export const authService = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await publicClient.post<AuthResponse>('/auth/register', data)
    return response.data
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await publicClient.post<AuthResponse>('/auth/login', data)
    return response.data
  },
}