import axios from 'axios'

export const apiClient = axios.create({
  baseURL: '/api',
})

// Session Authentik expirée : NPM renvoie 401 sur /api. On recharge la page
// pour relancer le flux de connexion (pas de reload sur erreur réseau : la PWA
// peut être hors ligne).
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      window.location.reload()
    }
    return Promise.reject(error)
  },
)

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
