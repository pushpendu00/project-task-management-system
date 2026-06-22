import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import AppRoutes from './routes/AppRoutes.jsx'
import { SocketProvider } from './context/SocketContext.jsx'

function App() {
  return (
    <RecoilRoot>
      <BrowserRouter>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </BrowserRouter>
    </RecoilRoot>
  )
}

export default App
