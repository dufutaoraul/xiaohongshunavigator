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

  // 初始化时检查本地存储的用户信息并验证权限
  useEffect(() => {
    const checkAndVerifyUserSession = async () => {
      const userSession = localStorage.getItem('userSession')
      if (userSession) {
        try {
          const sessionData = JSON.parse(userSession)
          if (sessionData.isAuthenticated && sessionData.student_id) {
            
            // 尝试验证权限并获取最新的role信息
            try {
              const response = await fetch(`/api/user?student_id=${sessionData.student_id}`)
              if (response.ok) {
                const userData = await response.json()
                const latestRole = userData?.role || 'student'
                
                console.log('🔍 AuthContext权限验证:', {
                  studentId: sessionData.student_id,
                  cachedRole: sessionData.role,
                  latestRole: latestRole,
                  isAdmin: latestRole === 'admin'
                })
                
                // 使用最新的权限信息
                const finalUserData = {
                  student_id: sessionData.student_id,
                  name: sessionData.name || userData?.name || '',
                  role: latestRole as 'student' | 'admin',
                  persona: userData?.persona,
                  keywords: userData?.keywords,
                  vision: userData?.vision
                }
                
                setUser(finalUserData)
                setIsAuthenticated(true)
                
                // 如果role发生变化，更新localStorage
                if (sessionData.role !== latestRole) {
                  const updatedSession = { 
                    ...sessionData, 
                    role: latestRole,
                    user: finalUserData
                  }
                  localStorage.setItem('userSession', JSON.stringify(updatedSession))
                  console.log('🔄 AuthContext更新localStorage中的role信息:', latestRole)
                }
                
                return
              }
            } catch (apiError) {
              console.error('权限验证API调用失败，使用缓存信息:', apiError)
            }
            
            // API调用失败，使用缓存的信息
            const userData = sessionData.user || {
              student_id: sessionData.student_id,
              name: sessionData.name,
              role: sessionData.role || 'student'
            }
            setUser(userData)
            setIsAuthenticated(true)
          }
        } catch (error) {
          console.error('Failed to parse user session:', error)
          localStorage.removeItem('userSession')
        }
      }
    }

    checkAndVerifyUserSession()
    
    // 定期检查权限状态（每60秒）
    const interval = setInterval(checkAndVerifyUserSession, 60000)
    
    return () => {
      clearInterval(interval)
    }
  }, [])

  const login = (userData: User) => {
    setUser(userData)
    setIsAuthenticated(true)
    
    // 保存到本地存储
    localStorage.setItem('userSession', JSON.stringify({
      user: userData,
      isAuthenticated: true,
      student_id: userData.student_id,
      name: userData.name,
      role: userData.role
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