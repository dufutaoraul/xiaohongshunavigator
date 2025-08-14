import { useState, useEffect } from 'react'
import Button from './Button'
import Input from './Input'

interface XiaohongshuProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: (url: string) => Promise<boolean>
  currentUrl?: string
  loading?: boolean
}

export default function XiaohongshuProfileModal({ 
  isOpen, 
  onClose, 
  onUpdate, 
  currentUrl = '',
  loading = false 
}: XiaohongshuProfileModalProps) {
  const [profileUrl, setProfileUrl] = useState('')
  const [error, setError] = useState('')

  // 当模态框打开时，填充当前URL
  useEffect(() => {
    if (isOpen) {
      setProfileUrl(currentUrl || '')
      setError('')
    }
  }, [isOpen, currentUrl])

  const validateXiaohongshuUrl = (url: string): boolean => {
    if (!url.trim()) return false
    
    // 小红书链接格式验证
    const xiaohongshuRegex = /^https?:\/\/(www\.)?xiaohongshu\.com\/user\/profile\/[a-zA-Z0-9]+(\?.*)?$/
    return xiaohongshuRegex.test(url.trim())
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedUrl = profileUrl.trim()

    if (!trimmedUrl) {
      setError('请输入小红书主页链接')
      return
    }

    if (!validateXiaohongshuUrl(trimmedUrl)) {
      setError('请输入有效的小红书主页链接格式，如：https://www.xiaohongshu.com/user/profile/xxxxxx')
      return
    }

    setError('')
    const success = await onUpdate(trimmedUrl)
    if (!success) {
      setError('更新失败，请重试')
    } else {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-lg w-full shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🔗</div>
          <h2 className="text-2xl font-bold gradient-text mb-2">请绑定您的小红书主页</h2>
          <p className="text-white/60 text-sm">
            绑定后可以更好地为您生成个性化内容
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="小红书主页链接"
            placeholder="请粘贴您的小红书个人主页链接"
            value={profileUrl}
            onChange={setProfileUrl}
            required
            disabled={loading}
          />

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-400/30 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
            <h4 className="text-blue-300 font-medium text-sm mb-2">💡 如何获取小红书主页链接</h4>
            <ul className="text-blue-200/70 text-xs space-y-1">
              <li>• 打开小红书App或网页版</li>
              <li>• 进入个人主页</li>
              <li>• 点击右上角分享按钮</li>
              <li>• 选择"复制链接"即可获得</li>
            </ul>
          </div>

          <div className="pt-4 space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !profileUrl.trim()}
            >
              {loading ? '更新中...' : (currentUrl ? '更新链接' : '绑定链接')}
            </Button>
            
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full px-4 py-3 text-white/70 hover:text-white border border-white/30 hover:border-white/50 rounded-lg transition-all duration-300 disabled:opacity-50"
            >
              {currentUrl ? '取消修改' : '稍后绑定'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}