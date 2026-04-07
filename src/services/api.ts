import axios from 'axios'
import { readAuthToken } from '../utils/authStorage'

const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:4000/api'

export const api = axios.create({
  baseURL: baseUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = readAuthToken()

  if (token) {
    const headers = config.headers as Record<string, string> | undefined
    config.headers = {
      ...(headers ?? {}),
      Authorization: `Bearer ${token}`,
    } as typeof config.headers
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const responseError = error as { response?: { data?: { message?: string }; status?: number }; message?: string }
    const normalizedError = new Error(
      responseError.response?.data?.message || responseError.message || 'Request failed',
    ) as Error & { status?: number }

    normalizedError.status = responseError.response?.status
    return Promise.reject(normalizedError)
  },
)
