'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { QRCodeModal } from './QRCodeModal'
import { useViewNote } from '@/app/hooks/useViewNote'

interface ViewNoteButtonProps {
  note_id?: string
  url?: string
  title?: string
  className?: string
  children?: React.ReactNode
  enableProxy?: boolean
  cookie?: string
}

export function ViewNoteButton({ 
  note_id, 
  url, 
  title,
  className = '',
  children,
  enableProxy = false,
  cookie
}: ViewNoteButtonProps) {
  const [showQRModal, setShowQRModal] = useState(false)
  const [showProxyContent, setShowProxyContent] = useState(false)
  const [proxyContent, setProxyContent] = useState<any>(null)
  
  const { viewNote, isLoading, error } = useViewNote()

  const handleViewNote = async () => {
    if (!note_id && !url) {
      console.error('Missing note_id or url')
      return
    }

    const noteUrl = url || (note_id ? `https://www.xiaohongshu.com/explore/${note_id}` : '')

    // 尝试三种打开方式
    console.log('🔗 尝试打开小红书链接:', noteUrl)

    // 方法1: 直接在新窗口打开
    try {
      const newWindow = window.open(noteUrl, '_blank', 'noopener,noreferrer')
      if (newWindow) {
        console.log('✅ 方法1成功: 新窗口打开')
        return
      }
    } catch (error) {
      console.log('❌ 方法1失败:', error)
    }

    // 方法2: 使用location.href跳转
    try {
      window.location.href = noteUrl
      console.log('✅ 方法2: 当前窗口跳转')
      return
    } catch (error) {
      console.log('❌ 方法2失败:', error)
    }

    // 方法3: 显示二维码（兜底方案）
    console.log('🔄 使用兜底方案: 显示二维码')
    setShowQRModal(true)
  }

  const noteUrl = url || (note_id ? `https://www.xiaohongshu.com/explore/${note_id}` : '')

  return (
    <>
      <button
        onClick={handleViewNote}
        disabled={isLoading || (!note_id && !url)}
        className={`
          inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium
          bg-blue-600 text-white rounded-md hover:bg-blue-700 
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
          ${className}
        `}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            加载中...
          </>
        ) : (
          children || '查看原文'
        )}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 二维码模态框 */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        url={noteUrl}
        title={title}
      />

      {/* 代理内容模态框 */}
      {showProxyContent && proxyContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">
                  {proxyContent.title || title || '笔记内容'}
                </h3>
                <button
                  onClick={() => setShowProxyContent(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {proxyContent.description && (
                <div className="mb-4">
                  <p className="text-gray-700">{proxyContent.description}</p>
                </div>
              )}
              
              {proxyContent.images && proxyContent.images.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-2">
                    {proxyContent.images.slice(0, 4).map((img: string, index: number) => (
                      <div key={index} className="relative w-full h-32">
                        <Image
                          src={img}
                          alt={`图片 ${index + 1}`}
                          fill
                          className="object-cover rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-4 border-t">
                <a
                  href={noteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  在小红书中打开
                </a>
                <button
                  onClick={() => setShowProxyContent(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
