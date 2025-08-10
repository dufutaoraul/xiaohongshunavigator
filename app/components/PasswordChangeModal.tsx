import { useState } from 'react'
import Button from './Button'
import Input from './Input'

interface PasswordChangeModalProps {
  isOpen: boolean
  onClose: () => void
  onChangePassword: (newPassword: string) => Promise<boolean>
  studentId: string
  currentPassword: string
  loading?: boolean
}

export default function PasswordChangeModal({ 
  isOpen, 
  onClose, 
  onChangePassword, 
  studentId, 
  currentPassword,
  loading = false 
}: PasswordChangeModalProps) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  // 检查当前密码是否与学号相同
  const isPasswordSameAsStudentId = currentPassword === studentId

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 密码验证
    if (!newPassword.trim()) {
      setError('请输入新密码')
      return
    }

    if (newPassword.length < 6) {
      setError('密码长度至少6位')
      return
    }

    if (newPassword === studentId) {
      setError('新密码不能与学号相同')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    const success = await onChangePassword(newPassword.trim())
    if (success) {
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setNewPassword('')
        setConfirmPassword('')
        onClose()
      }, 2000)
    } else {
      setError('密码修改失败，请重试')
    }
  }

  const handleSkip = () => {
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">{isPasswordSameAsStudentId ? '🔒' : '🔑'}</div>
          <h2 className="text-2xl font-bold gradient-text mb-2">
            {isPasswordSameAsStudentId ? '安全提醒' : '修改密码'}
          </h2>
          <p className="text-white/60 text-sm">
            {isPasswordSameAsStudentId 
              ? '检测到您的密码仍是初始密码，建议立即修改以保障账户安全'
              : '请输入新密码来更新您的账户密码'
            }
          </p>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-bold text-green-300 mb-2">密码修改成功！</h3>
            <p className="text-white/60 text-sm">新密码已保存，正在返回...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {isPasswordSameAsStudentId && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  ⚠️ 当前密码: <span className="font-mono">{studentId}</span>（与学号相同）
                </p>
              </div>
            )}

            <Input
              label="新密码"
              type="password"
              placeholder="请输入新密码（至少6位）"
              value={newPassword}
              onChange={setNewPassword}
              required
              disabled={loading}
            />

            <Input
              label="确认新密码"
              type="password"
              placeholder="请再次输入新密码"
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
              disabled={loading}
            />

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-400/30 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            <div className="pt-4 grid grid-cols-2 gap-4">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700" 
                disabled={loading || !newPassword.trim() || !confirmPassword.trim()}
              >
                {loading ? '修改中...' : '立即修改'}
              </Button>
              
              <button
                type="button"
                onClick={handleSkip}
                disabled={loading}
                className="w-full px-4 py-3 text-white/70 hover:text-white border border-white/30 hover:border-white/50 rounded-lg transition-all duration-300 disabled:opacity-50"
              >
                暂不修改
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
          <h4 className="text-blue-300 font-medium text-sm mb-2">🛡️ 密码安全建议</h4>
          <ul className="text-blue-200/70 text-xs space-y-1">
            <li>• 密码长度至少6位字符</li>
            <li>• 不要使用学号作为密码</li>
            <li>• 建议包含字母、数字组合</li>
            <li>• 定期更新密码保障安全</li>
          </ul>
        </div>
      </div>
    </div>
  )
}