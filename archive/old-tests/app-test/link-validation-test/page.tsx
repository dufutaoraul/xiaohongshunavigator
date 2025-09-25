'use client'

import { useState } from 'react'

export default function LinkValidationTestPage() {
  const [testResults, setTestResults] = useState<any[]>([])

  // 复制验证函数逻辑用于测试
  const validateXiaohongshuUrl = (url: string): boolean => {
    if (!url.trim()) return false

    const trimmedUrl = url.trim()

    // 支持多种小红书链接格式
    const patterns = [
      // 标准小红书链接格式
      /^https?:\/\/(www\.)?xiaohongshu\.com\/user\/profile\/[a-zA-Z0-9]+(\?.*)?$/,
      // 小红书短链接格式 (xhslink.com)
      /^https?:\/\/xhslink\.com\/[a-zA-Z0-9]+$/,
      // 手机端分享链接格式
      /^https?:\/\/xhslink\.com\/m\/[a-zA-Z0-9]+$/
    ]

    return patterns.some(pattern => pattern.test(trimmedUrl))
  }

  const testUrls = [
    // 应该通过的URL
    { url: 'https://www.xiaohongshu.com/user/profile/123abc', expected: true, type: '标准格式' },
    { url: 'https://xiaohongshu.com/user/profile/456def', expected: true, type: '标准格式(无www)' },
    { url: 'http://www.xiaohongshu.com/user/profile/789ghi', expected: true, type: '标准格式(http)' },
    { url: 'https://www.xiaohongshu.com/user/profile/abc123?from=share', expected: true, type: '标准格式(带参数)' },
    { url: 'https://xhslink.com/4QrcHHG8mfR', expected: true, type: '短链接格式' },
    { url: 'https://xhslink.com/m/4QrcHHG8mfR', expected: true, type: '手机端短链接格式' },
    { url: 'http://xhslink.com/testlink123', expected: true, type: '短链接格式(http)' },

    // 应该不通过的URL
    { url: '', expected: false, type: '空字符串' },
    { url: 'https://www.example.com', expected: false, type: '其他网站' },
    { url: 'https://xiaohongshu.com/note/123', expected: false, type: '笔记链接' },
    { url: 'not-a-url', expected: false, type: '无效URL' },
    { url: 'https://xhslink.org/test', expected: false, type: '错误域名' }
  ]

  const runTests = () => {
    const results = testUrls.map(test => {
      const actual = validateXiaohongshuUrl(test.url)
      const passed = actual === test.expected
      return {
        ...test,
        actual,
        passed
      }
    })
    setTestResults(results)
  }

  const passedTests = testResults.filter(r => r.passed).length
  const totalTests = testResults.length

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 小红书链接格式验证测试
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">链接格式支持测试</h2>
            <button
              onClick={runTests}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              🚀 开始测试
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="mb-4">
              <div className="text-lg font-medium">
                测试结果: {passedTests}/{totalTests} 通过
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  passedTests === totalTests
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {passedTests === totalTests ? '✅ 全部通过' : '❌ 有失败'}
                </span>
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-50 rounded-lg mb-6">
            <h3 className="font-medium text-blue-900 mb-2">✨ 新增支持的格式</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• <strong>标准格式:</strong> https://www.xiaohongshu.com/user/profile/xxxxxx</li>
              <li>• <strong>短链接:</strong> https://xhslink.com/xxxxxx</li>
              <li>• <strong>手机端短链接:</strong> https://xhslink.com/m/xxxxxx</li>
              <li className="text-green-700 font-medium">📱 现在支持手机端复制的短链接格式！</li>
            </ul>
          </div>
        </div>

        {testResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">详细测试结果</h2>

            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.passed
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-mono text-sm text-gray-700 mb-1">
                        {result.url || '(空字符串)'}
                      </div>
                      <div className="text-xs text-gray-500">
                        类型: {result.type}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${
                        result.passed ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {result.passed ? '✅ 通过' : '❌ 失败'}
                      </div>
                      <div className="text-xs text-gray-500">
                        期望: {result.expected ? '通过' : '拒绝'},
                        实际: {result.actual ? '通过' : '拒绝'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}