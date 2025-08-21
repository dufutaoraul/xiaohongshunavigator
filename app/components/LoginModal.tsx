import { useState, useEffect } from 'react'
import Button from './Button'
import Input from './Input'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (studentId: string, password: string) => Promise<boolean>
  loading?: boolean
}

export default function LoginModal({ isOpen, onClose, onLogin, loading = false }: LoginModalProps) {
  const [studentId, setStudentId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // 当模态框打开时，尝试加载上次的凭证
  useEffect(() => {
    if (isOpen) {
      const lastCredentials = localStorage.getItem('lastCredentials')
      if (lastCredentials) {
        try {
          const { student_id, password: lastPassword } = JSON.parse(lastCredentials)
          setStudentId(student_id || '')
          setPassword(lastPassword || '')
        } catch {
          // 忽略解析错误
        }
      }
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId.trim() || !password.trim()) {
      setError('请输入学号和密码')
      return
    }

    setError('')
    const success = await onLogin(studentId.trim(), password.trim())
    if (!success) {
      setError('学号或密码错误，请重试')
    } else {
      setError('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold gradient-text mb-2">学员身份验证</h2>
          <p className="text-white/60 text-sm">
            首次访问需要验证学员身份
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="学号"
            placeholder="例如: AXCF2025040001"
            value={studentId}
            onChange={setStudentId}
            required
            disabled={loading}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80">
              密码 <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="请输入密码（初始密码与学号相同）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-3 pr-12 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all duration-300 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80 transition-colors"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeIcon className="w-5 h-5" />
                ) : (
                  <EyeSlashIcon className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-400/30 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="pt-4 space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !studentId.trim() || !password.trim()}
            >
              {loading ? '验证中...' : '登录'}
            </Button>
            
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full px-4 py-3 text-white/70 hover:text-white border border-white/30 hover:border-white/50 rounded-lg transition-all duration-300 disabled:opacity-50"
            >
              取消
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
          <h4 className="text-blue-300 font-medium text-sm mb-2">💡 温馨提示</h4>
          <ul className="text-blue-200/70 text-xs space-y-1">
            <li>• 初始密码默认与学号相同</li>
            <li>• 首次登录后建议修改密码</li>
            <li>• 如忘记密码请联系管理员</li>
          </ul>
        </div>
      </div>
    </div>
  )
}