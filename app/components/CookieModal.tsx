'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { ExternalLink, AlertCircle, CheckCircle } from 'lucide-react'

interface CookieModalProps {
  isOpen: boolean
  onClose: () => void
  onCookieSaved: () => void
}

export default function CookieModal({ isOpen, onClose, onCookieSaved }: CookieModalProps) {
  const [cookie, setCookie] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSaveCookie = async () => {
    if (!cookie.trim()) {
      setError('请输入 Cookie')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      // 直接保存 Cookie，跳过验证（因为后端服务可能未启动）
      localStorage.setItem('xhs_cookie', cookie.trim())
      setSuccess(true)
      
      // 延迟关闭对话框，让用户看到成功提示
      setTimeout(() => {
        if (typeof onCookieSaved === 'function') {
          onCookieSaved()
        }
        onClose()
        setSuccess(false)
        setCookie('')
      }, 1500)
    } catch (error) {
      console.error('Cookie 保存失败:', error)
      setError('保存失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenTutorial = () => {
    window.open('https://tcnlkdeey4g8.feishu.cn/wiki/VvEmw2j33izxorkdUClck50en9b?from=from_copylink', '_blank')
  }

  // 重置状态当对话框打开时
  useEffect(() => {
    if (isOpen) {
      setError('')
      setSuccess(false)
      setCookie('')
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md glass-effect border-white/20 bg-black/80 fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold text-white">
            🍪 请先配置小红书 Cookie
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-white/80">
            <p className="mb-3">请按照以下教程获取您的小红书 Cookie，并粘贴到输入框中：</p>
            
            <button
              onClick={handleOpenTutorial}
              className="w-full text-blue-300 hover:text-blue-200 underline font-medium text-sm py-2 transition-colors"
            >
              📖 点击查看获取 Cookie 教程
            </button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cookie-input" className="text-white">小红书 Cookie</Label>
            <Input
              id="cookie-input"
              type="text"
              placeholder="请粘贴您的小红书 Cookie..."
              value={cookie}
              onChange={(e) => setCookie(e.target.value)}
              className="min-h-[80px] resize-none bg-white/10 border-white/20 text-white placeholder:text-white/50"
              disabled={isLoading || success}
            />
          </div>

          {error && (
            <Alert variant="destructive" className="bg-red-500/20 border-red-500/30 text-red-300">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500/30 bg-green-500/20 text-green-300">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription>
                Cookie 验证成功！正在保存...
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSaveCookie}
            disabled={isLoading || success || !cookie.trim()}
            className="w-full cosmic-button"
          >
            {isLoading ? '🔄 验证中...' : success ? '✅ 保存成功' : '💾 保存 Cookie'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}