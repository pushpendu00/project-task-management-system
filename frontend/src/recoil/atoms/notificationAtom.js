import { atom } from 'recoil'

export const notificationsAtom = atom({
  key: 'notifications',
  default: [],
})

export const notificationsLoadingAtom = atom({
  key: 'notificationsLoading',
  default: false,
})
