import React from 'react'
import { Toaster } from 'react-hot-toast'
import Sidebar from './Sidebar'

const Layout = ({ children }) => (
  <div className="flex min-h-screen bg-dark-900">
    <Sidebar />
    <main className="flex-1 flex flex-col min-w-0">
      <div className="flex-1 p-6 animate-fade-in">{children}</div>
    </main>
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background:   '#1e293b',
          color:        '#f1f5f9',
          border:       '1px solid #334155',
          borderRadius: '10px',
        },
      }}
    />
  </div>
)

export default Layout
