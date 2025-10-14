'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function TestPublishPage() {
  const [isPublishing, setIsPublishing] = useState(false)
  const [result, setResult] = useState<any>(null)

  const postContent = {
    title: '🎨 毛利水下岩雕艺术',
    content: `🎨 你知道吗？在纽西兰陶波湖的湖底，有一个令人惊叹的毛利岩雕！
这座10米高的雕像完全用岩石雕刻，描绘的是Ngātoroirangi——毛利传说中将火山带到这片土地的勇士。

🌊 **艺术与自然的完美融合**
- 雕刻高度：10米
- 雕刻年代：1980年
- 艺术家：Matahi Whakataka-Brightwell
- 位置：距离湖岸约50米的水下

⛵ **为什么这么特别？**
✓ 世界上为数不多的水下雕塑之一
✓ 只能通过潜水或乘船才能完全欣赏
✓ 融合了毛利文化与现代艺术

🎯 **打卡攻略**
📍 位置：纽西兰北岛陶波湖
🚤 最佳观赏：乘船游览或潜水
📷 拍照建议：清晨光线最柔和

#纽西兰旅行 #陶波湖 #毛利文化 #水下艺术 #隐藏景点 #艺术打卡 #北岛探索 #小众景点`,
    imageUrls: ['https://cn.bing.com/th?id=OHR.MaoriRock_EN-US6499689741_UHD.jpg&w=3840']
  }

  const handlePublish = async () => {
    setIsPublishing(true)
    setResult(null)

    try {
      // 使用原始API（会返回错误提示）
      const response = await fetch('/api/xhs/publish-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(postContent)
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : '请求失败'
      })
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          测试小红书帖子发布
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">帖子内容预览</h2>

          <div className="mb-4">
            <h3 className="font-medium text-gray-700 mb-2">标题：</h3>
            <p className="text-gray-900">{postContent.title}</p>
          </div>

          <div className="mb-4">
            <h3 className="font-medium text-gray-700 mb-2">内容：</h3>
            <div className="whitespace-pre-wrap text-gray-900 bg-gray-50 p-4 rounded">
              {postContent.content}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-2">配图：</h3>
            <Image
              src={postContent.imageUrls[0]}
              alt="纽西兰陶波湖毛利岩雕"
              width={400}
              height={300}
              className="max-w-md rounded-lg shadow-sm"
            />
          </div>

          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className={`px-6 py-3 rounded-lg text-white font-medium ${
              isPublishing
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isPublishing ? '发布中...' : '发布到小红书'}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              发布结果
            </h2>

            <div className={`p-4 rounded-lg ${
              result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.success ? '✅ 发布成功' : '❌ 发布失败'}
              </div>

              {result.message && (
                <p className={`mt-2 ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </p>
              )}

              {result.error && (
                <p className="mt-2 text-red-700">
                  错误：{result.error}
                </p>
              )}

              {result.data && (
                <div className="mt-4">
                  <h3 className="font-medium text-gray-700 mb-2">响应数据：</h3>
                  <pre className="text-sm bg-gray-100 p-3 rounded overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}