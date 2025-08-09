import React, { useState, useCallback } from 'react'
import { getStudentByStudentId, StudentInfo, sampleStudents } from '../../lib/database'

interface StudentInputProps {
  label?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onStudentFound?: (student: StudentInfo | null) => void
  required?: boolean
  className?: string
}

export default function StudentInput({
  label = '学员学号',
  placeholder = '请输入学号，如：AXCF2025040088',
  value,
  onChange,
  onStudentFound,
  required = false,
  className = ''
}: StudentInputProps) {
  const [studentName, setStudentName] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const handleConfirm = useCallback(async () => {
    if (!value.trim()) {
      setStudentName('')
      setError('请输入学号')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 先从示例数据中查找（模拟数据库查询）
      const sampleStudent = sampleStudents.find(s => s.student_id === value.trim())
      
      if (sampleStudent) {
        setStudentName(sampleStudent.name)
        if (onStudentFound) {
          onStudentFound(sampleStudent)
        }
      } else {
        // 如果示例数据中没有，尝试从数据库查询
        const student = await getStudentByStudentId(value.trim())
        
        if (student) {
          setStudentName(student.name)
          if (onStudentFound) {
            onStudentFound(student)
          }
        } else {
          setStudentName('')
          setError('未找到该学号对应的学员')
          
          // 如果学号格式正确但找不到，显示错误提示
          if (value.trim().match(/^AXCF\d{10}$/)) {
            setTimeout(() => {
              alert('您的输入有误，请核对后重新输入。如果持续报错，请联系群管理员解决。')
            }, 100)
          }
          
          if (onStudentFound) {
            onStudentFound(null)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching student:', error)
      setError('查询失败，请稍后重试')
      setStudentName('')
      if (onStudentFound) {
        onStudentFound(null)
      }
    } finally {
      setLoading(false)
    }
  }, [value, onStudentFound])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    
    // 清除之前的状态
    if (newValue !== value) {
      setStudentName('')
      setError('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirm()
    }
  }

  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-white mb-2">
        {label} {required && <span className="text-pink-400 ml-1">*</span>}
      </label>
      
      <div className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 bg-black/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
        />
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading || !value.trim()}
          className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 whitespace-nowrap ${
            loading || !value.trim()
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
          }`}
        >
          {loading ? '查询中...' : '确认'}
        </button>
      </div>
      
      {/* 姓名显示区域 */}
      <div className="mt-3 min-h-[24px]">
        {loading && (
          <div className="flex items-center text-white/60 text-sm">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white/60 mr-2"></div>
            正在查询学员信息...
          </div>
        )}
        
        {!loading && studentName && (
          <div className="text-green-400 text-sm flex items-center">
            <span className="mr-1">✓</span>
            学员姓名：{studentName}
          </div>
        )}
        
        {!loading && error && (
          <div className="text-red-400 text-sm flex items-center">
            <span className="mr-1">✗</span>
            {error}
          </div>
        )}
        
        {!loading && !studentName && !error && value.trim() && (
          <div className="text-white/50 text-sm flex items-center">
            <span className="mr-1">💡</span>
            输入学号后点击"确认"或按回车键查询
          </div>
        )}
      </div>
    </div>
  )
}