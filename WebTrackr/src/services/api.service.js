import axios from 'axios'
import { useAuthStore } from '../store/auth.store'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers['x-session-id'] = auth.token
  }
  return config
})

export default api
