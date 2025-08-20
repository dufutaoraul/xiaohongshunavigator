'use client'

import { useState } from 'react'
import Button from './Button'
import Input from './Input'

interface AddStudentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddStudentModal({ isOpen, onClose, onSuccess }: AddStudentModalProps) {
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    email: '',
    password: '',
    role: 'student'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.student_id.trim() || !formData.name.trim() || !formData.password.trim()) {
      setError('请填写所有必填字段')
      return
    }

    if (formData.password.length < 6) {
      setError('密码长度至少6位')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // 重置表单
        setFormData({
          student_id: '',
          name: '',
          email: '',
          password: '',
          role: 'student'
        })
        onSuccess()
        onClose()
      } else {
        setError(result.error || '创建学员失败')
      }
    } catch (error) {
      console.error('Create student error:', error)
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({
        student_id: '',
        name: '',
        email: '',
        password: '',
        role: 'student'
      })
      setError('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-lg border border-white/20 rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">👥</div>
          <h2 className="text-2xl font-bold gradient-text mb-2">新增学员</h2>
          <p className="text-white/60 text-sm">
            添加新的学员到系统中
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="学号 *"
            placeholder="例如: AXCF2025040001"
            value={formData.student_id}
            onChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}
            required
            disabled={loading}
          />

          <Input
            label="姓名 *"
            placeholder="请输入学员姓名"
            value={formData.name}
            onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
            required
            disabled={loading}
          />

          <Input
            label="邮箱"
            type="email"
            placeholder="请输入邮箱地址（可选）"
            value={formData.email}
            onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
            disabled={loading}
          />

          <Input
            label="初始密码 *"
            type="password"
            placeholder="请设置初始密码（至少6位）"
            value={formData.password}
            onChange={(value) => setFormData(prev => ({ ...prev, password: value }))}
            required
            disabled={loading}
          />

          <div>
            <label className="block text-white font-medium mb-2">角色</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              disabled={loading}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-purple-400 disabled:opacity-50"
            >
              <option value="student">学员</option>
              <option value="admin">管理员</option>
            </select>
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
              disabled={loading || !formData.student_id.trim() || !formData.name.trim() || !formData.password.trim()}
            >
              {loading ? '创建中...' : '创建学员'}
            </Button>
            
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="w-full px-4 py-3 text-white/70 hover:text-white border border-white/30 hover:border-white/50 rounded-lg transition-all duration-300 disabled:opacity-50"
            >
              取消
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg">
          <h4 className="text-blue-300 font-medium text-sm mb-2">💡 创建提示</h4>
          <ul className="text-blue-200/70 text-xs space-y-1">
            <li>• 学号格式建议：AXCF + 年份 + 月份 + 序号</li>
            <li>• 初始密码将被安全加密存储</li>
            <li>• 建议学员首次登录后修改密码</li>
            <li>• 管理员角色拥有后台管理权限</li>
          </ul>
        </div>
      </div>
    </div>
  )
}