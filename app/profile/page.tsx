'use client'

import { useState, useCallback, useEffect } from 'react'
import Card from '../components/Card'
import Textarea from '../components/Textarea'
import Button from '../components/Button'
import StudentInputWithAutocomplete from '../components/StudentInputWithAutocomplete'
import LoginModal from '../components/LoginModal'
import PasswordChangeModal from '../components/PasswordChangeModal'
import { StudentInfo, upsertStudent } from '../../lib/database'

interface UserProfile {
  student_id: string
  name: string
  persona: string
  keywords: string
  vision: string
}

export default function ProfilePage() {
  const [studentId, setStudentId] = useState('')
  const [profile, setProfile] = useState<UserProfile>({
    student_id: '',
    name: '',
    persona: '',
    keywords: '',
    vision: ''
  })
  const [isExistingUser, setIsExistingUser] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  // 认证相关状态
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')

  // 页面加载时检查认证状态
  useEffect(() => {
    const authData = localStorage.getItem('userAuth')
    if (authData) {
      try {
        const { student_id, isAuthenticated: authenticated } = JSON.parse(authData)
        if (authenticated) {
          setIsAuthenticated(true)
          setStudentId(student_id)
        } else {
          setShowLoginModal(true)
        }
      } catch {
        setShowLoginModal(true)
      }
    } else {
      setShowLoginModal(true)
    }
  }, [])

  // 登录处理
  const handleLogin = async (inputStudentId: string, password: string): Promise<boolean> => {
    setAuthLoading(true)
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          student_id: inputStudentId,
          password: password
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // 登录成功
        setIsAuthenticated(true)
        setStudentId(inputStudentId)
        setCurrentPassword(password)
        setShowLoginModal(false)
        
        // 保存认证信息到localStorage
        localStorage.setItem('userAuth', JSON.stringify({
          student_id: inputStudentId,
          isAuthenticated: true
        }))
        
        // 填充用户信息
        setProfile({
          student_id: inputStudentId,
          name: '',
          persona: result.user.persona || '',
          keywords: result.user.keywords || '',
          vision: result.user.vision || ''
        })
        
        const hasContent = Boolean(result.user.persona || result.user.keywords || result.user.vision)
        setIsExistingUser(hasContent)
        
        // 如果需要修改密码，显示密码修改提示
        if (result.needsPasswordChange) {
          setTimeout(() => setShowPasswordModal(true), 500)
        }
        
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error('Login error:', error)
      return false
    } finally {
      setAuthLoading(false)
    }
  }

  // 密码修改处理
  const handlePasswordChange = async (newPassword: string): Promise<boolean> => {
    setAuthLoading(true)
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change_password',
          student_id: profile.student_id,
          password: currentPassword,
          new_password: newPassword
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setCurrentPassword(newPassword)
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error('Password change error:', error)
      return false
    } finally {
      setAuthLoading(false)
    }
  }

  const handleStudentFound = useCallback((student: StudentInfo | null) => {
    if (student) {
      // 找到学员，填充数据
      setProfile({
        student_id: student.student_id,
        name: student.name,
        persona: student.persona || '',
        keywords: student.keywords || '',
        vision: student.vision || ''
      })
      
      // 判断是否为老用户（有内容）
      const hasContent = Boolean(student.persona || student.keywords || student.vision)
      setIsExistingUser(hasContent)
    } else {
      // 没找到学员，清空profile（保留学号）
      setProfile({
        student_id: studentId,
        name: '',
        persona: '',
        keywords: '',
        vision: ''
      })
      setIsExistingUser(false)
    }
  }, [studentId])

  const handleSave = async () => {
    if (!profile.student_id.trim()) {
      setMessage('请输入学员学号')
      return
    }

    if (!profile.name.trim()) {
      setMessage('请先输入正确的学号以获取姓名信息')
      return
    }

    if (!profile.persona.trim() || !profile.keywords.trim() || !profile.vision.trim()) {
      setMessage('请填写所有必填项')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const success = await upsertStudent(profile)
      
      if (success) {
        setMessage('保存成功！')
        setIsExistingUser(true) // 保存成功后变为老用户
        
        // 3秒后清除消息
        setTimeout(() => {
          setMessage('')
        }, 3000)
      } else {
        setMessage('保存失败，请稍后重试')
      }
    } catch (error) {
      setMessage('网络错误，请检查连接')
      console.error('Save error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getButtonText = () => {
    if (loading) return '保存中...'
    return isExistingUser ? '保存设置' : '保存设定'
  }

  // 如果未认证，显示加载状态
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔐</div>
          <p className="text-white/80">正在验证身份...</p>
        </div>
        
        {/* 登录模态框 */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={handleLogin}
          loading={authLoading}
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-12 text-center fade-in-up">
        <h1 className="text-4xl font-bold gradient-text mb-6">🧑‍💼 个人IP资料库</h1>
        <p className="text-xl text-white/80">
          设定你的个人IP定位，这将成为AI为你生成内容的宇宙基因 ✨
        </p>
      </div>

      <Card title="学员信息" icon="👤" className="mb-8">
        <div className="space-y-6">
          <StudentInputWithAutocomplete
            value={studentId}
            onChange={setStudentId}
            onStudentFound={handleStudentFound}
            required
          />
          
          {profile.name && (
            <div className="p-4 bg-green-500/10 border border-green-400/30 rounded-lg">
              <div className="flex items-center text-green-400 text-sm">
                <span className="mr-2">👋</span>
                欢迎，{profile.name}！
                {isExistingUser && <span className="ml-2 text-blue-400">（老用户）</span>}
                {!isExistingUser && profile.student_id && <span className="ml-2 text-yellow-400">（新用户）</span>}
              </div>
            </div>
          )}
        </div>

        {message && (
          <div className={`mt-4 p-4 rounded-lg glass-effect border-l-4 ${
            message.includes('成功') 
              ? 'border-green-400 text-green-200' 
              : 'border-red-400 text-red-200'
          }`}>
            {message}
          </div>
        )}
      </Card>

      <Card title="个人IP设定" icon="⚙️">
        <div className="space-y-6">
          <Textarea
            label="个人人设定位"
            placeholder="用一句话描述你的专业身份和特色，例如：专注AI变现的90后宝妈创业者"
            value={profile.persona}
            onChange={(value) => setProfile({ ...profile, persona: value })}
            required
            rows={2}
          />

          <Textarea
            label="内容关键词"
            placeholder="输入3个主要内容方向，用逗号分隔，例如：AI工具使用,副业赚钱,时间管理"
            value={profile.keywords}
            onChange={(value) => setProfile({ ...profile, keywords: value })}
            required
            rows={2}
          />

          <Textarea
            label="90天后愿景"
            placeholder="描述你希望90天后在小红书上达成的目标，例如：成为AI变现领域的KOL，粉丝过万，月收入过万"
            value={profile.vision}
            onChange={(value) => setProfile({ ...profile, vision: value })}
            required
            rows={3}
          />

          <div className="pt-4">
            <Button 
              onClick={handleSave} 
              disabled={loading || !profile.name}
              className="w-full sm:w-auto"
            >
              {getButtonText()}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="mt-8" title="使用提示" icon="💡">
        <div className="text-sm text-white/70 space-y-3">
          <p>• <strong className="text-white">学员学号</strong>：请输入你的课程学号，系统会自动关联你的姓名信息</p>
          <p>• <strong className="text-white">人设定位</strong>：要具体明确，体现你的专业背景和独特性</p>
          <p>• <strong className="text-white">内容关键词</strong>：选择你最擅长和最感兴趣的领域，保持垂直度</p>
          <p>• <strong className="text-white">90天愿景</strong>：设定具体可量化的目标，有助于AI为你制定内容策略</p>
        </div>
      </Card>
      
      {/* 密码修改模态框 */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onChangePassword={handlePasswordChange}
        studentId={profile.student_id}
        loading={authLoading}
      />
    </div>
  )
}