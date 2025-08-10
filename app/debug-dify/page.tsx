'use client'

import React, { useState } from 'react'
import Button from '../components/Button'
import Card from '../components/Card'

export default function DebugDifyPage() {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testDifyAPI = async () => {
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const testData = {
        student_id: 'AXCF2025040088',
        user_input: '如何用AI提升工作效率',
        angle: '效率提升',
        day_number: 1
      }

      console.log('发送测试请求...', testData)

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData)
      })

      const result = await response.json()
      console.log('API响应:', result)
      setResponse(result)

      if (!response.ok) {
        setError(`API调用失败: ${response.status} ${response.statusText}`)
      }
    } catch (err) {
      console.error('调试错误:', err)
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-white to-red-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔬 Dify API 调试控制台
          </h1>
          <p className="text-gray-600">
            测试和分析Dify API的真实响应结构
          </p>
        </div>

        <Card title="🚀 测试控制" icon="🚀" className="mb-6">
          <Button 
            onClick={testDifyAPI}
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
          >
            {loading ? '🔄 调用中...' : '🎯 测试 Dify API'}
          </Button>
        </Card>

        {error && (
          <Card title="❌ 错误信息" icon="❌" className="mb-6 border-red-200 bg-red-50">
            <pre className="text-red-700 whitespace-pre-wrap text-sm">
              {error}
            </pre>
          </Card>
        )}

        {response && (
          <Card title="📊 API 响应数据" icon="📊" className="mb-6">
            <div className="mb-4">
              {response.dify && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                  ✅ Dify 生成
                </span>
              )}
              {response.mock && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                  ⚠️ 模拟数据
                </span>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-gray-700">原始响应 JSON:</h3>
                <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>

              {response.titles && (
                <div>
                  <h3 className="font-semibold mb-2 text-gray-700">标题数组 ({response.titles.length}个):</h3>
                  <div className="space-y-2">
                    {response.titles.map((title: any, index: number) => (
                      <div key={index} className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                        <strong>ID:</strong> {title.id} <br />
                        <strong>内容:</strong> {title.content}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {response.bodies && (
                <div>
                  <h3 className="font-semibold mb-2 text-gray-700">正文数组 ({response.bodies.length}个):</h3>
                  <div className="space-y-2">
                    {response.bodies.map((body: any, index: number) => (
                      <div key={index} className="bg-green-50 p-3 rounded border-l-4 border-green-400">
                        <strong>ID:</strong> {body.id} <br />
                        <strong>风格:</strong> {body.style} <br />
                        <strong>内容:</strong>
                        <pre className="mt-2 whitespace-pre-wrap text-sm">
                          {body.content}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {response.hashtags && (
                <div>
                  <h3 className="font-semibold mb-2 text-gray-700">标签:</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-50 p-3 rounded">
                      <strong>固定标签 ({response.hashtags.fixed?.length || 0}个):</strong>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {response.hashtags.fixed?.map((tag: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-purple-200 rounded-full text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded">
                      <strong>生成标签 ({response.hashtags.generated?.length || 0}个):</strong>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {response.hashtags.generated?.map((tag: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-orange-200 rounded-full text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {response.visuals && (
                <div>
                  <h3 className="font-semibold mb-2 text-gray-700">视觉建议:</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {response.visuals.images && (
                      <div className="bg-pink-50 p-3 rounded">
                        <strong>图片建议 ({response.visuals.images.length}个):</strong>
                        <ul className="mt-2 space-y-1">
                          {response.visuals.images.map((img: any, index: number) => (
                            <li key={index} className="text-sm">• {img.suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {response.visuals.videos && (
                      <div className="bg-cyan-50 p-3 rounded">
                        <strong>视频建议 ({response.visuals.videos.length}个):</strong>
                        <ul className="mt-2 space-y-1">
                          {response.visuals.videos.map((vid: any, index: number) => (
                            <li key={index} className="text-sm">• {vid.suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        <Card title="📝 调试说明" icon="📝">
          <div className="text-sm text-gray-600 space-y-2">
            <p>• 此页面专门用于测试和分析 Dify API 的响应结构</p>
            <p>• 点击测试按钮后，会发送固定的测试数据到 /api/generate 接口</p>
            <p>• 查看控制台和上方的响应数据，了解真实的Dify输出格式</p>
            <p>• 绿色标记表示数据来自Dify API，黄色标记表示使用了模拟数据</p>
          </div>
        </Card>
      </div>
    </div>
  )
}