import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/auth.store'

import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import StartSessionView from '../views/StartSessionView.vue'
import HistoriqueView from '../views/HistoriqueView.vue'
import SessionDetailView from '../views/SessionDetailView.vue'
import AdminView from '../views/AdminView.vue'
import CoachView from '../views/CoachView.vue'
import MobileVideoView from '../views/MobileVideoView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginView },

  { path: '/dashboard', component: DashboardView, meta: { requiresAuth: true } },
  { path: '/session/start', component: StartSessionView, meta: { requiresAuth: true } },

  { path: '/sessions', component: HistoriqueView, meta: { requiresAuth: true } },

  { path: '/sessions/:sessionMongoId', name: 'session-detail',  component: SessionDetailView, props: true, meta: { requiresAuth: true } },

  { path: '/coach', component: CoachView, meta: { requiresAuth: true, requiresCoach: true } },

  { path: '/admin', component: AdminView, meta: { requiresAuth: true, requiresAdmin: true } },

  { path: '/mobile/video', component: MobileVideoView, meta: { requiresAuth: true, mobileOnly: true } },
]

const router = createRouter({ history: createWebHistory(), routes })

function isMobile() {
  return window.matchMedia?.('(max-width: 820px)').matches || /Mobi|Android/i.test(navigator.userAgent)
}

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.token) return next('/login')
  if (to.path === '/login' && auth.token) return next('/dashboard')

  if (to.meta.requiresAdmin && !auth.rights.includes('admin')) {
    return next('/dashboard')
  }

  if (to.meta.requiresCoach && !auth.rights.includes('coach')) {
    return next('/dashboard')
  }

  if (to.meta.mobileOnly && !isMobile()) return next('/dashboard')

  next()
})


export default router
