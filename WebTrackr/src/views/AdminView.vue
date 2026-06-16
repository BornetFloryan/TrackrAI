<template>
  <div class="page">
    <h1>Administration</h1>

    <div class="grid grid-2">
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
              <th>Coach</th>
              <th>Actions</th>
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
              <td>{{ coachLabel(u.coach) }}</td>
              <td>
                <button class="secondary" @click="selectUser(u)">
                  Modifier
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <hr style="margin:1rem 0" />
        <h4>Ajouter un utilisateur</h4>

        <div class="form-row">
          <input v-model="newUser.login" placeholder="Login" required/>
          <input v-model="newUser.email" placeholder="Email" required/>
          <input
            v-model="newUser.password"
            type="password"
            placeholder="Mot de passe"
            required
          />
          <select v-model="newUser.role">
            <option value="basic">Sportif</option>
            <option value="coach">Coach</option>
            <option value="admin">Admin</option>
          </select>
          <select v-if="newUser.role === 'basic'" v-model="newUser.coach">
            <option value="">Aucun coach</option>
            <option v-for="c in coachUsers" :key="c._id" :value="c._id">
              {{ c.login }}
            </option>
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

        <template v-if="editingUser.id">
          <hr style="margin:1rem 0" />
          <h4>Modifier l'utilisateur</h4>

          <div class="form-row">
            <input v-model="editingUser.login" placeholder="Login" />
            <input v-model="editingUser.email" placeholder="Email" />
            <select v-model="editingUser.role">
              <option value="basic">Sportif</option>
              <option value="coach">Coach</option>
              <option value="admin">Admin</option>
            </select>
            <select v-if="editingUser.role === 'basic'" v-model="editingUser.coach">
              <option value="">Aucun coach</option>
              <option v-for="c in coachUsers" :key="c._id" :value="c._id">
                {{ c.login }}
              </option>
            </select>
          </div>

          <div class="form-row" style="margin-top:.5rem;">
            <input
              v-model="editingUser.password"
              type="password"
              placeholder="Nouveau mot de passe (optionnel)"
            />
            <button @click="updateUser" :disabled="updatingUser">
              Enregistrer
            </button>
            <button class="secondary" @click="cancelUserEdit">
              Annuler
            </button>
          </div>
        </template>
      </div>

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
              <th>État</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in modules" :key="m._id">
              <td>{{ m.name }}</td>
              <td>{{ m.uc }}</td>
              <td class="mono">{{ m.key }}</td>
              <td>
                <span class="badge" :class="m.connected ? 'badge-success' : ''">
                  {{ m.connected ? 'connecté' : 'hors ligne' }}
                </span>
              </td>
              <td>
                <button class="secondary" @click="selectModule(m)">
                  Modifier
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <hr style="margin:1rem 0" />
        <h4>Ajouter un module</h4>

        <div class="form-row">
          <input v-model="newModule.name" placeholder="Nom" required/>
          <input v-model="newModule.uc" placeholder="UC" required/>
          <input v-model="newModule.key" placeholder="Clé ESP" required/>
        </div>

        <button
          @click="createModule"
          :disabled="registering || !canRegister"
          style="margin-top:.5rem"
        >
          Ajouter
        </button>

        <p v-if="registerError" class="error">{{ registerError }}</p>

        <template v-if="editingModule.id">
          <hr style="margin:1rem 0" />
          <h4>Modifier le module</h4>

          <div class="form-row">
            <input v-model="editingModule.name" placeholder="Nom" />
            <input v-model="editingModule.uc" placeholder="UC" />
          </div>

          <div class="form-row" style="margin-top:.5rem;">
            <button @click="updateModule" :disabled="updatingModule">
              Enregistrer
            </button>
            <button class="secondary" @click="cancelModuleEdit">
              Annuler
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

import { useUserStore } from '../store/user.store'
import { useModuleStore } from '../store/module.store'

const userStore = useUserStore()
const moduleStore = useModuleStore()

const { users } = storeToRefs(userStore)
const { modules } = storeToRefs(moduleStore)

const usersLoading = ref(false)
const modulesLoading = ref(false)

onMounted(async () => {
  usersLoading.value = true
  modulesLoading.value = true

  await Promise.all([
    userStore.fetch().finally(() => (usersLoading.value = false)),
    moduleStore.fetch().finally(() => (modulesLoading.value = false)),
  ])
})

function badgeClass(role) {
  if (role === 'admin') return 'badge-danger'
  if (role === 'coach') return 'badge-warning'
  return 'badge-success'
}

const newUser = ref({
  login: '',
  email: '',
  password: '',
  role: 'basic',
  coach: '',
})

const creatingUser = ref(false)
const updatingUser = ref(false)
const userError = ref('')
const editingUser = ref({
  id: '',
  login: '',
  email: '',
  role: 'basic',
  coach: '',
  password: '',
})

const coachUsers = computed(() =>
  users.value.filter(u => u.rights?.includes('coach'))
)

function coachId(coach) {
  if (!coach) return ''
  return typeof coach === 'object' ? coach._id : coach
}

function coachLabel(coach) {
  if (!coach) return '—'
  if (typeof coach === 'object') return coach.login || coach._id || '—'
  const found = users.value.find(u => u._id === coach)
  return found?.login || coach
}

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
      coach: newUser.value.role === 'basic' ? newUser.value.coach || undefined : undefined,
    })

    newUser.value = {
      login: '',
      email: '',
      password: '',
      role: 'basic',
      coach: '',
    }

    await userStore.fetch()
  } catch (e) {
    userError.value = e?.data || e?.message || 'Erreur création utilisateur'
  } finally {
    creatingUser.value = false
  }
}

function selectUser(user) {
  editingUser.value = {
    id: user._id,
    login: user.login,
    email: user.email,
    role: user.rights?.[0] || 'basic',
    coach: coachId(user.coach),
    password: '',
  }
}

function cancelUserEdit() {
  editingUser.value = {
    id: '',
    login: '',
    email: '',
    role: 'basic',
    coach: '',
    password: '',
  }
}

async function updateUser() {
  userError.value = ''
  updatingUser.value = true

  try {
    const data = {
      login: editingUser.value.login,
      email: editingUser.value.email,
      rights: [editingUser.value.role],
      coach: editingUser.value.role === 'basic' ? editingUser.value.coach || null : null,
    }

    if (editingUser.value.password) {
      data.password = editingUser.value.password
    }

    await userStore.update(editingUser.value.id, data)
    cancelUserEdit()
    await userStore.fetch()
  } catch (e) {
    userError.value = e?.data || e?.message || 'Erreur modification utilisateur'
  } finally {
    updatingUser.value = false
  }
}

const newModule = ref({
  name: '',
  uc: '',
  key: '',
})

const registering = ref(false)
const updatingModule = ref(false)
const registerError = ref('')
const editingModule = ref({
  id: '',
  name: '',
  uc: '',
})

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

function selectModule(module) {
  editingModule.value = {
    id: module._id,
    name: module.name,
    uc: module.uc,
  }
}

function cancelModuleEdit() {
  editingModule.value = {
    id: '',
    name: '',
    uc: '',
  }
}

async function updateModule() {
  registerError.value = ''
  updatingModule.value = true

  try {
    await moduleStore.update(editingModule.value.id, {
      name: editingModule.value.name,
      uc: editingModule.value.uc,
    })
    cancelModuleEdit()
    await moduleStore.fetch()
  } catch (e) {
    registerError.value = e?.data || e?.message || 'Erreur modification module'
  } finally {
    updatingModule.value = false
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
