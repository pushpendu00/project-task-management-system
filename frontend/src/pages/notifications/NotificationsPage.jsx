import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { AiOutlineBell, AiOutlineMail, AiOutlineCheck, AiOutlineEye } from 'react-icons/ai'
import api from '../../api/axios'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const { data } = await api.get('/notifications')
      setNotifications(data.notifications || [])
    } catch (error) {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error('Failed to update notifications')
    }
  }

  const handleMarkRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
    } catch (error) {
      toast.error('Failed to mark read')
    }
  }

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <AiOutlineBell className="text-primary-400" /> Notifications
          </h1>
          <p className="text-slate-400 text-sm mt-1">Stay updated with deadlines, work log feedback, and assignments.</p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <Button variant="secondary" onClick={handleMarkAllRead} id="read-all-btn" className="text-xs">
            <AiOutlineCheck size={14} /> Mark all read
          </Button>
        )}
      </div>

      {loading && notifications.length === 0 ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : notifications.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 font-medium">
          <AiOutlineMail size={40} className="mx-auto mb-3 text-slate-600 animate-bounce" />
          You have no notifications yet.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && handleMarkRead(n._id)}
              className={`card p-4 flex items-start gap-4 transition-all duration-200 cursor-pointer border-l-4 ${
                !n.isRead
                  ? 'bg-dark-800 border-l-primary-500 hover:border-l-primary-400'
                  : 'bg-dark-850/60 border-l-slate-700 hover:bg-dark-800/40'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                n.type === 'overdue' ? 'bg-red-950/60 text-red-400' :
                n.type === 'reminder' ? 'bg-orange-950/60 text-orange-400' :
                n.type === 'assignment' ? 'bg-blue-950/60 text-blue-400' :
                'bg-purple-950/60 text-purple-400'
              }`}>
                <AiOutlineBell size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.isRead ? 'text-white font-semibold' : 'text-slate-300'}`}>
                  {n.message}
                </p>
                <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  <span className={`px-1.5 py-0.5 rounded ${
                    n.type === 'overdue' ? 'bg-red-900/20 text-red-400' :
                    n.type === 'reminder' ? 'bg-orange-900/20 text-orange-400' :
                    n.type === 'assignment' ? 'bg-blue-900/20 text-blue-400' :
                    'bg-purple-900/20 text-purple-400'
                  }`}>
                    {n.type}
                  </span>
                  <span>•</span>
                  <span>{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              </div>
              {!n.isRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMarkRead(n._id)
                  }}
                  className="p-1 rounded hover:bg-dark-700/50 text-slate-400 hover:text-white transition-colors"
                  title="Mark as read"
                >
                  <AiOutlineEye size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default NotificationsPage
