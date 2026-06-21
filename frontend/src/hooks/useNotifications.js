import { useRecoilState } from 'recoil'
import { notificationsAtom, notificationsLoadingAtom } from '../recoil/atoms/notificationAtom'
import api from '../api/axios'
import useAuth from './useAuth'
import toast from 'react-hot-toast'

const useNotifications = () => {
  const [notifications, setNotifications] = useRecoilState(notificationsAtom)
  const [loading, setLoading] = useRecoilState(notificationsLoadingAtom)
  const { user } = useAuth()

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/notifications')
      setNotifications(data.notifications || [])
    } catch (error) {
      console.error('Failed to load notifications', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id) => {
    try {
      // Optimistic update: mark as read locally
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      )
      // Send API update
      await api.put(`/notifications/${id}/read`)
    } catch (error) {
      toast.error('Failed to mark notification as read')
      // Rollback on error
      fetchNotifications()
    }
  }

  const markAllAsRead = async () => {
    try {
      // Optimistic update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      // Send API update
      await api.put('/notifications/read-all')
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error('Failed to mark all as read')
      // Rollback on error
      fetchNotifications()
    }
  }

  return {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    setNotifications,
  }
}

export default useNotifications
