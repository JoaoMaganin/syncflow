import axios, { type AxiosInstance, type AxiosError, type AxiosRequestConfig } from 'axios'
import { authService } from './auth.service'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Client para rotas públicas (login, registro)
export const publicClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Client para rotas protegidas (requisições autenticadas)
export const privateClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Adiciona o accessToken automaticamente em todas as requisições privadas
privateClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor de resposta: tenta renovar o accessToken se receber erro 401
privateClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Se for erro 401 (token expirado) e ainda não tentou o refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const newAccessToken = await authService.refresh()
        console.log('[DEBUG] accessToken renovado com sucesso:', newAccessToken)

        // Atualiza o header da requisição original e repete
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`
        }

        return privateClient(originalRequest)
      } catch (err) {
        console.log('[DEBUG] refreshToken expirado ou inválido, deslogando usuário.')
        authService.logout()
        return Promise.reject(err)
      }
    }

    return Promise.reject(error)
  }
)
