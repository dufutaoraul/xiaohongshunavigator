'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card from '../components/Card'
import Textarea from '../components/Textarea'
import Button from '../components/Button'
import StudentInputWithAutocomplete from '../components/StudentInputWithAutocomplete'
import LoginModal from '../components/LoginModal'
import PasswordChangeModal from '../components/PasswordChangeModal'
import GlobalUserMenu from '../components/GlobalUserMenu'
import { StudentInfo, upsertStudent } from '../../lib/database'

interface UserProfile {
  student_id: string
  name: string
  real_name: string
  persona: string
  keywords: string
  vision: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [studentId, setStudentId] = useState('')
  const [profile, setProfile] = useState<UserProfile>({
    student_id: '',
    name: '',
    real_name: '',
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

  // 页面加载时检查登录状态和编辑模式
  useEffect(() => {
    checkAuthStatus()
    checkEditMode()
  }, [])

  // 检查是否是编辑模式
  const checkEditMode = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const isEdit = urlParams.get('edit') === 'true'
    const editStudentId = urlParams.get('student_id')
    const editName = urlParams.get('name')
    const editRealName = urlParams.get('real_name')

    if (isEdit && editStudentId) {
      // 编辑模式：预填学员信息
      setStudentId(editStudentId)
      setProfile({
        student_id: editStudentId,
        name: decodeURIComponent(editName || ''),
        real_name: decodeURIComponent(editRealName || ''),
        persona: '',
        keywords: '',
        vision: ''
      })
      setIsExistingUser(true)
      setIsAuthenticated(true)

      // 加载完整的学员信息
      loadStudentProfile(editStudentId)
    }
  }

  // 加载学员完整信息（用于编辑模式）
  const loadStudentProfile = async (studentId: string) => {
    try {
      const response = await fetch(`/api/user?student_id=${studentId}`)
      if (response.ok) {
        const userData = await response.json()
        if (userData) {
          setProfile({
            student_id: userData.student_id,
            name: userData.name || '',
            real_name: userData.real_name || '',
            persona: userData.persona || '',
            keywords: userData.keywords || '',
            vision: userData.vision || ''
          })
        }
      }
    } catch (error) {
      console.error('加载学员信息失败:', error)
    }
  }

  const checkAuthStatus = async () => {
    try {
      const userSession = localStorage.getItem('userSession')
      const lastCredentials = localStorage.getItem('lastCredentials')
      
      if (userSession) {
        try {
          const { student_id, name, isAuthenticated } = JSON.parse(userSession)
          if (isAuthenticated && student_id) {
            // 检查是否有保存的凭证，需要设置当前密码
            if (lastCredentials) {
              try {
                const { password } = JSON.parse(lastCredentials)
                setCurrentPassword(password)
              } catch {
                // 如果无法获取密码，回退到登录流程
                setShowLoginModal(true)
                return
              }
            } else {
              // 没有凭证信息，需要重新登录
              setShowLoginModal(true)
              return
            }
            
            setIsAuthenticated(true)
            setStudentId(student_id)
            // 先设置基本信息
            setProfile(prev => ({
              ...prev,
              student_id: student_id,
              name: name || ''
            }))
            // 然后加载完整的用户信息
            await loadUserProfile(student_id)
            return
          }
        } catch {
          // 忽略解析错误
        }
      }
      
      // 如果有保存的凭证，尝试自动登录
      if (lastCredentials) {
        try {
          const { student_id, password } = JSON.parse(lastCredentials)
          const loginSuccess = await handleLogin(student_id, password)
          if (!loginSuccess) {
            setShowLoginModal(true)
          }
        } catch {
          setShowLoginModal(true)
        }
      } else {
        setShowLoginModal(true)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      setShowLoginModal(true)
    }
  }

  // 加载用户完整信息的独立函数
  const loadUserProfile = async (studentId: string) => {
    try {
      const response = await fetch(`/api/user?student_id=${studentId}`)
      if (response.ok) {
        const userData = await response.json()
        if (userData) {
          setProfile(prev => ({
            ...prev,
            student_id: userData.student_id,
            name: userData.name || prev.name,
            real_name: userData.real_name || '',
            persona: userData.persona || '',
            keywords: userData.keywords || '',
            vision: userData.vision || ''
          }))
          
          // 判断是否为老用户（有内容）
          const hasContent = Boolean(userData.persona || userData.keywords || userData.vision)
          setIsExistingUser(hasContent)
        }
      }
    } catch (error) {
      console.error('Failed to load user profile:', error)
    }
  }

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
        
        // 保存凭证信息（不保存认证状态）
        localStorage.setItem('lastCredentials', JSON.stringify({
          student_id: inputStudentId,
          password: password
        }))
        
        // 保存用户会话信息
        localStorage.setItem('userSession', JSON.stringify({
          student_id: inputStudentId,
          name: result.user.name,
          role: result.user.role || 'student',
          isAuthenticated: true
        }))
        
        // 填充用户信息
        setProfile({
          student_id: inputStudentId,
          name: result.user.name || '',
          real_name: result.user.real_name || '',
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
        
        // 更新本地保存的凭证信息
        localStorage.setItem('lastCredentials', JSON.stringify({
          student_id: profile.student_id,
          password: newPassword
        }))
        
        return true
      } else {
        console.error('Password change failed:', result.error || 'Unknown error')
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
        real_name: student.real_name || '',
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
        real_name: '',
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

    if (!profile.real_name.trim()) {
      setMessage('请填写真实姓名（用于后续生成证书）')
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
        
        // 更新localStorage中的会话信息
        const userSession = localStorage.getItem('userSession')
        if (userSession) {
          try {
            const sessionData = JSON.parse(userSession)
            localStorage.setItem('userSession', JSON.stringify({
              ...sessionData,
              name: profile.name
            }))
          } catch (error) {
            console.error('Error updating session:', error)
          }
        }
        
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

  const handleGoToGenerate = () => {
    // 保存当前认证状态并跳转到生成页面
    localStorage.setItem('userSession', JSON.stringify({
      student_id: profile.student_id,
      name: profile.name,
      role: 'student', // 默认为学员
      isAuthenticated: true
    }))
    router.push('/generate')
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
          onClose={() => {
            setShowLoginModal(false)
            router.push('/')
          }}
          onLogin={handleLogin}
          loading={authLoading}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* 全局用户菜单 - 左上角 */}
      <GlobalUserMenu className="absolute top-6 left-6 z-50" />

      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-12 text-center fade-in-up">
        <h1 className="text-4xl font-bold gradient-text mb-6">🧑‍💼 个人IP资料库</h1>
        <p className="text-xl text-white/80">
          设定你的个人IP定位，这将成为AI为你生成内容的宇宙基因 ✨
        </p>
      </div>

      <Card title="学员信息" icon="👤" className="mb-8">
        <div className="space-y-6">


          {/* 显示已登录的学员信息 */}
          <div className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">👋</span>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    欢迎{profile.name || '学员'}
                  </h3>
                  <p className="text-blue-300 text-sm">
                    您的学号是：{profile.student_id}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-3 py-1 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 hover:text-purple-200 rounded-full text-xs transition-all duration-300"
                >
                  🔑 修改密码
                </button>
              </div>
            </div>
            
            <div className="text-xs text-white/50">
              已通过身份验证，可以编辑个人IP设定
            </div>
          </div>
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

      <Card title="基本信息" icon="📝" className="mb-8">
        <div className="space-y-6">
          <Textarea
            label="真实姓名 *"
            placeholder="请输入您的真实姓名"
            value={profile.real_name}
            onChange={(value) => setProfile({ ...profile, real_name: value })}
            required
            rows={1}
          />
          <div className="text-sm text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <span className="font-medium">📋 说明：</span>
            真实姓名用于后续生成证书。
          </div>
        </div>
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

          <div className="pt-4 space-y-4">
            <Button
              onClick={handleSave}
              disabled={loading || !profile.name || !profile.real_name.trim()}
              className="w-full sm:w-auto"
            >
              {getButtonText()}
            </Button>
            
            {/* AI生成模板按钮 - 仅在用户有基本信息时显示 */}
            {profile.persona && profile.keywords && profile.vision && (
              <Button 
                onClick={handleGoToGenerate}
                disabled={loading}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 ml-0 sm:ml-4"
              >
                ✨ AI生成模板
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="mt-8" title="使用提示" icon="💡">
        <div className="text-sm text-white/70 space-y-3">
          <p>• <strong className="text-white">人设定位</strong>：要具体明确，体现你的专业背景和独特性，这是AI生成内容的核心基础</p>
          <p>• <strong className="text-white">内容关键词</strong>：选择你最擅长和最感兴趣的3个领域，保持垂直度和专业性</p>
          <p>• <strong className="text-white">90天愿景</strong>：设定具体可量化的目标，有助于AI为你制定个性化内容策略</p>
          <p>• <strong className="text-white">保存设定</strong>：信息保存后，AI将根据你的IP设定生成专属内容</p>
        </div>
      </Card>
      
      {/* 密码修改模态框 */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onChangePassword={handlePasswordChange}
        studentId={profile.student_id}
        currentPassword={currentPassword}
        loading={authLoading}
      />
      </div>
    </div>
  )
}