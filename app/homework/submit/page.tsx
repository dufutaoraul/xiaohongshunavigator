'use client';

// 🔍 部署版本验证标记 - 请检查浏览器控制台
console.log("🚀 DEPLOY VERSION: 0a2bec8 - Submit page loaded");

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Assignment, Student } from '@/types/homework';
import { 
  getUniqueDayTexts, 
  getAssignmentsByDayText, 
  getDayTextFromAssignment,
  calculateTotalFileSize,
  isFileSizeOverLimit
} from '@/utils/homework-utils';
import LoginModal from '@/app/components/LoginModal';

export default function SubmitAssignmentPage() {
  const { user, login } = useAuth();
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [selectedDayText, setSelectedDayText] = useState('');
  const [assignmentId, setAssignmentId] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState('');
  const [gradingResult, setGradingResult] = useState<{status: string, feedback: string} | null>(null);
  const [showResult, setShowResult] = useState(false);
  
  // 登录相关状态
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  
  // 学号自动补全相关状态
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  // 加载所有学生数据
  const loadAllStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('student_id, name')
        .order('student_id');
      
      if (data && !error) {
        setAllStudents(data);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  // 加载可用天数
  const loadAvailableDays = async () => {
    try {
      const uniqueDayTexts = getUniqueDayTexts();
      setAvailableDays(uniqueDayTexts);
    } catch (error) {
      console.error('Error loading available days:', error);
    }
  };

  // 检测submissions表的schema结构
  const checkSubmissionsSchema = async () => {
    try {
      console.log('🔍 检测submissions表schema...');
      
      // 尝试查询表结构
      const { data, error } = await supabase
        .rpc('get_table_columns', { table_name: 'submissions' })
        .single();
        
      if (error) {
        console.warn('无法通过RPC获取schema，尝试其他方法:', error);
        
        // 备用方法：尝试查询一条记录看字段
        const { data: sampleData, error: sampleError } = await supabase
          .from('submissions')
          .select('*')
          .limit(1);
          
        if (!sampleError && sampleData) {
          const availableFields = sampleData.length > 0 ? Object.keys(sampleData[0]) : [];
          console.log('📋 检测到的字段:', availableFields);
          return availableFields;
        }
      } else {
        console.log('📋 RPC返回的schema:', data);
        return data;
      }
      
      return [];
    } catch (error) {
      console.error('Schema检测失败:', error);
      return [];
    }
  };

  // 初始化用户信息
  useEffect(() => {
    console.log('初始化用户信息，user:', user);
    
    let userFound = false;
    
    // 优先使用AuthContext中的用户信息
    if (user && user.student_id) {
      console.log('使用AuthContext用户信息:', user.student_id, user.name);
      setStudentId(user.student_id);
      setStudentName(user.name || '');
      userFound = true;
    }
    
    // 如果AuthContext没有用户信息，尝试从localStorage获取
    if (!userFound) {
      try {
        const userSession = localStorage.getItem('userSession');
        console.log('从localStorage获取用户信息:', userSession);
        
        if (userSession) {
          const sessionData = JSON.parse(userSession);
          console.log('解析的sessionData:', sessionData);
          
          if (sessionData.user && sessionData.user.student_id) {
            console.log('设置localStorage中的用户信息:', sessionData.user.student_id, sessionData.user.name);
            setStudentId(sessionData.user.student_id);
            setStudentName(sessionData.user.name || '');
            userFound = true;
          }
        }
      } catch (error) {
        console.error('Error parsing user session:', error);
      }
    }
    
    // 如果还是没有找到用户信息，检查lastCredentials并自动登录
    if (!userFound) {
      try {
        const lastCredentials = localStorage.getItem('lastCredentials');
        if (lastCredentials) {
          const credentials = JSON.parse(lastCredentials);
          console.log('发现保存的凭证，尝试自动登录:', credentials.student_id);
          
          // 自动登录
          handleLogin(credentials.student_id, credentials.password);
        }
      } catch (error) {
        console.error('Error with auto-login:', error);
      }
    }
    
    loadAllStudents();
    loadAvailableDays();
    
    // 检测数据库schema
    checkSubmissionsSchema();
  }, [user]);

  // 学号输入变化处理
  const handleStudentIdInput = (value: string) => {
    setStudentId(value);
    
    if (value.length > 0) {
      const filtered = allStudents.filter(student => 
        student.student_id.toLowerCase().includes(value.toLowerCase()) ||
        (student.name && student.name.toLowerCase().includes(value.toLowerCase()))
      );
      setFilteredStudents(filtered);
      setShowStudentDropdown(filtered.length > 0);
      
      const exactMatch = allStudents.find(student => student.student_id === value);
      if (exactMatch) {
        setStudentName(exactMatch.name || '');
        setShowStudentDropdown(false);
      } else {
        setStudentName('');
      }
    } else {
      setStudentName('');
      setShowStudentDropdown(false);
      setFilteredStudents([]);
    }
  };

  // 选择学生
  const selectStudent = (student: Student) => {
    setStudentId(student.student_id);
    setStudentName(student.name || '');
    setShowStudentDropdown(false);
  };

  // 登录处理
  const handleLogin = async (studentId: string, password: string): Promise<boolean> => {
    setAuthLoading(true);
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          student_id: studentId,
          password: password
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // 使用AuthContext的login方法
        login(result.user);
        
        // 保存凭证用于自动登录
        localStorage.setItem('lastCredentials', JSON.stringify({
          student_id: studentId,
          password: password
        }));
        
        setShowLoginModal(false);
        // 重新加载用户信息
        setStudentId(result.user.student_id);
        setStudentName(result.user.name || '');
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  // 根据选择的天数查询作业列表
  const handleDayTextChange = async (dayText: string) => {
    setSelectedDayText(dayText);
    setAssignmentId('');
    setSelectedAssignment(null);
    
    if (dayText) {
      try {
        console.log('查询作业，天数:', dayText);
        
        // 先尝试从数据库查询
        const { data, error } = await supabase
          .from('assignments')
          .select('*')
          .eq('day_text', dayText)
          .order('assignment_title');
        
        if (error) {
          console.error('数据库查询错误:', error);
          setAssignments([]);
        } else if (data && data.length > 0) {
          setAssignments(data);
          console.log('数据库查询成功:', data);
        } else {
          console.log('数据库无数据');
          setAssignments([]);
        }
      } catch (error) {
        console.error('Error fetching assignments:', error);
        setAssignments([]);
      }
    } else {
      setAssignments([]);
    }
  };

  // 根据作业ID显示作业详情
  const handleAssignmentChange = (id: string) => {
    setAssignmentId(id);
    const assignment = assignments.find(a => a.assignment_id === id);
    setSelectedAssignment(assignment || null);
  };

  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setMessage('');
      setGradingResult(null);
      setShowResult(false);
    }
  };

  // 提交作业
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 确保使用正确的学号
    const currentStudentId = studentId || user?.student_id;
    const currentStudentName = studentName || user?.name;
    
    console.log('提交时的学号信息:', { currentStudentId, currentStudentName, studentId, user });
    
    if (!currentStudentId || !assignmentId || files.length === 0) {
      setMessage('请填写所有必填字段并上传至少一个文件');
      return;
    }

    if (isFileSizeOverLimit(files)) {
      setMessage(`文件总大小超过6MB限制（当前${calculateTotalFileSize(files).toFixed(2)}MB），请压缩后重新上传`);
      return;
    }

    setLoading(true);
    setMessage('');
    setGradingResult(null);
    setShowResult(false);

    try {
      console.log('开始提交作业:', { currentStudentId, assignmentId, fileCount: files.length });
      
      // 调试环境变量配置
      console.log('Supabase配置检查:', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '已配置' : '未配置',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '已配置' : '未配置'
      });
      
      // 真实文件上传到腾讯云COS
      console.log('📤 开始上传文件...');
      let attachmentUrls: string[] = [];
      
      if (files.length > 0) {
        try {
          const formData = new FormData();
          
          // 添加所有文件到FormData
          files.forEach(file => {
            formData.append('files', file);
          });
          formData.append('studentId', currentStudentId);
          
          console.log(`📁 准备上传 ${files.length} 个文件`);
          
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          
          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.error || '文件上传失败');
          }
          
          const uploadResult = await uploadResponse.json();
          attachmentUrls = uploadResult.urls;
          
          console.log(`✅ 文件上传成功，共 ${attachmentUrls.length} 个URL:`, attachmentUrls);
          
        } catch (uploadError) {
          console.error('❌ 文件上传失败:', uploadError);
          setMessage(`文件上传失败: ${uploadError instanceof Error ? uploadError.message : '未知错误'}`);
          setLoading(false);
          return;
        }
      } else {
        console.log('⚠️ 没有选择文件，继续提交...');
      }

      // 先确保用户已经认证到Supabase
      console.log('🔐 检查Supabase用户认证状态...');
      const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Supabase认证错误:', authError);
      } else {
        console.log('Supabase用户信息:', supabaseUser);
      }

      // 应急解决方案：只插入核心必需字段，避免schema不匹配
      const submissionData: any = {
        student_id: currentStudentId,
        student_name: currentStudentName,
        assignment_id: assignmentId,
        attachments_url: attachmentUrls,
        status: '待批改' as const,
        feedback: null
      };
      
      // 动态添加可选字段（如果数据库中存在的话）
      try {
        // 先尝试获取表结构信息
        const { data: testData, error: testError } = await supabase
          .from('submissions')
          .select('*')
          .limit(1);
          
        if (!testError && testData !== null) {
          // 如果没有错误，说明基础结构OK，尝试添加其他字段
          if (selectedAssignment?.day_text || selectedDayText) {
            submissionData.day_text = selectedAssignment?.day_text || selectedDayText;
          }
          
          // 尝试添加其他字段，如果出错就跳过
          if (selectedAssignment?.assignment_title) {
            submissionData.assignment_title = selectedAssignment.assignment_title;
          }
          
          if (selectedAssignment?.is_mandatory !== undefined) {
            submissionData.is_mandatory = selectedAssignment.is_mandatory;
          }
          
          if (selectedAssignment?.description) {
            submissionData.description = selectedAssignment.description;
          }
        }
      } catch (schemaError) {
        console.warn('Schema检测失败，使用最小字段集:', schemaError);
      }
      
      console.log('准备插入数据库:', submissionData);
      
      // 尝试使用service role key绕过RLS（如果可用）
      let insertResult;
      
      try {
        console.log('🚀 尝试插入submissions数据...');
        insertResult = await supabase
          .from('submissions')
          .insert(submissionData)
          .select();
      } catch (directError) {
        console.error('直接插入失败，尝试通过API route:', directError);
        
        // 如果直接插入失败，通过后端API路由插入（绕过RLS）
        try {
          const response = await fetch('/api/homework/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(submissionData)
          });
          
          if (!response.ok) {
            throw new Error(`API调用失败: ${response.status}`);
          }
          
          const apiResult = await response.json();
          insertResult = { data: apiResult.data, error: null };
        } catch (apiError) {
          insertResult = { data: null, error: apiError };
        }
      }
      
      const { error: insertError, data: insertData } = insertResult;

      if (insertError) {
        console.error('Database insert error:', insertError);
        
        // 如果是schema相关错误，尝试最小字段集重试
        if (insertError && typeof insertError === 'object' && 'message' in insertError && 
            typeof insertError.message === 'string' && 
            insertError.message.includes('column') && insertError.message.includes('schema')) {
          console.log('检测到schema错误，尝试最小字段集重试...');
          
          const minimalData = {
            student_id: currentStudentId,
            assignment_id: assignmentId,
            status: '待批改' as const
          };
          
          const { error: retryError } = await supabase
            .from('submissions')
            .insert(minimalData);
            
          if (retryError) {
            console.error('最小字段集重试也失败:', retryError);
            throw new Error(`数据库插入失败: ${retryError.message}`);
          } else {
            console.log('最小字段集插入成功');
          }
        } else {
          const errorMessage = insertError && typeof insertError === 'object' && 'message' in insertError 
            ? String(insertError.message) 
            : '未知错误';
          throw new Error(`数据库插入失败: ${errorMessage}`);
        }
      } else {
        console.log('数据库插入成功:', insertData);
      }

      console.log('数据库插入成功');
      setSubmitted(true);
      const dayText = selectedAssignment?.day_text || selectedDayText;
      const assignmentTitle = selectedAssignment?.assignment_title || '作业';
      setMessage(`✅ 作业提交成功！
      
📚 学习天数: ${dayText}
📝 作业项目: ${assignmentTitle}
      
🤖 正在进行AI批改，请稍后查看结果...`);
      
      // 调用AI批改API
      try {
        const gradeResponse = await fetch('/api/homework/grade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            studentId: currentStudentId,
            assignmentId,
            attachmentUrls
          })
        });

        const gradeResult = await gradeResponse.json();
        
        if (gradeResponse.ok && gradeResult.success) {
          setGradingResult(gradeResult.result);
          setShowResult(true);
          const dayText = selectedAssignment?.day_text || selectedDayText;
          const assignmentTitle = selectedAssignment?.assignment_title || '作业';
          setMessage(`🎉 AI批改完成！

📚 学习天数: ${dayText}
📝 作业项目: ${assignmentTitle}
📊 批改结果: ${gradeResult.result.status}

请查看下方详细反馈 ⬇️`);
        } else {
          setMessage('AI批改失败，请稍后重试');
        }
      } catch (error) {
        console.error('AI批改调用失败:', error);
        setMessage('AI批改服务暂时不可用，请稍后重试');
      }
      
      // 重置表单状态
      setLoading(false);
      setSubmitted(false);
      setFiles([]);
      setSelectedDayText('');
      setAssignmentId('');
      setSelectedAssignment(null);
      
    } catch (error) {
      console.error('Error submitting assignment:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      setMessage(`提交失败: ${errorMessage}，请重试`);
    } finally {
      setLoading(false);
      setSubmitted(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* 顶部导航 */}
        <div className="mb-8">
          <Link href="/homework" className="text-purple-400 hover:text-purple-300 transition-colors">
            ← 返回作业中心
          </Link>
        </div>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold gradient-text mb-8 text-center">
            提交作业
          </h1>

          {/* 用户认证状态显示 */}
          {(studentId || user?.student_id) ? (
            // 已登录用户信息
            <div className="bg-green-500/10 border border-green-400/30 rounded-2xl p-4 mb-6">
              <p className="text-green-300">
                📚 当前用户: <span className="font-semibold">{studentId || user?.student_id}</span>
                {(studentName || user?.name) && <span className="ml-4">姓名: <span className="font-semibold">{studentName || user?.name}</span></span>}
              </p>
            </div>
          ) : (
            // 未登录提示
            <div className="bg-blue-500/10 border border-blue-400/30 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-300 font-medium">🔐 需要登录后才能提交作业</p>
                  <p className="text-blue-200/70 text-sm mt-1">请先验证您的学员身份</p>
                </div>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  立即登录
                </button>
              </div>
            </div>
          )}

          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
            {/* 只有登录后才显示表单 */}
            {(studentId || user?.student_id) ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 学号输入 - 仅在未获取到学号时显示 */}
                {!studentId && !user?.student_id && (
                <div className="relative">
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    学号 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => handleStudentIdInput(e.target.value)}
                    onFocus={() => {
                      if (filteredStudents.length > 0) {
                        setShowStudentDropdown(true);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowStudentDropdown(false), 200);
                    }}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all duration-300"
                    placeholder="请输入学号或姓名搜索"
                    required
                  />
                  
                  {/* 自动补全下拉列表 */}
                  {showStudentDropdown && filteredStudents.length > 0 && (
                    <div className="absolute z-10 w-full bg-gray-800 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                      {filteredStudents.slice(0, 10).map((student) => (
                        <div
                          key={student.student_id}
                          onClick={() => selectStudent(student)}
                          className="px-4 py-3 hover:bg-white/10 cursor-pointer border-b border-white/10 last:border-b-0"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-white">{student.student_id}</span>
                            <span className="text-white/60">{student.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 学员姓名显示 - 仅在未获取到学号时显示 */}
              {!studentId && !user?.student_id && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    姓名
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    readOnly
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white/60"
                    placeholder="根据学号自动显示"
                  />
                </div>
              )}

              {/* 学习天数选择 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  学习天数 <span className="text-red-400">*</span>
                </label>
                <select
                  value={selectedDayText}
                  onChange={(e) => handleDayTextChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all duration-300"
                  required
                >
                  <option value="" disabled>请选择学习天数</option>
                  {availableDays.map(dayText => (
                    <option key={dayText} value={dayText} className="bg-gray-800">
                      {dayText}
                    </option>
                  ))}
                </select>
              </div>

              {/* 作业选择 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  作业项目 <span className="text-red-400">*</span>
                </label>
                <select
                  value={assignmentId}
                  onChange={(e) => handleAssignmentChange(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all duration-300"
                  disabled={!selectedDayText}
                  required
                >
                  <option value="" disabled className="bg-gray-800">
                    {!selectedDayText ? '请先选择学习天数' : assignments.length === 0 ? '该天数暂无作业' : '请选择作业项目'}
                  </option>
                  {assignments.map(assignment => (
                    <option key={assignment.assignment_id} value={assignment.assignment_id} className="bg-gray-800">
                      {assignment.assignment_title} ({assignment.is_mandatory ? '必做' : '选做'})
                    </option>
                  ))}
                </select>
              </div>

              {/* 作业详情显示 */}
              {selectedAssignment && (
                <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
                  <h3 className="font-medium text-blue-300 mb-2">作业详情</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="font-medium text-white/80">类型:</span> 
                      <span className={`ml-2 px-2 py-1 rounded text-xs ${
                        selectedAssignment.is_mandatory 
                          ? 'bg-red-500/20 text-red-300' 
                          : 'bg-green-500/20 text-green-300'
                      }`}>
                        {selectedAssignment.is_mandatory ? '必做' : '选做'}
                      </span>
                    </p>
                    <p><span className="font-medium text-white/80">要求:</span></p>
                    <div className="bg-white/5 p-3 rounded border border-white/10">
                      <p className="text-white/70">{selectedAssignment.description}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 文件上传 */}
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  上传附件 <span className="text-red-400">*</span>
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-500 file:text-white hover:file:bg-purple-600 transition-all duration-300"
                  required
                />
                
                <div className="mt-2">
                  <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-3 mb-2">
                    <div className="flex items-center">
                      <div className="text-2xl mr-2">⚠️</div>
                      <div>
                        <p className="text-sm font-medium text-yellow-300">重要提醒</p>
                        <p className="text-sm text-yellow-200/80">
                          请确保提交的图片总大小不超过 <strong>6MB</strong>，否则上传会失败
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-white/60">
                    支持上传多张图片，格式：JPG、PNG、GIF等
                  </p>
                </div>
                
                {/* 显示已选择的文件 */}
                {files.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-white/80 mb-2">已选择的文件:</p>
                    <ul className="space-y-1">
                      {files.map((file, index) => (
                        <li key={index} className="text-sm text-white/70 bg-white/5 px-3 py-2 rounded">
                          {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </li>
                      ))}
                    </ul>
                    
                    {/* 总文件大小显示和警告 */}
                    {(() => {
                      const totalSizeMB = calculateTotalFileSize(files);
                      const isOverLimit = isFileSizeOverLimit(files);
                      
                      return (
                        <div className={`mt-2 p-2 rounded text-sm ${
                          isOverLimit 
                            ? 'bg-red-500/10 text-red-300 border border-red-400/30' 
                            : 'bg-green-500/10 text-green-300 border border-green-400/30'
                        }`}>
                          <strong>总大小: {totalSizeMB.toFixed(2)} MB</strong>
                          {isOverLimit && (
                            <div className="mt-1">
                              ❌ 超出6MB限制！请删除部分文件或压缩图片后重新选择
                            </div>
                          )}
                          {!isOverLimit && (
                            <div className="mt-1">
                              ✅ 文件大小符合要求
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* 提交按钮 */}
                <button
                  type="submit"
                  disabled={loading || isFileSizeOverLimit(files)}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {loading ? (submitted ? '作业提交成功！正在进行AI批改...' : '作业提交中，请耐心等待...') : '提交作业'}
                </button>
              </form>
            ) : (
              // 未登录时的提示界面
              <div className="text-center py-16">
                <div className="text-6xl mb-6">🔐</div>
                <h3 className="text-2xl font-bold text-white/80 mb-4">需要登录验证</h3>
                <p className="text-white/60 mb-8 max-w-md mx-auto">
                  为了确保作业提交的安全性和准确性，请先登录验证您的学员身份。
                </p>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-8 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium"
                >
                  立即登录 →
                </button>
              </div>
            )}

            {/* 消息显示 */}
            {message && !loading && (
              <div className={`mt-4 p-4 rounded-lg ${
                message.includes('成功') || message.includes('完成')
                  ? 'bg-green-500/10 text-green-300 border border-green-400/30' 
                  : 'bg-red-500/10 text-red-300 border border-red-400/30'
              }`}>
                {message}
                
                {(message.includes('正在进行AI批改') || message.includes('AI批改完成')) && (
                  <div className="flex flex-col gap-3 mt-4">
                    <div className="flex gap-3">
                      <Link
                        href="/homework"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
                      >
                        返回作业中心
                      </Link>
                      <Link
                        href={`/homework/my-assignments?studentId=${studentId || user?.student_id}`}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors"
                      >
                        查看我的作业
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 批改结果显示 */}
            {showResult && gradingResult && (
              <div className="mt-6 p-6 bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl">
                <h3 className="text-xl font-bold mb-4 text-center gradient-text">
                  AI批改结果
                </h3>
                
                <div className="space-y-4">
                  {/* 批改状态 */}
                  <div className="text-center">
                    <span className={`inline-block px-6 py-3 rounded-full text-lg font-bold ${
                      gradingResult.status === '合格' 
                        ? 'bg-green-500 text-white' 
                        : gradingResult.status === '不合格'
                        ? 'bg-red-500 text-white'
                        : gradingResult.status === '批改失败'
                        ? 'bg-gray-500 text-white'
                        : 'bg-yellow-500 text-white'
                    }`}>
                      {gradingResult.status}
                    </span>
                  </div>
                  
                  {/* 批改反馈 */}
                  <div className="bg-white/5 p-4 rounded-lg">
                    <h4 className="font-medium text-white/80 mb-2">批改反馈：</h4>
                    <div className="text-white/70 whitespace-pre-wrap">
                      {gradingResult.feedback}
                    </div>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="flex gap-4 justify-center mt-6">
                    <button
                      onClick={() => {
                        setShowResult(false);
                        setGradingResult(null);
                        setMessage('');
                        setSelectedDayText('');
                        setAssignmentId('');
                        setSelectedAssignment(null);
                        setFiles([]);
                      }}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      提交新作业
                    </button>
                    <Link
                      href="/homework/my-assignments"
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      查看我的作业
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 登录模态框 */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={handleLogin}
        loading={authLoading}
      />
    </div>
  );
}