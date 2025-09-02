'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Assignment, Submission, GraduationStats } from '@/types/homework';
import { getDayTextFromAssignment, formatDate } from '@/utils/homework-utils';
import GlobalUserMenu from '@/app/components/GlobalUserMenu';

function GraduationCheckContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [graduationStats, setGraduationStats] = useState<GraduationStats | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [message, setMessage] = useState('');

  // 初始化用户信息
  useEffect(() => {
    const urlStudentId = searchParams.get('studentId');
    
    if (user) {
      // 已登录用户，自动获取信息但不自动查询
      setStudentId(user.student_id);
      setStudentName(user.name || '');
      // 移除自动查询：checkGraduationStatus(user.student_id);
    } else {
      // 未登录用户，尝试从localStorage获取
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          if (userData.student_id) {
            setStudentId(userData.student_id);
            setStudentName(userData.name || '');
            // 移除自动查询：checkGraduationStatus(userData.student_id);
            return;
          }
        } catch (error) {
          console.error('Error parsing stored user data:', error);
        }
      }
      
      // 如果URL中有学号参数，使用它但不自动查询
      if (urlStudentId) {
        setStudentId(urlStudentId);
        // 移除自动查询：checkGraduationStatus(urlStudentId);
      }
    }
  }, [user, searchParams]);

  // 检查毕业资格
  const checkGraduationStatus = async (id?: string) => {
    const targetStudentId = id || studentId;
    if (!targetStudentId) return;
    
    setLoading(true);
    try {
      // 获取所有作业
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select('*')
        .order('day_text');

      if (assignmentsError) throw assignmentsError;

      // 获取学员提交记录
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', targetStudentId)
        .order('created_at', { ascending: false });

      if (submissionsError) throw submissionsError;

      // 获取学员姓名（如果还没有）
      if (!studentName && targetStudentId) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('name')
          .eq('student_id', targetStudentId)
          .single();

        if (userData && !userError) {
          setStudentName(userData.name || '');
        }
      }

      setAllAssignments(assignmentsData || []);
      setSubmissions(submissionsData || []);

      // 计算毕业统计
      const stats = calculateGraduationStats(assignmentsData || [], submissionsData || []);
      setGraduationStats(stats);
      
      if (submissionsData?.length === 0) {
        setMessage('该学员暂无作业提交记录');
      } else {
        setMessage('');
      }
    } catch (error) {
      console.error('Error checking graduation status:', error);
      setMessage('查询失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 计算毕业统计
  const calculateGraduationStats = (assignments: Assignment[], submissions: Submission[]): GraduationStats => {
    const totalAssignments = assignments.length;
    const mandatoryAssignments = assignments.filter(a => a.is_mandatory).length;
    const optionalAssignments = assignments.filter(a => !a.is_mandatory).length;

    // 获取已完成的作业（去重，一个作业只算一次）
    const completedAssignmentIds = new Set(submissions.map(s => s.assignment_id));
    const completedAssignments = completedAssignmentIds.size;

    // 获取通过的作业
    const passedSubmissions = submissions.filter(s => s.status === '合格');
    const passedAssignmentIds = new Set(passedSubmissions.map(s => s.assignment_id));
    const passedAssignments = passedAssignmentIds.size;

    // 获取失败的作业
    const failedSubmissions = submissions.filter(s => s.status === '不合格');
    const failedAssignmentIds = new Set(failedSubmissions.map(s => s.assignment_id));
    const failedAssignments = failedAssignmentIds.size;

    // 获取待批改的作业
    const pendingSubmissions = submissions.filter(s => s.status === '待批改' || s.status === '批改中');
    const pendingAssignmentIds = new Set(pendingSubmissions.map(s => s.assignment_id));
    const pendingAssignments = pendingAssignmentIds.size;

    // 计算完成率和通过率
    const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
    const passRate = completedAssignments > 0 ? (passedAssignments / completedAssignments) * 100 : 0;

    // 找出缺失的必做作业
    const completedMandatoryIds = new Set(
      submissions
        .filter(s => assignments.find(a => a.assignment_id === s.assignment_id)?.is_mandatory)
        .map(s => s.assignment_id)
    );
    
    const missingMandatory = assignments.filter(a => 
      a.is_mandatory && !completedMandatoryIds.has(a.assignment_id)
    );

    // 判断是否符合毕业条件 - 正确的毕业标准
    // 1. 所有必做的作业必须全部合格
    // 2. 第一周第二天下午的四个选做作业必须至少合格一个
    // 3. 除"第一周第二天下午"四个选做作业以外的"其他选做作业"必须至少合格一个
    
    // 1. 检查所有必做作业是否全部合格
    const mandatoryPassed = missingMandatory.length === 0;
    
    // 2. 检查"第一周第二天下午"的选做作业(假设day_text包含"第一周第二天下午")
    const firstWeekAfternoonOptional = assignments.filter(a => 
      !a.is_mandatory && (a.day_text?.includes('第一周第二天下午') || a.day_text?.includes('1-2下午'))
    );
    const passedFirstWeekAfternoon = submissions.filter(s => 
      s.status === '合格' && 
      firstWeekAfternoonOptional.some(a => a.assignment_id === s.assignment_id)
    ).length;
    const firstWeekAfternoonQualified = firstWeekAfternoonOptional.length === 0 || passedFirstWeekAfternoon >= 1;
    
    // 3. 检查其他选做作业(除第一周第二天下午外的所有选做作业)
    const otherOptionalAssignments = assignments.filter(a => 
      !a.is_mandatory && 
      !firstWeekAfternoonOptional.some(fwa => fwa.assignment_id === a.assignment_id)
    );
    const passedOtherOptional = submissions.filter(s => 
      s.status === '合格' && 
      otherOptionalAssignments.some(a => a.assignment_id === s.assignment_id)
    ).length;
    const otherOptionalQualified = otherOptionalAssignments.length === 0 || passedOtherOptional >= 1;
    
    const isEligible = mandatoryPassed && firstWeekAfternoonQualified && otherOptionalQualified;

    return {
      total_assignments: totalAssignments,
      mandatory_assignments: mandatoryAssignments,
      optional_assignments: optionalAssignments,
      completed_assignments: completedAssignments,
      passed_assignments: passedAssignments,
      failed_assignments: failedAssignments,
      pending_assignments: pendingAssignments,
      completion_rate: completionRate,
      pass_rate: passRate,
      is_eligible: isEligible,
      missing_mandatory: missingMandatory,
      // 新的毕业标准相关统计
      mandatory_passed: mandatoryPassed,
      first_week_afternoon_optional_count: firstWeekAfternoonOptional.length,
      first_week_afternoon_passed: passedFirstWeekAfternoon,
      first_week_afternoon_qualified: firstWeekAfternoonQualified,
      other_optional_count: otherOptionalAssignments.length,
      other_optional_passed: passedOtherOptional,
      other_optional_qualified: otherOptionalQualified
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white relative">
      {/* 全局用户菜单 - 左上角 */}
      <GlobalUserMenu className="absolute top-6 left-6 z-50" />

      <div className="container mx-auto px-4 py-8">
        {/* 顶部导航 */}
        <div className="mb-8">
          <Link href="/homework" className="text-purple-400 hover:text-purple-300 transition-colors">
            ← 返回作业中心
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold gradient-text mb-8 text-center">
            毕业资格检查
          </h1>

          {/* 学号确认输入 - 为所有用户显示确认界面 */}
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
                  placeholder={studentId ? "已自动识别学号，请确认后查询" : "输入学号查询毕业资格"}
                  disabled={loading}
                />
              </div>
              <button
                onClick={() => checkGraduationStatus()}
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

          {/* 毕业资格统计 */}
          {graduationStats && (
            <div className="space-y-6">
              {/* 学员信息 */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">学员信息</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-white/60">学号</p>
                    <p className="text-xl font-semibold text-white">{studentId}</p>
                  </div>
                  <div>
                    <p className="text-white/60">姓名</p>
                    <p className="text-xl font-semibold text-white">{studentName || '未知'}</p>
                  </div>
                </div>
              </div>

              {/* 毕业资格状态 */}
              <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
                graduationStats.is_eligible 
                  ? 'bg-green-500/10 border-green-400/30' 
                  : 'bg-red-500/10 border-red-400/30'
              }`}>
                <div className="text-center">
                  <div className="text-6xl mb-4">
                    {graduationStats.is_eligible ? '🎓' : '📚'}
                  </div>
                  <h2 className={`text-3xl font-bold mb-2 ${
                    graduationStats.is_eligible ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {graduationStats.is_eligible ? '符合毕业条件' : '暂不符合毕业条件'}
                  </h2>
                  <p className={`text-lg ${
                    graduationStats.is_eligible ? 'text-green-200/80' : 'text-red-200/80'
                  }`}>
                    {graduationStats.is_eligible 
                      ? '恭喜！您已完成所有必要的学习任务，可以申请毕业证书。' 
                      : '请继续完成剩余的作业任务，达到毕业要求。'
                    }
                  </p>
                </div>
              </div>

              {/* 详细统计 */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-500/10 backdrop-blur-lg border border-blue-400/30 rounded-2xl p-6">
                  <div className="text-center">
                    <div className="text-3xl mb-2">📊</div>
                    <p className="text-blue-300 text-sm mb-1">总作业数</p>
                    <p className="text-2xl font-bold text-white">{graduationStats.total_assignments}</p>
                  </div>
                </div>

                <div className="bg-green-500/10 backdrop-blur-lg border border-green-400/30 rounded-2xl p-6">
                  <div className="text-center">
                    <div className="text-3xl mb-2">✅</div>
                    <p className="text-green-300 text-sm mb-1">已完成</p>
                    <p className="text-2xl font-bold text-white">{graduationStats.completed_assignments}</p>
                  </div>
                </div>

                <div className="bg-purple-500/10 backdrop-blur-lg border border-purple-400/30 rounded-2xl p-6">
                  <div className="text-center">
                    <div className="text-3xl mb-2">📈</div>
                    <p className="text-purple-300 text-sm mb-1">完成率</p>
                    <p className="text-2xl font-bold text-white">{graduationStats.completion_rate.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="bg-yellow-500/10 backdrop-blur-lg border border-yellow-400/30 rounded-2xl p-6">
                  <div className="text-center">
                    <div className="text-3xl mb-2">🏆</div>
                    <p className="text-yellow-300 text-sm mb-1">通过率</p>
                    <p className="text-2xl font-bold text-white">{graduationStats.pass_rate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              {/* 作业分类统计 */}
              <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">作业完成情况</h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-red-300 text-sm">必做作业</p>
                    <p className="text-lg font-semibold text-white">{graduationStats.mandatory_assignments}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-green-300 text-sm">选做作业</p>
                    <p className="text-lg font-semibold text-white">{graduationStats.optional_assignments}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-blue-300 text-sm">已通过</p>
                    <p className="text-lg font-semibold text-white">{graduationStats.passed_assignments}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-yellow-300 text-sm">待批改</p>
                    <p className="text-lg font-semibold text-white">{graduationStats.pending_assignments}</p>
                  </div>
                </div>
              </div>


              {/* 毕业建议 */}
              <div className="bg-blue-500/10 backdrop-blur-lg border border-blue-400/30 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-blue-300 mb-4">💡 毕业建议</h3>
                <div className="space-y-2 text-white/80">
                  {graduationStats.is_eligible ? (
                    <>
                      <p>✅ 您已符合毕业条件！可以联系管理员申请毕业证书。</p>
                      <p>🎉 恭喜完成小红书AI灵感领航员课程的学习！</p>
                    </>
                  ) : (
                    <>
                      {!graduationStats.mandatory_passed && (
                        <p>❗ <strong>必做作业要求：</strong>所有必做作业必须全部合格（还有 {graduationStats.missing_mandatory?.length || 0} 个必做作业未完成）</p>
                      )}
                      {!graduationStats.first_week_afternoon_qualified && (
                        <p>📅 <strong>第一周第二天下午选做作业：</strong>四个选做作业中至少需要1个合格（当前合格 {graduationStats.first_week_afternoon_passed} 个）</p>
                      )}
                      {!graduationStats.other_optional_qualified && (
                        <p>📚 <strong>其他选做作业：</strong>除第一周第二天下午外的选做作业中至少需要1个合格（当前合格 {graduationStats.other_optional_passed} 个）</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-4 justify-center">
                <Link
                  href="/homework/submit"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  提交新作业
                </Link>
                <Link
                  href="/homework/my-assignments"
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  查看我的作业
                </Link>
                {graduationStats.is_eligible && (
                  <button
                    onClick={() => alert('请联系管理员申请毕业证书')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
                  >
                    申请毕业证书
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GraduationCheckPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <GraduationCheckContent />
    </Suspense>
  );
}