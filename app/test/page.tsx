'use client'

import { useState } from 'react'

export default function TestPage() {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string>('')

  const runTest = async () => {
    setTesting(true)
    setError('')
    setResult(null)

    try {
      console.log('🔄 开始测试 API 生成流程...');
      
      const testData = {
        student_id: 'AXCF2025040088',
        user_input: '如何用AI提升工作效率',
        angle: 'efficiency',
        day_number: 15
      };

      console.log('📤 发送测试请求:', testData);
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      });

      console.log('📥 响应状态:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API 调用失败: ${response.status} - ${errorText}`);
      }

      const apiResult = await response.json();
      setResult(apiResult);
      
      console.log('✅ API 调用成功!');
      console.log('📊 响应数据:', apiResult);

      // 将数据保存到localStorage供结果页面使用
      localStorage.setItem('generatedContent', JSON.stringify(apiResult));
      console.log('💾 数据已保存到 localStorage');

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '未知错误';
      setError(errorMsg);
      console.error('💥 测试失败:', err);
    } finally {
      setTesting(false);
    }
  };

  const goToResult = () => {
    if (result) {
      // 确保数据在localStorage中
      localStorage.setItem('generatedContent', JSON.stringify(result));
      window.open('/result', '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-pink-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          🧪 API 流程测试页面
        </h1>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">测试说明</h2>
          <ul className="text-white/80 space-y-2 text-sm">
            <li>• 点击下方按钮测试 /api/generate 接口</li>
            <li>• 查看API响应数据结构是否正确</li>
            <li>• 测试成功后可跳转到结果页面验证显示效果</li>
            <li>• 检查Dify数据源标识和界面优化效果</li>
          </ul>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 mb-6">
          <div className="flex gap-4 mb-4">
            <button
              onClick={runTest}
              disabled={testing}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white rounded-lg transition-colors font-medium"
            >
              {testing ? '🔄 测试中...' : '🚀 开始测试'}
            </button>

            {result && (
              <button
                onClick={goToResult}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors font-medium"
              >
                📊 查看结果页面
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4 mb-4">
              <h3 className="text-red-300 font-semibold mb-2">❌ 测试失败</h3>
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4">
              <h3 className="text-green-300 font-semibold mb-2">✅ 测试成功</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-white/60">数据来源:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    result.dify ? 'bg-green-500/30 text-green-300' :
                    result.mock ? 'bg-yellow-500/30 text-yellow-300' :
                    'bg-purple-500/30 text-purple-300'
                  }`}>
                    {result.dify ? '✅ Dify AI' : result.mock ? '⚠️ 模拟数据' : '🔧 测试数据'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white/70">
                  <div>标题: {result.titles?.length || 0}个</div>
                  <div>正文: {result.bodies?.length || 0}个</div>
                  <div>固定标签: {result.hashtags?.fixed?.length || 0}个</div>
                  <div>生成标签: {result.hashtags?.generated?.length || 0}个</div>
                  <div>图片建议: {result.visuals?.images?.length || 0}个</div>
                  <div>视频建议: {result.visuals?.videos?.length || 0}个</div>
                </div>
              </div>

              <details className="mt-4">
                <summary className="text-white/80 cursor-pointer hover:text-white">
                  📋 查看完整响应数据
                </summary>
                <pre className="mt-2 bg-black/20 p-4 rounded text-xs text-white/60 overflow-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-white/50 text-sm">
            💡 打开浏览器控制台查看详细的测试日志
          </p>
        </div>
      </div>
    </div>
  )
}