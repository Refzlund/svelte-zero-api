import type { APIRoutes } from './api.d'
import { createAPIProxy } from 'sveltekit-zero-api/client'

const proxy = createAPIProxy<APIRoutes>() as APIRoutes

const api = proxy.api

export default api