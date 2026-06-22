import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import { useRecoilState } from 'recoil'
import { notificationsAtom } from '../recoil/atoms/notificationAtom'
import { selectedTaskAtom } from '../recoil/atoms/taskAtom'
import useAuth from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const SocketContext = createContext(null)

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth()
  const [socket, setSocket] = useState(null)
  const [notifications, setNotifications] = useRecoilState(notificationsAtom)
  const [selectedTask, setSelectedTask] = useRecoilState(selectedTaskAtom)
  const navigate = useNavigate()
  const notifToastIdsRef = useRef([])

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
      return
    }

    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
    const socketUrl = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase

    const socketInstance = io(socketUrl, {
      transports: ['websocket'],
      auth: { token },
    })

    socketInstance.on('connect', () => {
      console.log('🔌 Connected to Socket.io backend')
      // Join user room for personal notifications
      socketInstance.emit('join_user', user._id)
    })

    // Listen for unified event structure
    socketInstance.on('event', ({ type, data }) => {
      console.log('📡 Socket event received:', type, data)
      
      if (type === 'notification') {
        const newNotification = data

        // If it's already read, update the notification in Recoil state and skip the toast
        if (newNotification.isRead) {
          setNotifications((prev) =>
            prev.map((n) => (n._id === newNotification._id ? newNotification : n))
          )
          return;
        }

        // Avoid adding duplicate notification to state
        setNotifications((prev) => {
          if (prev.some((n) => n._id === newNotification._id)) {
            return prev.map((n) => (n._id === newNotification._id ? newNotification : n))
          }
          return [newNotification, ...prev]
        })

        // Dismiss oldest if we already have 3 visible notification toasts
        if (notifToastIdsRef.current.length >= 3) {
          const oldestId = notifToastIdsRef.current.shift()
          toast.dismiss(oldestId)
        }

        const newToastId = toast((t) => (
          <div className="flex items-start gap-2.5 font-sans w-full pr-5 relative">
            <div 
              onClick={async () => {
                toast.dismiss(t.id)
                notifToastIdsRef.current = notifToastIdsRef.current.filter((id) => id !== t.id)
                // Mark as read in backend and update recoil locally
                try {
                  setNotifications((prev) =>
                    prev.map((n) => (n._id === newNotification._id ? { ...n, isRead: true } : n))
                  )
                  await api.put(`/notifications/${newNotification._id}/read`)
                } catch (err) {
                  console.error('Failed to mark notification as read:', err)
                }
                if (newNotification.relatedLink) {
                  navigate(newNotification.relatedLink)
                }
              }}
              className="cursor-pointer flex-1"
            >
              <div className="font-semibold text-xs text-white">New Notification</div>
              <div className="text-[11px] text-slate-350 mt-0.5 hover:underline break-words">{newNotification.message}</div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                toast.dismiss(t.id)
                notifToastIdsRef.current = notifToastIdsRef.current.filter((id) => id !== t.id)
              }}
              className="absolute top-0 right-0 p-0.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded transition-colors text-[10px] leading-none"
            >
              ✕
            </button>
          </div>
        ), {
          icon: '🔔',
          duration: 5000,
          position: 'bottom-right',
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
            padding: '10px 14px',
            borderRadius: '8px',
            minWidth: '280px',
            maxWidth: '340px',
          }
        })

        notifToastIdsRef.current.push(newToastId)
        // Clean up from tracking array when toast expires/dismisses naturally
        setTimeout(() => {
          notifToastIdsRef.current = notifToastIdsRef.current.filter((id) => id !== newToastId)
        }, 5100)
      } else if (type === 'message') {
        // Real-time comments
        setSelectedTask((prev) => {
          if (prev && prev._id === data.taskId) {
            const exists = prev.comments?.some((c) => c._id === data.comment?._id)
            if (exists) return prev
            return {
              ...prev,
              comments: [...(prev.comments || []), data.comment]
            }
          }
          return prev
        })
      } else if (type === 'task_update') {
        // Real-time task fields update
        setSelectedTask((prev) => {
          if (prev && prev._id === data.taskId) {
            return data.task
          }
          return prev
        })
      }
    })

    socketInstance.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.io backend')
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [token, user]) // eslint-disable-line

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}
