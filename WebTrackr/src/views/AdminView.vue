<template>
  <div>
    <h1>Admin</h1>

    <h2>Utilisateurs</h2>
    <div v-if="loadingUsers">Chargement des utilisateurs…</div>
    <div v-else-if="errUsers">Erreur : {{ errUsers.message || errUsers }}</div>
    <ul v-else>
      <li v-for="u in users" :key="u._id">
        {{ u.login }} ({{ u.email }}) — droits: {{ (u.rights || []).join(', ') }}
      </li>
      <li v-if="users.length === 0">Aucun utilisateur.</li>
    </ul>

    <h2>Modules</h2>
    <div v-if="loadingModules">Chargement des modules…</div>
    <div v-else-if="errModules">Erreur : {{ errModules.message || errModules }}</div>
    <ul v-else>
      <li v-for="m in modules" :key="m._id">
        {{ m.name }} — UC: {{ m.uc }}
      </li>
      <li v-if="modules.length === 0">Aucun module.</li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '../store/user.store'
import { useModuleStore } from '../store/module.store'

const userStore = useUserStore()
const moduleStore = useModuleStore()

const { users } = storeToRefs(userStore)
const { modules } = storeToRefs(moduleStore)

const loadingUsers = ref(false)
const loadingModules = ref(false)
const errUsers = ref(null)
const errModules = ref(null)

onMounted(async () => {
  loadingUsers.value = true
  loadingModules.value = true
  errUsers.value = null
  errModules.value = null

  const pUsers = userStore.fetch().catch(e => { errUsers.value = e })
  const pModules = moduleStore.fetch().catch(e => { errModules.value = e })

  await pUsers
  loadingUsers.value = false

  await pModules
  loadingModules.value = false
})
</script>