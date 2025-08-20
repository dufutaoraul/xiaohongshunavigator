'use client';

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

export default function SubmitAssignmentPage() {
  const { user } = useAuth();
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
  
  // 学号自动补全相关状态
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  // 初始化用户信息
  useEffect(() => {
    if (user) {
      setStudentId(user.student_id);
      setStudentName(user.name || '');
    }
    loadAllStudents();
    loadAvailableDays();
  }, [user]);

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

  // 根据选择的天数查询作业列表
  const handleDayTextChange = async (dayText: string) => {
    setSelectedDayText(dayText);
    setAssignmentId('');
    setSelectedAssignment(null);
    
    if (dayText) {
      try {
        const { data, error } = await supabase
          .from('assignments')
          .select('*')
          .eq('day_text', dayText)
          .order('assignment_title');
        
        if (data && !error) {
          setAssignments(data);
        } else {
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

  // 轮询检查批改结果
  const pollGradingResult = async (studentId: string, assignmentId: string): Promise<void> => {
    return new Promise((resolve) => {
      const maxAttempts = 60;
      let attempts = 0;
      
      const checkResult = async (): Promise<void> => {
        try {
          console.log(`轮询检查批改结果 - 第${attempts + 1}次`);
          
          const { data, error } = await supabase
            .from('submissions')
            .select('status, feedback, created_at')
            .eq('student_id', studentId)
            .eq('assignment_id', assignmentId)
            .order('created_at', { ascending: false })
            .limit(1);
          
          if (error) {
            console.error('查询批改结果出错:', error);
            throw error;
          }
          
          if (data && data.length > 0) {
            const latestRecord = data[0];
            
            if (latestRecord.status !== '待批改' && latestRecord.status !== '批改中') {
              setGradingResult({
                status: latestRecord.status,
                feedback: latestRecord.feedback || '批改完成'
              });
              setShowResult(true);
              setMessage(`批改完成！结果：${latestRecord.status}`);
              resolve();
              return;
            }
          }
          
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(() => checkResult(), 3000);
          } else {
            setMessage('批改超时，请稍后查看结果');
            resolve();
          }
        } catch (error) {
          console.error('Error polling grading result:', error);
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(() => checkResult(), 3000);
          } else {
            setMessage('检查批改结果时出错，请刷新页面重试');
            resolve();
          }
        }
      };
      
      setTimeout(() => checkResult(), 2000);
    });
  };

  // 提交作业
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentId || !assignmentId || files.length === 0) {
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
      console.log('开始提交作业:', { studentId, assignmentId, fileCount: files.length });
      
      // 模拟文件上传（实际项目中需要实现真实的文件上传）
      const attachmentUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        // 这里应该实现真实的文件上传逻辑
        attachmentUrls.push(`https://example.com/uploads/${files[i].name}`);
      }

      // 提交作业记录
      const submissionData = {
        student_id: studentId,
        name: studentName,
        assignment_id: assignmentId,
        day_text: selectedAssignment?.day_text || selectedDayText,
        assignment_title: selectedAssignment?.assignment_title || '',
        is_mandatory: selectedAssignment?.is_mandatory || false,
        description: selectedAssignment?.description || '',
        attachments_url: attachmentUrls,
        status: '待批改' as const,
        feedback: null,
        submission_date: new Date().toISOString()
      };
      
      console.log('准备插入数据库:', submissionData);
      
      const { error: insertError } = await supabase
        .from('submissions')
        .insert(submissionData);

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error(`数据库插入失败: ${insertError.message}`);
      }

      console.log('数据库插入成功');
      setSubmitted(true);
      
      // 模拟AI批改过程
      setTimeout(async () => {
        try {
          const { error: updateError } = await supabase
            .from('submissions')
            .update({
              status: '合格',
              feedback: '作业完成良好，符合要求。'
            })
            .eq('student_id', studentId)
            .eq('assignment_id', assignmentId);

          if (!updateError) {
            setGradingResult({
              status: '合格',
              feedback: '作业完成良好，符合要求。'
            });
            setShowResult(true);
            setMessage('批改完成！结果：合格');
          }
        } catch (error) {
          console.error('Error updating grading result:', error);
        }
      }, 3000);
      
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

          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 学号输入 */}
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
                  disabled={!!user} // 如果已登录则禁用编辑
                />
                
                {/* 自动补全下拉列表 */}
                {showStudentDropdown && filteredStudents.length > 0 && !user && (
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

              {/* 学员姓名显示 */}
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
                  <option value="">请选择学习天数</option>
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
                  <option value="">请选择作业项目</option>
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

            {/* 消息显示 */}
            {message && !loading && (
              <div className={`mt-4 p-4 rounded-lg ${
                message.includes('成功') || message.includes('完成')
                  ? 'bg-green-500/10 text-green-300 border border-green-400/30' 
                  : 'bg-red-500/10 text-red-300 border border-red-400/30'
              }`}>
                {message}
                
                {message.includes('正在进行AI批改') && (
                  <div className="flex gap-3 mt-4">
                    <Link
                      href="/homework"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
                    >
                      返回作业中心
                    </Link>
                    <Link
                      href="/homework/my-assignments"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors"
                    >
                      查看我的作业
                    </Link>
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
    </div>
  );
}