import React, { useState, useCallback, useEffect, useRef } from 'react'
import { getStudentByStudentId, searchStudents, StudentInfo } from '../../lib/database'

interface StudentInputProps {
  label?: string
  placeholder?: string
  value: string
  onChange: (value: string) => void
  onStudentFound?: (student: StudentInfo | null) => void
  required?: boolean
  className?: string
}

export default function StudentInputWithAutocomplete({
  label = '学员学号',
  placeholder = '请输入学号或姓名搜索，如：AXCF2025040088',
  value,
  onChange,
  onStudentFound,
  required = false,
  className = ''
}: StudentInputProps) {
  const [studentName, setStudentName] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [suggestions, setSuggestions] = useState<StudentInfo[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 组件挂载时读取保存的学号
  useEffect(() => {
    try {
      const savedStudentId = localStorage.getItem('rememberedStudentId')
      if (savedStudentId && !value) {
        onChange(savedStudentId)
        // 自动验证保存的学号
        verifyStudentId(savedStudentId)
      }
    } catch (error) {
      console.error('Failed to read saved student ID:', error)
    }
  }, [onChange, value, verifyStudentId])

  // 保存学号到localStorage
  const saveStudentId = (studentId: string) => {
    try {
      localStorage.setItem('rememberedStudentId', studentId)
    } catch (error) {
      console.error('Failed to save student ID:', error)
    }
  }

  // 验证学号（用于自动加载）
  const verifyStudentId = useCallback(async (studentId: string) => {
    setLoading(true)
    setError('')

    try {
      const student = await getStudentByStudentId(studentId)
      
      if (student) {
        setStudentName(student.name)
        setError('')
        onStudentFound?.(student)
      } else {
        setStudentName('')
        setError('学号不存在')
        onStudentFound?.(null)
      }
    } catch (error) {
      console.error('Verification failed:', error)
      setStudentName('')
      setError('查询失败，请重试')
      onStudentFound?.(null)
    } finally {
      setLoading(false)
    }
  }, [onStudentFound])

  // 搜索建议
  const searchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    setSearchLoading(true)
    try {
      const results = await searchStudents(query)
      setSuggestions(results)
      setShowDropdown(results.length > 0)
    } catch (error) {
      console.error('Search error:', error)
      setSuggestions([])
      setShowDropdown(false)
    } finally {
      setSearchLoading(false)
    }
  }, [])

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value.trim()) {
        searchSuggestions(value.trim())
      } else {
        setSuggestions([])
        setShowDropdown(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [value, searchSuggestions])

  // 点击外部关闭下拉框
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleConfirm = useCallback(async (studentId?: string) => {
    const targetId = studentId || value.trim()
    if (!targetId) {
      setStudentName('')
      setError('请输入学号')
      return
    }

    setLoading(true)
    setError('')
    setShowDropdown(false)

    try {
      const student = await getStudentByStudentId(targetId)
      
      if (student) {
        setStudentName(student.name)
        if (onStudentFound) {
          onStudentFound(student)
        }
        // 如果是通过选择获得的，更新输入框值
        if (studentId && studentId !== value) {
          onChange(studentId)
        }
        // 保存学号到本地存储
        saveStudentId(targetId)
      } else {
        setStudentName('')
        setError('未找到该学号对应的学员')
        
        if (targetId.match(/^AXCF\d{10}$/)) {
          setTimeout(() => {
            alert('您的输入有误，请核对后重新输入。如果持续报错，请联系群管理员解决。')
          }, 100)
        }
        
        if (onStudentFound) {
          onStudentFound(null)
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
  }, [value, onStudentFound, onChange])

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
    } else if (e.key === 'ArrowDown' && showDropdown && suggestions.length > 0) {
      e.preventDefault()
      // 可以添加键盘导航功能
    }
  }

  const handleSuggestionClick = (suggestion: StudentInfo) => {
    handleConfirm(suggestion.student_id)
  }

  return (
    <div className={className} ref={dropdownRef}>
      <label className="block text-sm font-semibold text-white mb-2">
        {label} {required && <span className="text-pink-400 ml-1">*</span>}
      </label>
      
      <div className="relative">
        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="flex-1 px-4 py-3 bg-black/20 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => handleConfirm()}
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

        {/* 下拉建议框 */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 border border-white/20 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
            {searchLoading ? (
              <div className="px-4 py-3 text-white/60 text-sm flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white/60 mr-2"></div>
                搜索中...
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((suggestion) => (
                <div
                  key={suggestion.student_id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-4 py-3 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/10 last:border-b-0"
                >
                  <div className="text-white font-medium">{suggestion.student_id}</div>
                  <div className="text-white/80 text-sm">{suggestion.name}</div>
                  {suggestion.persona && (
                    <div className="text-white/60 text-xs mt-1 truncate">{suggestion.persona}</div>
                  )}
                </div>
              ))
            ) : value.length >= 3 ? (
              <div className="px-4 py-3 text-white/60 text-sm">
                没有找到匹配的学员
              </div>
            ) : null}
          </div>
        )}
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
            输入学号后点击&ldquo;确认&rdquo;或按回车键查询
          </div>
        )}
      </div>
    </div>
  )
}