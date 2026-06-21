import { selector } from 'recoil'
import { tasksAtom, taskFilterAtom } from '../atoms/taskAtom'

export const filteredTasksSelector = selector({
  key: 'filteredTasks',
  get: ({ get }) => {
    const tasks  = get(tasksAtom)
    const filter = get(taskFilterAtom)
    return tasks.filter((task) => {
      if (filter.status     && task.status     !== filter.status)          return false
      if (filter.priority   && task.priority   !== filter.priority)        return false
      if (filter.assignedTo && task.assignedTo?._id !== filter.assignedTo) return false
      if (filter.project    && task.project?._id    !== filter.project && task.project !== filter.project) return false
      return true
    })
  },
})

export const tasksByStatusSelector = selector({
  key: 'tasksByStatus',
  get: ({ get }) => {
    const tasks = get(filteredTasksSelector)
    return {
      'todo':        tasks.filter((t) => t.status === 'todo'),
      'in-progress': tasks.filter((t) => t.status === 'in-progress'),
      'in-review':   tasks.filter((t) => t.status === 'in-review'),
      'completed':   tasks.filter((t) => t.status === 'completed'),
      'blocked':     tasks.filter((t) => t.status === 'blocked'),
    }
  },
})
