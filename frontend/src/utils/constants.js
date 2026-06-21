// Vite exposes env vars via import.meta.env.VITE_*
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const TASK_STATUSES        = ['todo', 'in-progress', 'in-review', 'completed', 'blocked']
export const PRIORITIES           = ['low', 'medium', 'high', 'critical']
export const PROJECT_STATUSES     = ['planning', 'active', 'on-hold', 'completed', 'cancelled', 'archived']
export const USER_ROLES           = ['admin', 'manager', 'member']
export const PROJECT_MEMBER_ROLES = ['manager', 'developer', 'designer', 'tester', 'viewer']
