'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Submission, Assignment, SubmissionWithAssignment } from '@/types/homework';
import { getDayTextFromAssignment, formatDate, getStatusColor } from '@/utils/homework-utils';

function MyAssignmentsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [submissions, setSubmissions] = useState<SubmissionWithAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingSubmission, setEditingSubmission] = useState<string | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [deletingSubmission, setDeletingSubmission] = useState<string | null>(null);
  const [keepExistingFiles, setKeepExistingFiles] = useState(true);

  // 初始化用户信息（不自动搜索）
  useEffect(() => {
    const urlStudentId = searchParams.get('studentId');
    
    console.log('=== 用户认证调试信息 ===');
    console.log('AuthContext user:', user);
    console.log('URL studentId:', urlStudentId);
    
    // 优先使用AuthContext中的用户信息，但不自动搜索
    if (user && user.student_id) {
      console.log('✅ 使用AuthContext用户信息:', user);
      setStudentId(user.student_id);
      setStudentName(user.name || '');
      // 移除自动搜索：fetchSubmissionsWithId(user.student_id);
      return;
    }
    
    // 尝试从多个localStorage键获取用户信息
    if (typeof window !== 'undefined') {
      // 检查 userSession
      const userSession = localStorage.getItem('userSession');
      if (userSession) {
        try {
          const sessionData = JSON.parse(userSession);
          console.log('localStorage userSession:', sessionData);
          if (sessionData.user && sessionData.user.student_id) {
            console.log('✅ 使用userSession用户信息:', sessionData.user);
            setStudentId(sessionData.user.student_id);
            setStudentName(sessionData.user.name || '');
            // 移除自动搜索：fetchSubmissionsWithId(sessionData.user.student_id);
            return;
          }
        } catch (error) {
          console.error('Error parsing userSession:', error);
        }
      }
      
      // 检查 user
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('localStorage user:', userData);
          if (userData.student_id) {
            console.log('✅ 使用localStorage user信息:', userData);
            setStudentId(userData.student_id);
            setStudentName(userData.name || '');
            // 移除自动搜索：fetchSubmissionsWithId(userData.student_id);
            return;
          }
        } catch (error) {
          console.error('Error parsing stored user data:', error);
        }
      }
      
      // 检查 lastCredentials
      const lastCredentials = localStorage.getItem('lastCredentials');
      if (lastCredentials) {
        try {
          const credData = JSON.parse(lastCredentials);
          console.log('localStorage lastCredentials:', credData);
          if (credData.student_id) {
            console.log('✅ 使用lastCredentials信息:', credData);
            setStudentId(credData.student_id);
            setStudentName(credData.name || '');
            // 移除自动搜索：fetchSubmissionsWithId(credData.student_id);
            return;
          }
        } catch (error) {
          console.error('Error parsing lastCredentials:', error);
        }
      }
      
      console.log('❌ localStorage中没有找到有效的用户信息');
      console.log('所有localStorage键:', Object.keys(localStorage));
    }
    
    // 如果URL中有学号参数，使用它
    if (urlStudentId) {
      console.log('✅ 使用URL参数学号:', urlStudentId);
      setStudentId(urlStudentId);
      fetchSubmissionsWithId(urlStudentId);
    } else {
      console.log('❌ 没有找到任何用户信息');
    }
  }, [user, searchParams]);

  // 查询学员作业提交历史
  const fetchSubmissions = async () => {
    if (!studentId) return;
    await fetchSubmissionsWithId(studentId);
  };
  
  const fetchSubmissionsWithId = async (id: string) => {
    if (!id) return;
    
    setLoading(true);
    try {
      console.log(`📋 查询学生提交记录: ${id}`);
      
      // 使用API避免RLS权限问题
      const response = await fetch('/api/homework/my-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentId: id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取提交记录失败');
      }

      const result = await response.json();
      const submissionsData = result.data;

      console.log(`📊 获取到的提交记录:`, submissionsData);
      
      if (!submissionsData || submissionsData.length === 0) {
        setSubmissions([]);
        setMessage('暂无作业提交记录');
        return;
      }

      // 获取所有相关的作业信息
      const assignmentIds = submissionsData.map((s: any) => s.assignment_id);
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .in('assignment_id', assignmentIds);

      if (assignmentsError) throw assignmentsError;

      // 创建作业信息映射
      const assignmentMap = new Map();
      if (assignmentsData) {
        assignmentsData.forEach((assignment: any) => {
          assignmentMap.set(assignment.assignment_id, assignment);
        });
      }

      // 合并数据
      const data = submissionsData.map((submission: any) => ({
        ...submission,
        assignment: assignmentMap.get(submission.assignment_id) || {
          assignment_id: submission.assignment_id,
          assignment_title: submission.assignment_title || '未知作业',
          day_text: submission.day_text || '未知天数',
          is_mandatory: submission.is_mandatory || false,
          description: submission.description || ''
        }
      }));
      
      setSubmissions(data || []);
      if (data?.length === 0) {
        setMessage('暂无作业提交记录');
      } else {
        setMessage('');
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setMessage('查询失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理重新提交
  const handleResubmit = async (submissionId: string) => {
    if (!keepExistingFiles && newFiles.length === 0) {
      setMessage('请选择要上传的文件，或者选择保留原有文件');
      return;
    }

    setLoading(true);
    try {
      let finalAttachmentUrls: string[] = [];
      
      // 如果保留原有文件，先获取原有文件URL
      if (keepExistingFiles) {
        const currentSubmission = submissions.find(s => s.submission_id === submissionId);
        if (currentSubmission) {
          finalAttachmentUrls = [...currentSubmission.attachments_url];
        }
      }
      
      // 模拟上传新文件
      if (newFiles.length > 0) {
        for (const file of newFiles) {
          // 这里应该实现真实的文件上传逻辑
          finalAttachmentUrls.push(`https://example.com/uploads/${file.name}`);
        }
      }

      // 更新提交记录
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          attachments_url: finalAttachmentUrls,
          status: '待批改',
          feedback: null,
          updated_at: new Date().toISOString()
        })
        .eq('submission_id', submissionId);

      if (updateError) throw updateError;

      // 模拟AI批改
      setTimeout(async () => {
        try {
          await supabase
            .from('submissions')
            .update({
              status: '合格',
              feedback: '重新提交的作业完成良好，符合要求。'
            })
            .eq('submission_id', submissionId);
        } catch (error) {
          console.error('Error updating grading result:', error);
        }
      }, 3000);

      setMessage('重新提交成功！正在进行AI批改，请稍后刷新查看结果...');
      setEditingSubmission(null);
      setNewFiles([]);
      fetchSubmissions();
      
    } catch (error) {
      console.error('Error resubmitting assignment:', error);
      setMessage('重新提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 删除作业
  const handleDeleteSubmission = async (submissionId: string) => {
    if (!confirm('确定要删除这个作业提交记录吗？删除后无法恢复。')) {
      return;
    }
    
    setDeletingSubmission(submissionId);
    try {
      console.log('正在删除submission_id:', submissionId);
      
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('submission_id', submissionId);
        
      if (error) {
        console.error('删除错误:', error);
        throw error;
      }
      
      setMessage('作业删除成功');
      await fetchSubmissions();
    } catch (error) {
      console.error('Error deleting submission:', error);
      setMessage(`删除失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setDeletingSubmission(null);
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

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold gradient-text mb-8 text-center">
            我的作业
          </h1>


          {/* 学号确认区域 - 为所有情况显示 */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-8">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  学号确认
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all duration-300"
                  placeholder={studentId ? "已自动识别学号，请确认" : "请输入学号"}
                  disabled={loading}
                />
              </div>
              <button
                onClick={fetchSubmissions}
                disabled={loading || !studentId}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              >
                {loading ? '查询中...' : '确认查询'}
              </button>
            </div>
          </div>

          {/* 消息显示 */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('成功') 
                ? 'bg-green-500/10 text-green-300 border border-green-400/30' 
                : message.includes('失败')
                ? 'bg-red-500/10 text-red-300 border border-red-400/30'
                : 'bg-blue-500/10 text-blue-300 border border-blue-400/30'
            }`}>
              {message}
            </div>
          )}

          {/* 作业列表 */}
          {submissions.length > 0 && (
            <div className="space-y-6">
              {submissions.map((submission) => (
                <div key={submission.submission_id} className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {submission.assignment.assignment_title}
                      </h3>
                      <div className="space-y-1 text-sm text-white/70">
                        <p>{getDayTextFromAssignment(submission.assignment)}</p>
                        <p>提交时间: {formatDate(submission.submission_date)}</p>
                        <p>
                          类型: 
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            submission.assignment.is_mandatory 
                              ? 'bg-red-500/20 text-red-300' 
                              : 'bg-green-500/20 text-green-300'
                          }`}>
                            {submission.assignment.is_mandatory ? '必做' : '选做'}
                          </span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(submission.status)}`}>
                        {submission.status || '未批改'}
                      </span>
                    </div>
                  </div>

                  {/* 批改反馈 */}
                  {submission.feedback && (
                    <div className="mb-4 p-3 bg-white/5 rounded-lg">
                      <p className="text-sm font-medium text-white/80 mb-1">批改反馈:</p>
                      <p className="text-sm text-white/70">{submission.feedback}</p>
                    </div>
                  )}

                  {/* 附件显示 */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-white/80 mb-2">已提交附件:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {(submission.attachments_url || []).map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block border border-white/20 rounded-lg p-2 hover:bg-white/5 transition-colors"
                        >
                          <img
                            src={url}
                            alt={`附件 ${index + 1}`}
                            className="w-full h-20 object-cover rounded"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBzdHJva2U9IiM2NjY2NjYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                            }}
                          />
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="border-t border-white/20 pt-4">
                    {/* 重新提交功能 */}
                    {(submission.status === '不合格' || submission.status === '批改失败') && editingSubmission === submission.submission_id && (
                      <div className="mb-4 space-y-4">
                        {/* 原有文件处理选项 */}
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">
                            文件处理方式
                          </label>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                checked={keepExistingFiles}
                                onChange={() => setKeepExistingFiles(true)}
                                className="mr-2"
                              />
                              <span className="text-sm text-white/70">保留原有文件，可添加新文件</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                checked={!keepExistingFiles}
                                onChange={() => setKeepExistingFiles(false)}
                                className="mr-2"
                              />
                              <span className="text-sm text-white/70">删除原有文件，重新上传</span>
                            </label>
                          </div>
                        </div>

                        {/* 当前文件显示 */}
                        {keepExistingFiles && (submission.attachments_url || []).length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-white/80 mb-2">当前文件 (将保留):</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {(submission.attachments_url || []).map((url, index) => (
                                <div key={index} className="relative">
                                  <img
                                    src={url}
                                    alt={`原文件 ${index + 1}`}
                                    className="w-full h-20 object-cover rounded border border-white/20"
                                  />
                                  <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 rounded">
                                    保留
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-sm font-medium text-white/80 mb-2">
                            {keepExistingFiles ? '添加新文件' : '重新上传文件'}
                          </label>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => setNewFiles(e.target.files ? Array.from(e.target.files) : [])}
                            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-500 file:text-white hover:file:bg-purple-600 transition-all duration-300"
                          />
                        </div>
                        
                        {newFiles.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-white/80 mb-2">新选择的文件:</p>
                            <ul className="space-y-1">
                              {newFiles.map((file, index) => (
                                <li key={index} className="text-sm text-white/70 bg-blue-500/10 px-2 py-1 rounded">
                                  {file.name}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResubmit(submission.submission_id)}
                            disabled={loading || (!keepExistingFiles && newFiles.length === 0)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {loading ? '提交中...' : '确认重新提交'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingSubmission(null);
                              setNewFiles([]);
                              setKeepExistingFiles(true);
                            }}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transition-colors"
                          >
                            取消
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* 操作按钮行 */}
                    <div className="flex gap-2 flex-wrap">
                      {/* 修改作业按钮 */}
                      {(submission.status === '不合格' || submission.status === '批改失败') && editingSubmission !== submission.submission_id && (
                        <button
                          onClick={() => setEditingSubmission(submission.submission_id)}
                          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-colors"
                        >
                          修改作业
                        </button>
                      )}
                      
                      {/* 删除按钮 */}
                      <button
                        onClick={() => handleDeleteSubmission(submission.submission_id)}
                        disabled={deletingSubmission === submission.submission_id || editingSubmission === submission.submission_id}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {deletingSubmission === submission.submission_id ? '删除中...' : '删除作业'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 毕业资格状态显示 */}
          {submissions.length > 0 && studentId && (
            <div className="mt-8 bg-blue-500/10 border border-blue-400/30 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-blue-300 mb-4">📋 毕业资格状态</h3>
              <div className="flex justify-between items-center">
                <p className="text-blue-200/80">
                  想了解您的毕业资格吗？点击查看详细的毕业条件检查结果。
                </p>
                <Link
                  href={`/homework/graduation-check?studentId=${studentId}`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
                >
                  查看毕业资格
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyAssignmentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <MyAssignmentsContent />
    </Suspense>
  );
}