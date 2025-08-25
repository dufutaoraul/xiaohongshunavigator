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
  const [testFiles, setTestFiles] = useState<File[]>([]);
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

  // 处理文件上传
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setTestFiles(Array.from(e.target.files));
    }
  };

  // 真实AI批改测试
  const callRealAIGrading = async (model: 'gemini' | 'doubao', assignmentDescription: string, attachmentUrls: string[]) => {
    const startTime = Date.now();
    
    try {
      const endpoint = model === 'gemini' ? '/api/test/gemini-2' : '/api/test/doubao';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testImages: attachmentUrls,
          prompt: `请根据以下作业要求批改这些图片：${assignmentDescription}`,
          modelVersion: model === 'gemini' ? 'gemini-2.0-flash-exp' : 'doubao-vision-32k'
        })
      });

      const result = await response.json();
      const endTime = Date.now();
      
      if (response.ok && result.success) {
        // 解析AI响应，判断合格状态
        const feedback = result.result.response || 'No response';
        const isQualified = feedback.includes('合格') && !feedback.includes('不合格');
        
        return {
          model: model === 'gemini' ? 'Gemini 2.0' : '豆包视觉',
          status: isQualified ? '合格' : '不合格',
          feedback: feedback,
          time: endTime - startTime,
          isSimulated: result.result.isSimulated || false
        } as AIResult;
      } else {
        return {
          model: model === 'gemini' ? 'Gemini 2.0' : '豆包视觉',
          status: '失败',
          feedback: result.error || 'API调用失败',
          time: endTime - startTime,
          isSimulated: false
        } as AIResult;
      }
      
    } catch (error) {
      return {
        model: model === 'gemini' ? 'Gemini 2.0' : '豆包视觉',
        status: '失败' as const,
        feedback: '网络错误: ' + (error instanceof Error ? error.message : 'Unknown error'),
        time: Date.now() - startTime,
        isSimulated: false
      };
    }
  };

  // 开始AI对比测试
  const startComparison = async () => {
    if (!selectedAssignment || testFiles.length === 0) {
      alert('请选择作业项目并上传测试图片');
      return;
    }

    setTesting(true);
    setResults({ gemini: null, doubao: null });

    try {
      // 先上传文件获取URL
      console.log('📤 开始上传文件...');
      const formData = new FormData();
      testFiles.forEach(file => {
        formData.append('files', file);
      });
      formData.append('studentId', 'AI_TEST_USER');
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      let attachmentUrls: string[] = [];
      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        attachmentUrls = uploadResult.urls;
        console.log('✅ 文件上传成功:', attachmentUrls);
      } else {
        // 如果文件上传失败，使用base64编码作为备用方案
        console.warn('⚠️ 文件上传失败，使用base64编码作为备用方案');
        attachmentUrls = await Promise.all(
          testFiles.map(file => new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          }))
        );
      }

      // 设置测试中状态
      setResults({
        gemini: { model: 'Gemini 2.0', status: '测试中', feedback: '正在调用Gemini 2.0 API...', time: 0 },
        doubao: { model: '豆包视觉', status: '测试中', feedback: '正在调用豆包视觉API...', time: 0 }
      });

      // 并发调用两个AI模型
      const [geminiResult, doubaoResult] = await Promise.allSettled([
        callRealAIGrading('gemini', selectedAssignment.description, attachmentUrls),
        callRealAIGrading('doubao', selectedAssignment.description, attachmentUrls)
      ]);

      setResults({
        gemini: geminiResult.status === 'fulfilled' ? geminiResult.value : {
          model: 'Gemini 2.0',
          status: '失败',
          feedback: 'Promise rejected: ' + (geminiResult.reason || 'Unknown error'),
          time: 0
        },
        doubao: doubaoResult.status === 'fulfilled' ? doubaoResult.value : {
          model: '豆包视觉',
          status: '失败',
          feedback: 'Promise rejected: ' + (doubaoResult.reason || 'Unknown error'),
          time: 0
        }
      });
      
    } catch (error) {
      console.error('AI对比测试失败:', error);
      setResults({
        gemini: { model: 'Gemini 2.0', status: '失败', feedback: error instanceof Error ? error.message : 'Unknown error', time: 0 },
        doubao: { model: '豆包视觉', status: '失败', feedback: error instanceof Error ? error.message : 'Unknown error', time: 0 }
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
          
          <div className="bg-green-500/10 border border-green-400/30 rounded-2xl p-4 mb-8">
            <div className="flex items-center">
              <div className="text-2xl mr-3">🎯</div>
              <div>
                <p className="text-green-300 font-medium">真实AI测试模式</p>
                <p className="text-green-200/80 text-sm">
                  上传真实图片，调用Gemini 2.0和豆包视觉API进行实际批改对比。选择作业项目并上传图片后开始测试。
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

                {/* 真实图片上传 */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    上传测试图片
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                  />
                  
                  {testFiles.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-white/80 mb-2">已选择 {testFiles.length} 个文件:</p>
                      <div className="space-y-1">
                        {testFiles.map((file, index) => (
                          <div key={index} className="text-sm text-white/70 bg-white/5 px-3 py-2 rounded">
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-white/60 mt-2">支持JPG、PNG、GIF等格式，建议每个文件不超过5MB</p>
                </div>

                {/* 开始测试按钮 */}
                <button
                  onClick={startComparison}
                  disabled={!selectedAssignment || testFiles.length === 0 || testing}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {testing ? '🔄 正在测试中...' : '🚀 开始真实AI对比测试'}
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