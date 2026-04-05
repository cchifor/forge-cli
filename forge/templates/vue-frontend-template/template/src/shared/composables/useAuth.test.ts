import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock keycloak-js before importing useAuth
const mockInit = vi.fn()
const mockLogin = vi.fn()
const mockLogout = vi.fn()
const mockUpdateToken = vi.fn()

vi.mock('keycloak-js', () => ({
  default: vi.fn(() => ({
    init: mockInit,
    login: mockLogin,
    logout: mockLogout,
    updateToken: mockUpdateToken,
    token: 'mock-kc-token',
    tokenParsed: {
      sub: 'kc-user-id',
      email: 'kc@example.com',
      preferred_username: 'kcuser',
      given_name: 'KC',
      family_name: 'User',
      realm_access: { roles: ['user'] },
      customer_id: 'cust-1',
      org_id: null,
    },
    onTokenExpired: null as (() => void) | null,
  })),
}))

describe('useAuth – dev mode (VITE_AUTH_DISABLED=true)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('VITE_AUTH_DISABLED', 'true')
  })

  async function loadUseAuth() {
    const mod = await import('./useAuth')
    return mod.useAuth()
  }

  it('init() sets user to DEV_USER and isLoading to false', async () => {
    const auth = await loadUseAuth()
    await auth.init()

    expect(auth.user.value).not.toBeNull()
    expect(auth.user.value!.username).toBe('dev-user')
    expect(auth.isLoading.value).toBe(false)
  })

  it('user has expected dev properties', async () => {
    const auth = await loadUseAuth()
    await auth.init()

    expect(auth.user.value).toMatchObject({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'dev@localhost',
      username: 'dev-user',
      firstName: 'Dev',
      lastName: 'User',
      roles: ['admin', 'user'],
      customerId: '00000000-0000-0000-0000-000000000001',
      orgId: null,
    })
  })

  it('isAuthenticated is true after init', async () => {
    const auth = await loadUseAuth()
    await auth.init()

    expect(auth.isAuthenticated.value).toBe(true)
  })

  it('getToken() returns dev-token', async () => {
    const auth = await loadUseAuth()
    await auth.init()

    const token = await auth.getToken()
    expect(token).toBe('dev-token')
  })

  it('login() sets user to DEV_USER (no-op style)', async () => {
    const auth = await loadUseAuth()
    await auth.init()

    auth.login()
    expect(auth.user.value).not.toBeNull()
    expect(auth.user.value!.username).toBe('dev-user')
  })

  it('logout() sets user to null', async () => {
    const auth = await loadUseAuth()
    await auth.init()

    auth.logout()
    expect(auth.user.value).toBeNull()
  })

  it('hasRole() returns true for any role when user is DEV_USER', async () => {
    const auth = await loadUseAuth()
    await auth.init()

    expect(auth.hasRole('admin')).toBe(true)
    expect(auth.hasRole('user')).toBe(true)
  })
})

describe('useAuth – Keycloak mode', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('VITE_AUTH_DISABLED', 'false')
    mockInit.mockReset()
    mockUpdateToken.mockReset()
  })

  async function loadUseAuth() {
    const mod = await import('./useAuth')
    return mod.useAuth()
  }

  it('init() creates Keycloak and calls init()', async () => {
    mockInit.mockResolvedValue(true)

    const auth = await loadUseAuth()
    await auth.init()

    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({ onLoad: 'check-sso', pkceMethod: 'S256' }),
    )
    expect(auth.isLoading.value).toBe(false)
  })

  it('init() sets user from tokenParsed on successful auth', async () => {
    mockInit.mockResolvedValue(true)

    const auth = await loadUseAuth()
    await auth.init()

    expect(auth.user.value).not.toBeNull()
    expect(auth.user.value!.email).toBe('kc@example.com')
  })

  it('init() leaves user null when authentication fails', async () => {
    mockInit.mockResolvedValue(false)

    const auth = await loadUseAuth()
    await auth.init()

    expect(auth.user.value).toBeNull()
  })

  it('getToken() calls updateToken and returns token', async () => {
    mockInit.mockResolvedValue(true)
    mockUpdateToken.mockResolvedValue(true)

    const auth = await loadUseAuth()
    await auth.init()

    const token = await auth.getToken()
    expect(mockUpdateToken).toHaveBeenCalledWith(30)
    expect(token).toBe('mock-kc-token')
  })

  it('getToken() returns null when keycloak is not initialized', async () => {
    // Do not call init – keycloakInstance stays null because we reset modules
    // but we need authDisabled to be false, which happens in init.
    // Instead, test via the no-init path: getToken checks !keycloakInstance
    const auth = await loadUseAuth()
    // Skip init so keycloakInstance remains null
    const token = await auth.getToken()
    expect(token).toBeNull()
  })
})
