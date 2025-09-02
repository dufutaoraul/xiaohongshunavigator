'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import Image from 'next/image'
import * as QRCode from 'qrcode'

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  title?: string
}

export function QRCodeModal({ isOpen, onClose, url, title }: QRCodeModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const generateQRCode = useCallback(async () => {
    try {
      setIsLoading(true)
      const dataUrl = await QRCode.toDataURL(url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrCodeDataUrl(dataUrl)
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    } finally {
      setIsLoading(false)
    }
  }, [url])

  useEffect(() => {
    if (isOpen && url) {
      generateQRCode()
    }
  }, [isOpen, url, generateQRCode])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      // 可以添加一个 toast 提示
    } catch (error) {
      console.error('Failed to copy URL:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {title || '扫码查看原文'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 p-4">
          {isLoading ? (
            <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : qrCodeDataUrl ? (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <Image
                src={qrCodeDataUrl}
                alt="QR Code"
                width={256}
                height={256}
                className="w-64 h-64"
              />
            </div>
          ) : (
            <div className="w-64 h-64 flex items-center justify-center bg-gray-100 rounded-lg">
              <span className="text-gray-500">无法生成二维码</span>
            </div>
          )}
          
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              使用小红书 App 扫描二维码查看原文
            </p>
            <p className="text-xs text-gray-500 break-all max-w-xs">
              {url}
            </p>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              复制链接
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
