import { atom } from 'recoil'

export const tasksAtom = atom({
  key: 'tasks',
  default: [],
})

export const selectedTaskAtom = atom({
  key: 'selectedTask',
  default: null,
})

export const tasksLoadingAtom = atom({
  key: 'tasksLoading',
  default: false,
})

export const taskFilterAtom = atom({
  key: 'taskFilter',
  default: {
    status: '',
    priority: '',
    assignedTo: '',
    project: '',
  },
})
