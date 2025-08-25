'use client'

import { useState, useEffect, useCallback } from 'react'

export interface CookieManagerState {
  hasCookie: boolean
  isModalOpen: boolean
  isLoading: boolean
}

export function useCookieManager() {
  const [state, setState] = useState<CookieManagerState>({
    hasCookie: false,
    isModalOpen: false,
    isLoading: true
  })

  // 检查是否有有效的 Cookie
  const checkCookie = useCallback(() => {
    const cookie = localStorage.getItem('xhs_cookie')
    const hasCookie = !!cookie && cookie.trim().length > 0
    
    setState(prev => ({
      ...prev,
      hasCookie,
      isLoading: false
    }))
    
    return hasCookie
  }, [])

  // 初始化检查
  useEffect(() => {
    // 延迟检查，确保组件已挂载
    const timer = setTimeout(() => {
      const hasCookie = checkCookie()
      console.log('Cookie 初始化检查结果:', hasCookie)
      
      // 只有在真正没有 Cookie 时才自动打开对话框
      // 如果有 Cookie，不自动打开对话框
      if (!hasCookie) {
        console.log('没有检测到 Cookie，自动打开配置对话框')
        setState(prev => ({ ...prev, isModalOpen: true }))
      } else {
        console.log('检测到已保存的 Cookie，不自动打开对话框')
        setState(prev => ({ ...prev, isModalOpen: false }))
      }
    }, 100) // 减少延迟，快速响应

    return () => clearTimeout(timer)
  }, [checkCookie])

  // 打开 Cookie 配置对话框
  const openCookieModal = useCallback(() => {
    setState(prev => ({ ...prev, isModalOpen: true }))
  }, [])

  // 关闭 Cookie 配置对话框
  const closeCookieModal = useCallback(() => {
    setState(prev => ({ ...prev, isModalOpen: false }))
  }, [])

  // Cookie 保存成功后的回调
  const onCookieSaved = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasCookie: true,
      isModalOpen: false
    }))
  }, [])

  // 处理 API 错误（如 401 未授权）
  const handleApiError = useCallback((error: any) => {
    if (error?.status === 401 || error?.message?.includes('Cookie')) {
      // Cookie 失效，清除并重新打开对话框
      localStorage.removeItem('xhs_cookie')
      setState(prev => ({
        ...prev,
        hasCookie: false,
        isModalOpen: true
      }))
    }
  }, [])

  return {
    ...state,
    checkCookie,
    openCookieModal,
    closeCookieModal,
    onCookieSaved,
    handleApiError
  }
}