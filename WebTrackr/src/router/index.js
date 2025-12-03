import { createRouter, createWebHistory } from 'vue-router'

import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import StartSessionView from '../views/StartSessionView.vue'
import SessionsListView from '../views/SessionsListView.vue'
import SessionDetailView from '../views/SessionDetailView.vue'
import AdminView from '../views/AdminView.vue'

import { useAuthStore } from '../store/auth.store'

const routes = [
  { path: '/', redirect: '/login' },

  { path: '/login', component: LoginView },

  {
    path: '/dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: '/session/start',
    component: StartSessionView,
    meta: { requiresAuth: true },
  },
  {
    path: '/sessions',
    component: SessionsListView,
    meta: { requiresAuth: true },
  },
  {
    path: '/sessions/:day',
    component: SessionDetailView,
    props: true,
    meta: { requiresAuth: true },
  },
  {
    path: '/admin',
    component: AdminView,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.token) {
    return next('/login')
  }

  if (to.path === '/login' && auth.token) {
    return next('/dashboard')
  }

  next()
})

export default router
