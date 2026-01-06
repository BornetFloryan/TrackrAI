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
import CoachAthletesView from '../views/CoachAthletesView.vue'
import CoachAthleteDashboardView from '../views/CoachAthleteDashboardView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginView },

  // BASIC
  {
    path: '/dashboard',
    component: DashboardView,
    meta: { requiresAuth: true, requiresBasic: true }
  },
  {
    path: '/session/start',
    component: StartSessionView,
    meta: { requiresAuth: true, requiresBasic: true }
  },
  {
    path: '/sessions',
    component: HistoriqueView,
    meta: { requiresAuth: true, requiresBasic: true }
  },

  {
    path: '/sessions/:sessionMongoId',
    name: 'session-detail',
    component: SessionDetailView,
    props: true,
    meta: { requiresAuth: true }
  },

  // COACH
  {
    path: '/coach',
    component: CoachView,
    meta: { requiresAuth: true, requiresCoach: true }
  },
  {
    path: '/coach/athletes',
    component: CoachAthletesView,
    meta: { requiresAuth: true, requiresCoach: true }
  },
  {
    path: '/coach/athletes/:userId',
    component: CoachAthleteDashboardView,
    props: true,
    meta: { requiresAuth: true, requiresCoach: true }
  },

  // ADMIN
  {
    path: '/admin',
    component: AdminView,
    meta: { requiresAuth: true, requiresAdmin: true }
  },

  // MOBILE
  {
    path: '/mobile/video',
    component: MobileVideoView,
    meta: { requiresAuth: true, mobileOnly: true }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

function isMobile() {
  return (
    window.matchMedia?.('(max-width: 820px)').matches ||
    /Mobi|Android/i.test(navigator.userAgent)
  )
}

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  // PAS CONNECTÉ
  if (to.meta.requiresAuth && !auth.token) {
    return next('/login')
  }

  // DÉJÀ CONNECTÉ -> REDIRECTION SELON RÔLE
  if (to.path === '/login' && auth.token) {
    if (auth.rights.includes('admin')) return next('/admin')
    if (auth.rights.includes('coach')) return next('/coach')
    return next('/dashboard')
  }

  // INTERDICTION DASHBOARD
  if (
    to.path === '/dashboard' &&
    (auth.rights.includes('coach') || auth.rights.includes('admin'))
  ) {
    return auth.rights.includes('admin')
      ? next('/admin')
      : next('/coach')
  }

  // DROITS
  if (to.meta.requiresAdmin && !auth.rights.includes('admin')) {
    return next('/dashboard')
  }

  if (to.meta.requiresCoach && !auth.rights.includes('coach')) {
    return next('/dashboard')
  }

  if (to.meta.requiresBasic && auth.rights.some(r => r !== 'basic')) {
    return auth.rights.includes('admin')
      ? next('/admin')
      : next('/coach')
  }

  // MOBILE 
  if (to.meta.mobileOnly && !isMobile()) {
    return next('/dashboard')
  }

  next()
})

export default router
