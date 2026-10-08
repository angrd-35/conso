import axios from 'axios'

export const apiClient = axios.create({
  baseURL: '/api',
})

export interface ApiErrorPayload {
  message: string | string[]
  error?: string
  statusCode?: number
}

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorPayload>(error)) {
    const payload = error.response?.data
    if (payload?.message) {
      return Array.isArray(payload.message) ? payload.message.join(', ') : payload.message
    }
    return error.message
  }
  return error instanceof Error ? error.message : 'Une erreur inattendue est survenue'
}
