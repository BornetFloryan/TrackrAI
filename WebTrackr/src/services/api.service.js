import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

let refreshPromise = null

function clearAuthStorage() {
  localStorage.removeItem('trackr_token')
  localStorage.removeItem('trackr_rights')
  localStorage.removeItem('trackr_login')
  localStorage.removeItem('trackr_user_id')
  localStorage.removeItem('trackr_coach')
  localStorage.removeItem('trackr_expires_at')
  localStorage.removeItem('trackr_refresh_token')
  localStorage.removeItem('trackr_refresh_expires_at')
}

function persistAuthPayload(data) {
  if (!data?.token || !data?.refreshToken) return

  localStorage.setItem('trackr_token', data.token)
  localStorage.setItem('trackr_rights', JSON.stringify(data.rights || []))
  localStorage.setItem('trackr_login', data.login || '')
  if (data.userId) localStorage.setItem('trackr_user_id', data.userId)
  localStorage.setItem('trackr_coach', JSON.stringify(data.coach || null))
  if (data.expiresAt) localStorage.setItem('trackr_expires_at', data.expiresAt)
  localStorage.setItem('trackr_refresh_token', data.refreshToken)
  if (data.refreshExpiresAt) localStorage.setItem('trackr_refresh_expires_at', data.refreshExpiresAt)
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('trackr_refresh_token')
  if (!refreshToken) throw new Error('NO_REFRESH_TOKEN')

  if (!refreshPromise) {
    refreshPromise = axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, { refreshToken })
      .then((res) => {
        if (!res.data || res.data.error !== 0 || !res.data.data?.token) {
          throw new Error(res.data?.data || 'REFRESH_FAILED')
        }
        persistAuthPayload(res.data.data)
        return res.data.data.token
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('trackr_token')

  if (token) {
    config.headers['x-session-id'] = token
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const url = original?.url || ''

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !url.includes('/auth/signin') &&
      !url.includes('/auth/refresh') &&
      !url.includes('/auth/logout')
    ) {
      original._retry = true
      try {
        const token = await refreshAccessToken()
        original.headers = original.headers || {}
        original.headers['x-session-id'] = token
        return api(original)
      } catch (_) {
        clearAuthStorage()
        if (location.pathname !== '/login') {
          location.assign('/login')
        }
      }
    } else if (error.response?.status === 401) {
      clearAuthStorage()
      if (location.pathname !== '/login') {
        location.assign('/login')
      }
    }
    return Promise.reject(error)
  }
)

export default api
