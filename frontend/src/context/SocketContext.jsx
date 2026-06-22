import React, { createContext, useContext, useEffect, useState } from 'react'
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
        // Prepend to recoil notifications state
        setNotifications((prev) => [newNotification, ...prev])

        // Trigger toast alert with deep link redirect
        toast((t) => (
          <div 
            onClick={async () => {
              toast.dismiss(t.id)
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
            className="cursor-pointer font-sans"
          >
            <div className="font-semibold text-xs text-white">New Notification</div>
            <div className="text-[11px] text-slate-300 mt-0.5 hover:underline">{newNotification.message}</div>
          </div>
        ), {
          icon: '🔔',
          duration: 6000,
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
            padding: '8px 12px',
            borderRadius: '8px',
          }
        })
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
