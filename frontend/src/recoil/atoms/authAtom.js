import { atom } from 'recoil'

// Load user from localStorage if it exists
const savedUser = localStorage.getItem('user');
let initialUser = null;
try {
  if (savedUser) {
    initialUser = JSON.parse(savedUser);
  }
} catch (e) {
  localStorage.removeItem('user');
}

export const authUserAtom = atom({
  key: 'authUser',
  default: initialUser,
})

export const authTokenAtom = atom({
  key: 'authToken',
  default: localStorage.getItem('token') || null,
})

export const authLoadingAtom = atom({
  key: 'authLoading',
  default: false,
})

export const authCheckedAtom = atom({
  key: 'authChecked',
  default: !localStorage.getItem('token'), // Checked immediately if no token is stored
})
