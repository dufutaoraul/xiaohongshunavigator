'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  student_id: string
  name: string
  role: 'student' | 'admin'
  persona?: string
  keywords?: string
  vision?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (userData: User) => void
  logout: () => void
  updateUser: (userData: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // 初始化时检查本地存储的用户信息
  useEffect(() => {
    const userSession = localStorage.getItem('userSession')
    if (userSession) {
      try {
        const sessionData = JSON.parse(userSession)
        if (sessionData.isAuthenticated && sessionData.user) {
          setUser(sessionData.user)
          setIsAuthenticated(true)
        }
      } catch (error) {
        console.error('Failed to parse user session:', error)
        localStorage.removeItem('userSession')
      }
    }
  }, [])

  const login = (userData: User) => {
    setUser(userData)
    setIsAuthenticated(true)
    
    // 保存到本地存储
    localStorage.setItem('userSession', JSON.stringify({
      user: userData,
      isAuthenticated: true
    }))
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('userSession')
    localStorage.removeItem('lastCredentials')
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      
      // 更新本地存储
      localStorage.setItem('userSession', JSON.stringify({
        user: updatedUser,
        isAuthenticated: true
      }))
    }
  }

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isAdmin,
      login,
      logout,
      updateUser
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}