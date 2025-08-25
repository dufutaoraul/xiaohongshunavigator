'use client'

import { useEffect } from 'react'
import { useCookieManager } from '../hooks/useCookieManager'
import CookieModal from '../components/CookieModal'
import { Button } from '../../components/ui/button'
import { httpClient } from '../../lib/http-client'

export default function CookieDemoPage() {
  const {
    hasCookie,
    isModalOpen,
    isLoading,
    openCookieModal,
    closeCookieModal,
    onCookieSaved,
    handleApiError
  } = useCookieManager()

  // 监听 Cookie 失效事件
  useEffect(() => {
    const handleCookieInvalid = () => {
      openCookieModal()
    }

    window.addEventListener('cookie-invalid', handleCookieInvalid)
    return () => {
      window.removeEventListener('cookie-invalid', handleCookieInvalid)
    }
  }, [openCookieModal])

  const testApiCall = async () => {
    try {
      const result = await httpClient.get('/api/xhs-proxy/search', {
        params: { keyword: '测试', page: '1' }
      })
      console.log('API 调用成功:', result)
      alert('API 调用成功！请查看控制台输出。')
    } catch (error) {
      console.error('API 调用失败:', error)
      handleApiError(error)
      alert('API 调用失败，请检查 Cookie 配置。')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">正在检查 Cookie 配置...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-center mb-8">
            小红书 Cookie 管理演示
          </h1>

          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">当前状态</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Cookie 状态:</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    hasCookie 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {hasCookie ? '已配置' : '未配置'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">对话框状态:</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    isModalOpen 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isModalOpen ? '已打开' : '已关闭'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">功能测试</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={openCookieModal}
                  variant="outline"
                  className="w-full"
                >
                  打开 Cookie 配置
                </Button>
                
                <Button 
                  onClick={testApiCall}
                  disabled={!hasCookie}
                  className="w-full"
                >
                  测试 API 调用
                </Button>
              </div>

              <div className="text-sm text-gray-600">
                <p>• 首次进入页面时，如果没有 Cookie 会自动弹出配置对话框</p>
                <p>• 点击&quot;测试 API 调用&quot;会模拟调用小红书搜索接口</p>
                <p>• 如果 Cookie 失效，会自动重新弹出配置对话框</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">使用说明</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>点击&quot;打开 Cookie 配置&quot;按钮</li>
                <li>按照教程获取小红书 Cookie</li>
                <li>将 Cookie 粘贴到输入框中</li>
                <li>点击&quot;保存 Cookie&quot;进行验证和保存</li>
                <li>保存成功后即可正常使用搜索功能</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie 配置对话框 */}
      <CookieModal
        isOpen={isModalOpen}
        onClose={closeCookieModal}
        onCookieSaved={onCookieSaved}
      />
    </div>
  )
}