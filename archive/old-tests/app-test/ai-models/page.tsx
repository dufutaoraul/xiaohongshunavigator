'use client';

import { useState } from 'react';
import Link from 'next/link';

interface TestResult {
  success: boolean;
  result?: any;
  analysis?: any;
  error?: string;
}

export default function AIModelsTestPage() {
  const [testImages, setTestImages] = useState<string[]>([
    'https://example.com/test-image-1.jpg',
    'https://example.com/test-image-2.jpg'
  ]);
  const [prompt, setPrompt] = useState('请分析这张作业截图是否符合要求');
  const [imageCount, setImageCount] = useState(10);
  const [loading, setLoading] = useState<{[key: string]: boolean}>({});
  const [results, setResults] = useState<{[key: string]: TestResult}>({});

  const testModels = [
    {
      id: 'gemini',
      name: 'Gemini 2.0 Flash',
      endpoint: '/api/test/gemini-2',
      description: 'Google最新视觉模型，支持图像分析',
      color: 'from-blue-500 to-purple-600'
    },
    {
      id: 'doubao',
      name: '豆包视觉模型',
      endpoint: '/api/test/doubao',
      description: '字节跳动豆包视觉模型，国产化解决方案',
      color: 'from-green-500 to-blue-500'
    }
  ];

  const handleTest = async (modelId: string, endpoint: string) => {
    setLoading(prev => ({ ...prev, [modelId]: true }));
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testImages: testImages.slice(0, Math.max(1, Math.min(imageCount, 10))),
          prompt: prompt,
          modelVersion: modelId === 'gemini' ? 'gemini-2.0-flash-exp' : 'doubao-vision-32k'
        })
      });

      const result = await response.json();
      setResults(prev => ({ ...prev, [modelId]: result }));
      
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [modelId]: { 
          success: false, 
          error: error instanceof Error ? error.message : '测试失败' 
        } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, [modelId]: false }));
    }
  };

  const handleCostComparison = async () => {
    setLoading(prev => ({ ...prev, comparison: true }));
    
    try {
      const response = await fetch('/api/test/cost-comparison', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          testImageCount: imageCount,
          prompt: prompt,
          includeGemini: true,
          includeDoubao: true,
          scale1000: true
        })
      });

      const result = await response.json();
      setResults(prev => ({ ...prev, comparison: result }));
      
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        comparison: { 
          success: false, 
          error: error instanceof Error ? error.message : '成本对比失败' 
        } 
      }));
    } finally {
      setLoading(prev => ({ ...prev, comparison: false }));
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
            🤖 AI视觉模型测试中心
          </h1>

          {/* 测试配置 */}
          <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4">测试配置</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  测试图片数量
                </label>
                <input
                  type="number"
                  value={imageCount}
                  onChange={(e) => setImageCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                  min="1"
                  max="100"
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                />
                <p className="text-xs text-white/60 mt-1">模拟处理图片数量（1-100张）</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  测试提示词
                </label>
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  placeholder="输入测试提示词"
                />
              </div>
            </div>
          </div>

          {/* 模型测试按钮 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {testModels.map((model) => (
              <div key={model.id} className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-2">{model.name}</h3>
                <p className="text-white/70 text-sm mb-4">{model.description}</p>
                
                <button
                  onClick={() => handleTest(model.id, model.endpoint)}
                  disabled={loading[model.id]}
                  className={`w-full bg-gradient-to-r ${model.color} text-white py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all`}
                >
                  {loading[model.id] ? '测试中...' : `测试 ${model.name}`}
                </button>
                
                {/* 显示测试结果 */}
                {results[model.id] && (
                  <div className="mt-4 p-3 bg-white/5 rounded-lg">
                    {results[model.id].success ? (
                      <div className="text-green-300">
                        <div className="text-xs">✅ 测试成功</div>
                        {results[model.id].result?.isSimulated && (
                          <div className="text-yellow-300 text-xs mt-1">⚠️ 模拟模式（未配置API密钥）</div>
                        )}
                        <div className="text-xs mt-2">
                          <div>响应: {results[model.id].result?.response?.substring(0, 50)}...</div>
                          <div>成本: {results[model.id].result?.estimatedCost?.totalCost?.toFixed(6)} {results[model.id].result?.estimatedCost?.currency}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-red-300 text-xs">
                        ❌ {results[model.id].error}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* 成本对比 */}
            <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-2">💰 成本对比分析</h3>
              <p className="text-white/70 text-sm mb-4">对比两个模型的使用成本</p>
              
              <button
                onClick={handleCostComparison}
                disabled={loading.comparison}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 text-white py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {loading.comparison ? '分析中...' : '开始成本对比'}
              </button>
              
              {/* 成本对比结果 */}
              {results.comparison && (
                <div className="mt-4 p-3 bg-white/5 rounded-lg">
                  {results.comparison.success ? (
                    <div className="text-green-300">
                      <div className="text-xs">✅ 对比完成</div>
                      {results.comparison.analysis?.comparison && (
                        <div className="text-xs mt-2 space-y-1">
                          <div>更便宜的模型: {results.comparison.analysis.comparison.singleBatch?.cheaperModel}</div>
                          <div>成本差异: {results.comparison.analysis.comparison.singleBatch?.percentageDifference}</div>
                          <div className="text-yellow-300">💡 {results.comparison.analysis.comparison.recommendation?.primary}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-red-300 text-xs">
                      ❌ {results.comparison.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 详细结果展示 */}
          {Object.entries(results).some(([_, result]) => result.success && (result.result || result.analysis)) && (
            <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">📊 详细测试结果</h2>
              
              <div className="space-y-6">
                {Object.entries(results).map(([key, result]) => {
                  if (!result.success || (!result.result && !result.analysis)) return null;
                  
                  return (
                    <div key={key} className="border-l-4 border-purple-500 pl-4">
                      <h3 className="font-bold text-lg mb-2">
                        {key === 'comparison' ? '💰 成本对比分析' : 
                         key === 'gemini' ? '🔥 Gemini 2.0 测试' : 
                         key === 'doubao' ? '🥟 豆包视觉模型测试' : key}
                      </h3>
                      
                      <div className="bg-white/5 p-4 rounded-lg">
                        <pre className="text-sm text-white/80 whitespace-pre-wrap overflow-x-auto">
                          {JSON.stringify(result.result || result.analysis, null, 2)}
                        </pre>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 使用说明 */}
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-2xl p-6 mt-8">
            <h2 className="text-lg font-bold text-blue-300 mb-4">📖 使用说明</h2>
            <div className="text-sm text-blue-200/80 space-y-2">
              <p>• <strong>Gemini 2.0</strong>: Google最新视觉模型，图像分析能力强，但需要配置GEMINI_API_KEY</p>
              <p>• <strong>豆包视觉模型</strong>: 字节跳动推出，国产化方案，需要配置DOUBAO_API_KEY</p>
              <p>• <strong>成本对比</strong>: 自动计算不同规模下的使用成本，包含1000张图片处理的月度估算</p>
              <p>• <strong>模拟模式</strong>: 未配置API密钥时会返回模拟结果，用于测试接口连通性</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}