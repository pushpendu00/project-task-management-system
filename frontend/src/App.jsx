import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import AppRoutes from './routes/AppRoutes.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'

function App() {
  return (
    <RecoilRoot>
      <ThemeProvider>
        <BrowserRouter>
          <SocketProvider>
            <AppRoutes />
          </SocketProvider>
        </BrowserRouter>
      </ThemeProvider>
    </RecoilRoot>
  )
}

export default App
