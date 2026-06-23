import React, { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
      return savedTheme
    }
    return 'system'
  })

  const [activeTheme, setActiveTheme] = useState('dark')

  useEffect(() => {
    const getSystemTheme = () => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    const updateDOM = (applied) => {
      const root = document.documentElement
      const body = document.body
      
      if (applied === 'dark') {
        root.classList.add('dark')
        root.classList.remove('light')
        body.classList.add('dark')
        body.classList.remove('light')
      } else {
        root.classList.add('light')
        root.classList.remove('dark')
        body.classList.add('light')
        body.classList.remove('dark')
      }
      setActiveTheme(applied)
    }

    if (theme === 'system') {
      const systemTheme = getSystemTheme()
      updateDOM(systemTheme)

      // Listen for system changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = (e) => {
        updateDOM(e.matches ? 'dark' : 'light')
      }
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      updateDOM(theme)
    }

    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, activeTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
