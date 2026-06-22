import { useRecoilState } from 'recoil'
import toast from 'react-hot-toast'
import { tasksAtom, selectedTaskAtom, tasksLoadingAtom } from '../recoil/atoms/taskAtom'
import {
  getTasksApi, getTaskByIdApi, createTaskApi,
  updateTaskApi, deleteTaskApi, addCommentApi,
} from '../api/task.api'

const useTasks = () => {
  const [tasks,        setTasks]        = useRecoilState(tasksAtom)
  const [selectedTask, setSelectedTask] = useRecoilState(selectedTaskAtom)
  const [loading,      setLoading]      = useRecoilState(tasksLoadingAtom)

  const fetchTasks = async (params = {}) => {
    try {
      setLoading(true)
      const { data } = await getTasksApi(params)
      setTasks(data.tasks)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }

  const fetchTaskById = async (id) => {
    try {
      setLoading(true)
      const { data } = await getTaskByIdApi(id)
      setSelectedTask(data.task)
      return data.task
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch task')
    } finally {
      setLoading(false)
    }
  }

  const createTask = async (taskData) => {
    try {
      setLoading(true)
      const { data } = await createTaskApi(taskData)
      setTasks((prev) => [data.task, ...prev])
      toast.success('Task created successfully!')
      return data.task
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  const updateTask = async (id, taskData) => {
    try {
      const { data } = await updateTaskApi(id, taskData)
      setTasks((prev) => prev.map((t) => (t._id === id ? data.task : t)))
      if (selectedTask?._id === id) setSelectedTask(data.task)
      toast.success('Task updated!')
      return data.task
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update task')
    }
  }

  const deleteTask = async (id) => {
    try {
      await deleteTaskApi(id)
      setTasks((prev) => prev.filter((t) => t._id !== id))
      toast.success('Task deleted!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete task')
    }
  }

  const addComment = async (id, commentData) => {
    try {
      const payload = typeof commentData === 'string' ? { text: commentData } : commentData
      const { data } = await addCommentApi(id, payload)
      setSelectedTask(data.task)
      return data.task
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add comment')
    }
  }

  return {
    tasks, selectedTask, loading,
    fetchTasks, fetchTaskById, createTask, updateTask, deleteTask, addComment, setSelectedTask,
  }
}

export default useTasks
