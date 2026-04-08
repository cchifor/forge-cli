import { ref, computed, readonly } from 'vue'
import Keycloak from 'keycloak-js'

export interface AuthUser {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  roles: string[]
  customerId: string
  orgId: string | null
}

const user = ref<AuthUser | null>(null)
const isLoading = ref(true)
const isInitialized = ref(false)

let keycloakInstance: Keycloak | null = null
let authDisabled = false

const DEV_USER: AuthUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'dev@localhost',
  username: 'dev-user',
  firstName: 'Dev',
  lastName: 'User',
  roles: ['admin', 'user'],
  customerId: '00000000-0000-0000-0000-000000000001',
  orgId: null,
}

function parseTokenToUser(tokenParsed: Record<string, unknown>): AuthUser {
  const realmAccess = tokenParsed.realm_access as
    | { roles?: string[] }
    | undefined
  return {
    id: String(tokenParsed.sub ?? ''),
    email: String(tokenParsed.email ?? ''),
    username: String(tokenParsed.preferred_username ?? ''),
    firstName: String(tokenParsed.given_name ?? ''),
    lastName: String(tokenParsed.family_name ?? ''),
    roles: realmAccess?.roles ?? [],
    customerId: String(tokenParsed.customer_id ?? tokenParsed.sub ?? ''),
    orgId: tokenParsed.org_id ? String(tokenParsed.org_id) : null,
  }
}

export function useAuth() {
  const isAuthenticated = computed(() => !!user.value)

  async function init() {
    if (isInitialized.value) return

    authDisabled = import.meta.env.VITE_AUTH_DISABLED === 'true'

    if (authDisabled) {
      user.value = DEV_USER
      isLoading.value = false
      isInitialized.value = true
      return
    }

    keycloakInstance = new Keycloak({
      url: import.meta.env.VITE_KEYCLOAK_URL,
      realm: import.meta.env.VITE_KEYCLOAK_REALM,
      clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
    })

    try {
      const authenticated = await keycloakInstance.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
        silentCheckSsoFallback: false,
        checkLoginIframe: false,
      })

      if (authenticated && keycloakInstance.tokenParsed) {
        user.value = parseTokenToUser(
          keycloakInstance.tokenParsed as Record<string, unknown>,
        )
      }

      // Auto-refresh token
      keycloakInstance.onTokenExpired = () => {
        keycloakInstance?.updateToken(30).catch(() => {
          user.value = null
        })
      }
    } catch (error) {
      console.error('Keycloak init failed:', error)
      user.value = null
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }

  async function getToken(): Promise<string | null> {
    if (authDisabled) return 'dev-token'
    if (!keycloakInstance) return null

    try {
      await keycloakInstance.updateToken(30)
      return keycloakInstance.token ?? null
    } catch {
      user.value = null
      return null
    }
  }

  function login(redirectUri?: string) {
    if (authDisabled) {
      user.value = DEV_USER
      return
    }
    keycloakInstance?.login({
      redirectUri: redirectUri ?? window.location.origin,
    })
  }

  function logout() {
    if (authDisabled) {
      user.value = null
      return
    }
    keycloakInstance?.logout({
      redirectUri: window.location.origin + '/login',
    })
  }

  function hasRole(role: string): boolean {
    return user.value?.roles.includes(role) ?? false
  }

  return {
    user: readonly(user),
    isAuthenticated,
    isLoading: readonly(isLoading),
    init,
    getToken,
    login,
    logout,
    hasRole,
  }
}
