<template>
  <div class="page">
    <h1>Administration</h1>

    <div class="grid grid-2">
      <!-- =========================
           UTILISATEURS
      ========================== -->
      <div class="card">
        <h3>Utilisateurs</h3>

        <div v-if="usersLoading" class="muted">Chargement…</div>
        <div v-else-if="users.length === 0" class="muted">
          Aucun utilisateur
        </div>

        <table v-else class="table">
          <thead>
            <tr>
              <th>Login</th>
              <th>Email</th>
              <th>Rôle(s)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u._id">
              <td>{{ u.login }}</td>
              <td>{{ u.email }}</td>
              <td>
                <span
                  v-for="r in u.rights"
                  :key="r"
                  class="badge"
                  :class="badgeClass(r)"
                >
                  {{ r }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- AJOUT UTILISATEUR -->
        <hr style="margin:1rem 0" />
        <h4>Ajouter un utilisateur</h4>

        <div class="form-row">
          <input v-model="newUser.login" placeholder="Login" />
          <input v-model="newUser.email" placeholder="Email" />
          <input
            v-model="newUser.password"
            type="password"
            placeholder="Mot de passe"
          />
          <select v-model="newUser.role">
            <option value="basic">Sportif</option>
            <option value="coach">Coach</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button
          @click="createUser"
          :disabled="creatingUser || !canCreateUser"
          style="margin-top:.5rem"
        >
          Créer
        </button>

        <p v-if="userError" class="error">{{ userError }}</p>
      </div>

      <!-- =========================
           MODULES ESP
      ========================== -->
      <div class="card">
        <h3>Modules ESP32</h3>

        <div v-if="modulesLoading" class="muted">Chargement…</div>
        <div v-else-if="modules.length === 0" class="muted">
          Aucun module enregistré
        </div>

        <table v-else class="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>UC</th>
              <th>Clé</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in modules" :key="m._id">
              <td>{{ m.name }}</td>
              <td>{{ m.uc }}</td>
              <td class="mono">{{ m.key }}</td>
            </tr>
          </tbody>
        </table>

        <!-- AJOUT MODULE -->
        <hr style="margin:1rem 0" />
        <h4>Ajouter un module</h4>

        <div class="form-row">
          <input v-model="newModule.name" placeholder="Nom" />
          <input v-model="newModule.uc" placeholder="UC" />
          <input v-model="newModule.key" placeholder="Clé ESP" />
        </div>

        <button
          @click="createModule"
          :disabled="registering || !canRegister"
          style="margin-top:.5rem"
        >
          Ajouter
        </button>

        <p v-if="registerError" class="error">{{ registerError }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import { useUserStore } from '../store/user.store'
import { useModuleStore } from '../store/module.store'

/* =========================
   STORES
========================= */
const userStore = useUserStore()
const moduleStore = useModuleStore()

const { users } = storeToRefs(userStore)
const { modules } = storeToRefs(moduleStore)

/* =========================
   LOADERS
========================= */
const usersLoading = ref(false)
const modulesLoading = ref(false)

/* =========================
   FETCH INITIAL
========================= */
onMounted(async () => {
  usersLoading.value = true
  modulesLoading.value = true

  await Promise.all([
    userStore.fetch().finally(() => (usersLoading.value = false)),
    moduleStore.fetch().finally(() => (modulesLoading.value = false)),
  ])
})

/* =========================
   BADGES
========================= */
function badgeClass(role) {
  if (role === 'admin') return 'badge-danger'
  if (role === 'coach') return 'badge-warning'
  return 'badge-success'
}

/* =========================
   AJOUT UTILISATEUR
========================= */
const newUser = ref({
  login: '',
  email: '',
  password: '',
  role: 'basic',
})

const creatingUser = ref(false)
const userError = ref('')

const canCreateUser = computed(() =>
  newUser.value.login &&
  newUser.value.email &&
  newUser.value.password &&
  newUser.value.role
)

async function createUser() {
  userError.value = ''
  creatingUser.value = true

  try {
    await userStore.create({
      login: newUser.value.login,
      email: newUser.value.email,
      password: newUser.value.password,
      rights: [newUser.value.role],
    })

    newUser.value = {
      login: '',
      email: '',
      password: '',
      role: 'basic',
    }

    await userStore.fetch()
  } catch (e) {
    userError.value = e?.data || e?.message || 'Erreur création utilisateur'
  } finally {
    creatingUser.value = false
  }
}

/* =========================
   AJOUT MODULE
========================= */
const newModule = ref({
  name: '',
  uc: '',
  key: '',
})

const registering = ref(false)
const registerError = ref('')

const canRegister = computed(() =>
  newModule.value.name &&
  newModule.value.uc &&
  newModule.value.key
)

async function createModule() {
  registerError.value = ''
  registering.value = true

  try {
    await moduleStore.create({
      name: newModule.value.name,
      shortName: newModule.value.name.slice(0, 6),
      key: newModule.value.key,
      uc: newModule.value.uc,
      chipsets: [],
    })

    newModule.value = { name: '', uc: '', key: '' }
    await moduleStore.fetch()
  } catch (e) {
    registerError.value = e?.data || 'Erreur création module'
  } finally {
    registering.value = false
  }
}
</script>

<style scoped>
.table {
  width: 100%;
  border-collapse: collapse;
  margin-top: .5rem;
}
.table th,
.table td {
  padding: .4rem .5rem;
  border-bottom: 1px solid var(--border);
}
.mono {
  font-family: monospace;
  font-size: .85rem;
}
.form-row {
  display: flex;
  gap: .4rem;
}
input,
select {
  flex: 1;
}
.badge {
  margin-right: .25rem;
}
</style>
