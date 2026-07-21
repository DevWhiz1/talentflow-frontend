import axios from 'axios'
import { readAuthToken } from '../utils/authStorage'

const baseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || 'https://ai-recruitment-system-backend-b03gmyqti.vercel.app/'
export const apiBaseUrl = baseUrl

export const api = axios.create({
  baseURL: baseUrl,
  timeout: 60000,
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
    const responseError = error as {
      response?: {
        data?: {
          message?: string
          detail?: string | Array<{ msg?: string }>
        }
        status?: number
      }
      message?: string
    }

    const detail = responseError.response?.data?.detail
    const detailMessage = Array.isArray(detail)
      ? detail
          .map((entry) => entry?.msg)
          .filter(Boolean)
          .join(', ')
      : detail

    const normalizedError = new Error(
      responseError.response?.data?.message || detailMessage || responseError.message || 'Request failed',
    ) as Error & { status?: number }

    normalizedError.status = responseError.response?.status
    return Promise.reject(normalizedError)
  },
)
