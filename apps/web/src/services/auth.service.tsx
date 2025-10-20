import { publicClient } from './base'
import type { AuthResponse, LoginData, RegisterData } from '../../../../packages/types/AuthTypes'

let refreshTimeout: number | null = null

function scheduleTokenRefresh(accessToken: string) {
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]))
    const exp = payload.exp * 1000 // em milissegundos
    const now = Date.now()

    // Define o tempo até a expiração menos alguns segundos de margem (ex: 30s)
    const refreshDelay = exp - now

    if (refreshDelay <= 0) {
      console.warn('[DEBUG] Token já expirado ou prestes a expirar, atualizando agora.')
      authService.refresh()
      return
    }

    // Cancela qualquer timeout anterior
    if (refreshTimeout) clearTimeout(refreshTimeout)

    // Agenda o refresh automático
    refreshTimeout = window.setTimeout(async () => {
      console.log('[DEBUG] Renovando token automaticamente...')
      await authService.refresh()
    }, refreshDelay)

    console.log(`[DEBUG] Próxima renovação do token em ${(refreshDelay / 1000).toFixed(0)}s`)
  } catch (error) {
    console.error('[DEBUG] Erro ao agendar refresh:', error)
  }
}

export const authService = {
  // Registro
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await publicClient.post<AuthResponse>('/auth/register', data)
    return response.data
  },

  // Login — salva tokens e agenda refresh
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await publicClient.post<AuthResponse>('/auth/login', data)
    const { accessToken, refreshToken } = response.data

    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)

    scheduleTokenRefresh(accessToken)

    return response.data
  },

  // Refresh — renova accessToken e agenda o próximo refresh
  refresh: async (): Promise<string> => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) throw new Error('Nenhum refreshToken encontrado.')

    const response = await publicClient.post<{ accessToken: string }>('/auth/refresh', { refreshToken })
    const newAccessToken = response.data.accessToken

    localStorage.setItem('accessToken', newAccessToken)

    // Reagenda o próximo refresh
    scheduleTokenRefresh(newAccessToken)

    console.log('[DEBUG] Novo accessToken gerado via refresh.')
    return newAccessToken
  },

  // Logout
  logout: () => {
    if (refreshTimeout) {clearTimeout(refreshTimeout)}
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('auth-storage');
    console.log('[DEBUG] Usuário deslogado.');
  },
}
