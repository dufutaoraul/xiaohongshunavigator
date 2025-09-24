'use client'

import { useState, useEffect } from 'react'
import Button from './Button'
import Input from './Input'
import { hasXHSProfileBound, parseXHSUrl } from '@/lib/xhs-validator'

interface XHSProfileBindingProps {
  student_id: string
  currentProfileUrl?: string
  onUpdate?: (profileUrl: string) => void
}

export default function XHSProfileBinding({ student_id, currentProfileUrl, onUpdate }: XHSProfileBindingProps) {
  const [profileUrl, setProfileUrl] = useState(currentProfileUrl || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [validationInfo, setValidationInfo] = useState<{
    isValid: boolean
    userId?: string
    error?: string
  }>({ isValid: false })

  // 实时验证小红书主页URL
  useEffect(() => {
    if (!profileUrl.trim()) {
      setValidationInfo({ isValid: false })
      return
    }

    const urlInfo = parseXHSUrl(profileUrl)
    if (!urlInfo.isValidXHSUrl) {
      setValidationInfo({
        isValid: false,
        error: '请输入有效的小红书主页链接'
      })
      return
    }

    if (!urlInfo.userId) {
      setValidationInfo({
        isValid: false,
        error: '无法识别用户ID，请确保是个人主页链接'
      })
      return
    }

    setValidationInfo({
      isValid: true,
      userId: urlInfo.userId
    })
  }, [profileUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validationInfo.isValid) {
      setError('请输入有效的小红书主页链接')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id,
          xiaohongshu_profile_url: profileUrl.trim()
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccess(true)
        onUpdate?.(profileUrl.trim())
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || '绑定失败，请重试')
      }
    } catch (error) {
      console.error('XHS profile binding error:', error)
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleUnbind = async () => {
    if (!confirm('确定要解绑小红书主页吗？解绑后将无法进行主页匹配验证。')) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id,
          xiaohongshu_profile_url: null
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setProfileUrl('')
        setSuccess(true)
        onUpdate?.('')
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || '解绑失败，请重试')
      }
    } catch (error) {
      console.error('XHS profile unbinding error:', error)
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const isBound = hasXHSProfileBound(currentProfileUrl)

  return (
    <div className="glass-effect p-6 rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-2xl">🔗</div>
        <div>
          <h3 className="text-lg font-semibold gradient-text">小红书主页绑定</h3>
          <p className="text-white/60 text-sm">
            绑定后可进行帖子归属验证，提高打卡数据质量
          </p>
        </div>
      </div>

      {isBound && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-400/30 rounded-lg">
          <div className="text-green-300 text-sm font-medium mb-1">✅ 已绑定小红书主页</div>
          <div className="text-green-200 text-xs break-all">
            {currentProfileUrl}
          </div>
          {validationInfo.userId && (
            <div className="text-green-200 text-xs mt-1">
              用户ID: {validationInfo.userId}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label={isBound ? '更新小红书主页链接' : '小红书主页链接'}
            placeholder="https://www.xiaohongshu.com/user/profile/your-user-id"
            value={profileUrl}
            onChange={setProfileUrl}
            disabled={loading}
          />

          {/* 实时验证提示 */}
          {profileUrl.trim() && (
            <div className="mt-2">
              {validationInfo.isValid ? (
                <div className="text-green-400 text-xs">
                  ✅ 有效的小红书主页链接
                  {validationInfo.userId && (
                    <span className="text-green-300 ml-2">
                      用户ID: {validationInfo.userId}
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-red-400 text-xs">
                  ❌ {validationInfo.error}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-xs text-white/50 space-y-1">
          <div>💡 获取主页链接方法：</div>
          <div>1. 打开小红书APP，进入"我"页面</div>
          <div>2. 点击右上角分享按钮</div>
          <div>3. 选择"复制链接"即可获得主页URL</div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-400/30 rounded-lg">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-500/10 border border-green-400/30 rounded-lg">
            <p className="text-green-300 text-sm">
              {isBound ? '主页链接更新成功！' : '主页绑定成功！'}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading || !validationInfo.isValid}
            className="flex-1"
          >
            {loading ? '处理中...' : (isBound ? '更新绑定' : '绑定主页')}
          </Button>

          {isBound && (
            <Button
              type="button"
              onClick={handleUnbind}
              disabled={loading}
              className="px-6 py-3 text-white/70 hover:text-white border border-white/30 hover:border-white/50 rounded-lg transition-all duration-300 disabled:opacity-50"
            >
              解绑
            </Button>
          )}
        </div>
      </form>

      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
        <h4 className="text-blue-300 font-medium text-sm mb-2">📋 绑定说明</h4>
        <ul className="text-blue-200/70 text-xs space-y-1">
          <li>• 绑定后系统将验证提交的帖子是否来自你的主页</li>
          <li>• 可以有效防止重复提交和错误提交</li>
          <li>• 不绑定也可正常打卡，但验证程度有限</li>
          <li>• 主页链接信息仅用于验证，不会公开显示</li>
        </ul>
      </div>
    </div>
  )
}