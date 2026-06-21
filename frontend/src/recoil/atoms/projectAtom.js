import { atom } from 'recoil'

export const projectsAtom = atom({
  key: 'projects',
  default: [],
})

export const selectedProjectAtom = atom({
  key: 'selectedProject',
  default: null,
})

export const projectsLoadingAtom = atom({
  key: 'projectsLoading',
  default: false,
})
