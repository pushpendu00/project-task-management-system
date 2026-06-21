import { selector } from 'recoil'
import { authUserAtom, authTokenAtom } from '../atoms/authAtom'

export const isAuthenticatedSelector = selector({
  key: 'isAuthenticated',
  get: ({ get }) => {
    const token = get(authTokenAtom)
    const user  = get(authUserAtom)
    return !!(token && user)
  },
})

export const currentUserRoleSelector = selector({
  key: 'currentUserRole',
  get: ({ get }) => {
    const user = get(authUserAtom)
    return user?.role || null
  },
})
