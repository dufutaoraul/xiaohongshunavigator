'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Assignment } from '@/types/homework';
import { 
  getUniqueDayTexts 
} from '@/utils/homework-utils';

interface AIResult {
  model: string;
  status: '合格' | '不合格' | '测试中' | '失败';
  feedback: string;
  time?: number;
  isSimulated?: boolean;
}

export default function SimpleAITestPage() {
  const [selectedDayText, setSelectedDayText] = useState('');
  const [assignmentId, setAssignmentId] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [testImageUrls, setTestImageUrls] = useState<string[]>([
    'https://example.com/test-image-1.jpg',
    'https://example.com/test-image-2.jpg'
  ]);
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{
    gemini: AIResult | null;
    doubao: AIResult | null;
  }>({
    gemini: null,
    doubao: null
  });

  // 加载可用天数
  useEffect(() => {
    const uniqueDayTexts = getUniqueDayTexts();
    setAvailableDays(uniqueDayTexts);
  }, []);

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
        
        if (error) {
          console.error('数据库查询错误:', error);
          setAssignments([]);
        } else {
          setAssignments(data || []);
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

  // 模拟AI批改测试（不需要真实文件上传）
  const simulateAIGrading = async (model: 'gemini' | 'doubao', assignmentDescription: string) => {
    const startTime = Date.now();
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 1000));
      
      // 模拟不同的批改结果
      const isAIToolAssignment = assignmentDescription.toLowerCase().includes('dify') || 
                               assignmentDescription.toLowerCase().includes('智能体') ||
                               assignmentDescription.toLowerCase().includes('机器人');
      
      // 根据模型特点模拟不同的批改倾向
      let passRate = 0.7;
      if (isAIToolAssignment) {
        passRate = model === 'gemini' ? 0.9 : 0.85; // Gemini对AI工具作业更宽松
      } else {
        passRate = model === 'gemini' ? 0.8 : 0.75; // 普通作业的通过率
      }
      
      const isPass = Math.random() < passRate;
      const endTime = Date.now();
      
      let feedback = '';
      if (isPass) {
        if (model === 'gemini') {
          feedback = isAIToolAssignment 
            ? `✅ 作业合格！您成功展示了AI工具的使用能力。虽然可能使用的不是dify而是其他AI平台，但这完全符合学习目标。图片清晰地展示了与AI工具的对话过程，体现了良好的学习态度和实操能力。继续保持！`
            : `✅ 作业合格！您按要求完成了作业提交，展示了良好的学习成果。内容符合要求，操作步骤清晰，达到了预期的学习效果。`;
        } else {
          feedback = isAIToolAssignment
            ? `合格！您的作业展现了对AI工具的实际操作能力，展示了学习的积极态度。建议继续深入学习AI工具的高级功能，提升应用水平。`
            : `合格！作业内容基本符合要求，完成度较好。建议在今后的学习中继续保持认真的态度。`;
        }
      } else {
        if (model === 'gemini') {
          feedback = isAIToolAssignment
            ? `❌ 作业需要改进。虽然提交了相关截图，但可能缺少关键的操作步骤展示，或者未能清晰体现AI工具的实际应用效果。建议重新截图，确保包含完整的操作流程和结果展示。`
            : `❌ 作业不合格。提交的内容可能不完整或不符合具体要求。请仔细阅读作业要求，确保提交的材料能够充分展示学习成果。`;
        } else {
          feedback = `作业不合格。请根据作业要求重新提交，确保内容完整准确。如有疑问请联系老师获得指导。`;
        }
      }
      
      return {
        model: model === 'gemini' ? 'Gemini 2.0 (模拟)' : '豆包视觉 (模拟)',
        status: isPass ? '合格' : '不合格',
        feedback: feedback,
        time: endTime - startTime,
        isSimulated: true
      } as AIResult;
      
    } catch (error) {
      return {
        model: model === 'gemini' ? 'Gemini 2.0 (模拟)' : '豆包视觉 (模拟)',
        status: '失败' as const,
        feedback: '模拟测试失败: ' + (error instanceof Error ? error.message : 'Unknown error'),
        time: Date.now() - startTime,
        isSimulated: true
      };
    }
  };

  // 开始AI对比测试
  const startComparison = async () => {
    if (!selectedAssignment) {
      alert('请选择作业项目');
      return;
    }

    setTesting(true);
    setResults({ gemini: null, doubao: null });

    // 设置测试中状态
    setResults({
      gemini: { model: 'Gemini 2.0 (模拟)', status: '测试中', feedback: '正在模拟Gemini 2.0 API调用...', time: 0, isSimulated: true },
      doubao: { model: '豆包视觉 (模拟)', status: '测试中', feedback: '正在模拟豆包视觉API调用...', time: 0, isSimulated: true }
    });

    try {
      // 并发调用两个AI模型的模拟
      const [geminiResult, doubaoResult] = await Promise.allSettled([
        simulateAIGrading('gemini', selectedAssignment.description),
        simulateAIGrading('doubao', selectedAssignment.description)
      ]);

      setResults({
        gemini: geminiResult.status === 'fulfilled' ? geminiResult.value : {
          model: 'Gemini 2.0 (模拟)',
          status: '失败',
          feedback: 'Promise rejected: ' + (geminiResult.reason || 'Unknown error'),
          time: 0,
          isSimulated: true
        },
        doubao: doubaoResult.status === 'fulfilled' ? doubaoResult.value : {
          model: '豆包视觉 (模拟)',
          status: '失败',
          feedback: 'Promise rejected: ' + (doubaoResult.reason || 'Unknown error'),
          time: 0,
          isSimulated: true
        }
      });
      
    } catch (error) {
      console.error('AI对比测试失败:', error);
      setResults({
        gemini: { model: 'Gemini 2.0 (模拟)', status: '失败', feedback: error instanceof Error ? error.message : 'Unknown error', time: 0, isSimulated: true },
        doubao: { model: '豆包视觉 (模拟)', status: '失败', feedback: error instanceof Error ? error.message : 'Unknown error', time: 0, isSimulated: true }
      });
    } finally {
      setTesting(false);
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

        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold gradient-text mb-8 text-center">
            🧪 AI模型简化测试
          </h1>
          
          <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-2xl p-4 mb-8">
            <div className="flex items-center">
              <div className="text-2xl mr-3">ℹ️</div>
              <div>
                <p className="text-yellow-300 font-medium">模拟测试模式</p>
                <p className="text-yellow-200/80 text-sm">
                  此页面使用模拟数据进行AI批改对比测试，无需上传实际文件。选择作业后可直接对比两个AI模型的批改风格和结果差异。
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 左侧：测试配置 */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">🛠️ 测试配置</h2>
              
              <div className="space-y-4">
                {/* 学习天数选择 */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    学习天数
                  </label>
                  <select
                    value={selectedDayText}
                    onChange={(e) => handleDayTextChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
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
                    作业项目
                  </label>
                  <select
                    value={assignmentId}
                    onChange={(e) => handleAssignmentChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    disabled={!selectedDayText}
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
                    <h3 className="font-medium text-blue-300 mb-2">📋 作业要求</h3>
                    <div className="bg-white/5 p-3 rounded border border-white/10">
                      <p className="text-white/70 text-sm">{selectedAssignment.description}</p>
                    </div>
                  </div>
                )}

                {/* 模拟图片URL配置 */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    模拟测试图片数量
                  </label>
                  <select
                    value={testImageUrls.length}
                    onChange={(e) => {
                      const count = parseInt(e.target.value);
                      const newUrls = Array(count).fill(0).map((_, i) => `https://example.com/test-image-${i+1}.jpg`);
                      setTestImageUrls(newUrls);
                    }}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white"
                  >
                    <option value="1">1张图片</option>
                    <option value="2">2张图片</option>
                    <option value="3">3张图片</option>
                    <option value="5">5张图片</option>
                  </select>
                  <p className="text-xs text-white/60 mt-1">模拟{testImageUrls.length}张测试图片</p>
                </div>

                {/* 开始测试按钮 */}
                <button
                  onClick={startComparison}
                  disabled={!selectedAssignment || testing}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {testing ? '🔄 正在模拟测试...' : '🚀 开始AI对比测试'}
                </button>
              </div>
            </div>

            {/* 右侧：测试结果 */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">📊 测试结果</h2>
              
              <div className="space-y-4">
                {/* Gemini 2.0 结果 */}
                <div className="bg-white/5 border border-white/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-blue-300">🔥 Gemini 2.0</h3>
                    {results.gemini && (
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        results.gemini.status === '合格' ? 'bg-green-500' :
                        results.gemini.status === '不合格' ? 'bg-red-500' :
                        results.gemini.status === '测试中' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}>
                        {results.gemini.status}
                      </span>
                    )}
                  </div>
                  
                  {results.gemini ? (
                    <div className="space-y-2">
                      <div className="text-sm text-white/70">
                        响应时间: {results.gemini.time ? `${results.gemini.time}ms` : '计算中...'}
                        {results.gemini.isSimulated && <span className="text-yellow-300 ml-2">(模拟)</span>}
                      </div>
                      <div className="bg-white/5 p-3 rounded text-sm">
                        <div className="text-white/80 whitespace-pre-wrap">{results.gemini.feedback}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-white/50 text-center py-4">等待测试...</div>
                  )}
                </div>

                {/* 豆包结果 */}
                <div className="bg-white/5 border border-white/20 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-green-300">🥟 豆包视觉</h3>
                    {results.doubao && (
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        results.doubao.status === '合格' ? 'bg-green-500' :
                        results.doubao.status === '不合格' ? 'bg-red-500' :
                        results.doubao.status === '测试中' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}>
                        {results.doubao.status}
                      </span>
                    )}
                  </div>
                  
                  {results.doubao ? (
                    <div className="space-y-2">
                      <div className="text-sm text-white/70">
                        响应时间: {results.doubao.time ? `${results.doubao.time}ms` : '计算中...'}
                        {results.doubao.isSimulated && <span className="text-yellow-300 ml-2">(模拟)</span>}
                      </div>
                      <div className="bg-white/5 p-3 rounded text-sm">
                        <div className="text-white/80 whitespace-pre-wrap">{results.doubao.feedback}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-white/50 text-center py-4">等待测试...</div>
                  )}
                </div>

                {/* 对比总结 */}
                {results.gemini && results.doubao && !testing && (
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-lg p-4 mt-6">
                    <h3 className="font-bold text-purple-300 mb-3">🎯 对比总结</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <strong>批改一致性:</strong> 
                        <span className={`ml-2 ${results.gemini.status === results.doubao.status ? 'text-green-300' : 'text-yellow-300'}`}>
                          {results.gemini.status === results.doubao.status ? '✅ 结果一致' : '⚠️ 结果不同'}
                        </span>
                      </div>
                      <div>
                        <strong>响应速度:</strong>
                        <span className="ml-2">
                          {results.gemini.time && results.doubao.time ? (
                            results.gemini.time < results.doubao.time ? 
                            `Gemini更快 (${results.gemini.time}ms vs ${results.doubao.time}ms)` :
                            `豆包更快 (${results.doubao.time}ms vs ${results.gemini.time}ms)`
                          ) : '计算中...'}
                        </span>
                      </div>
                      <div>
                        <strong>批改风格:</strong>
                        <span className="ml-2 text-white/70">
                          {results.gemini.feedback.length > results.doubao.feedback.length 
                            ? 'Gemini反馈更详细' 
                            : results.doubao.feedback.length > results.gemini.feedback.length
                            ? '豆包反馈更详细'
                            : '反馈详细程度相当'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}