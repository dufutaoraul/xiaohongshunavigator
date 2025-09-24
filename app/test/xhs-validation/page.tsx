'use client'

import { useState } from 'react'
import { validateXHSPost, parseXHSUrl, normalizeXHSUrl, hasXHSProfileBound } from '@/lib/xhs-validator'
import Button from '../../components/Button'
import Input from '../../components/Input'

export default function XHSValidationTestPage() {
  const [testUrl, setTestUrl] = useState('')
  const [profileUrl, setProfileUrl] = useState('')
  const [existingUrls, setExistingUrls] = useState('')
  const [result, setResult] = useState<any>(null)

  const handleTest = () => {
    const existingUrlList = existingUrls.split('\n').filter(url => url.trim())

    // 将URL列表转换为记录格式（测试用）
    const existingRecords = existingUrlList.map((url, index) => ({
      xhs_url: url,
      student_id: `TEST_USER_${index + 1}`
    }))

    // 解析URL信息
    const urlInfo = parseXHSUrl(testUrl)
    const profileInfo = profileUrl ? parseXHSUrl(profileUrl) : null

    // 验证帖子
    const validation = validateXHSPost(testUrl, profileUrl || undefined, existingRecords)

    // 其他辅助信息
    const normalized = normalizeXHSUrl(testUrl)
    const hasProfile = hasXHSProfileBound(profileUrl)

    setResult({
      urlInfo,
      profileInfo,
      validation,
      normalized,
      hasProfile
    })
  }

  return (
    <div className="min-h-screen relative">
      <div className="cosmic-bg"></div>

      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-effect p-8 mb-8">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4 breathing-glow">🧪</div>
              <h1 className="text-3xl font-bold gradient-text mb-4">
                小红书链接验证测试工具
              </h1>
              <p className="text-white/70">
                测试小红书帖子验证功能的各种场景
              </p>
            </div>

            <div className="space-y-6">
              <Input
                label="测试帖子链接"
                placeholder="https://www.xiaohongshu.com/explore/..."
                value={testUrl}
                onChange={setTestUrl}
              />

              <Input
                label="用户主页链接（可选）"
                placeholder="https://www.xiaohongshu.com/user/profile/..."
                value={profileUrl}
                onChange={setProfileUrl}
              />

              <div>
                <label className="block text-white font-medium mb-2">已存在的帖子链接（每行一个）</label>
                <textarea
                  value={existingUrls}
                  onChange={(e) => setExistingUrls(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400 min-h-[120px]"
                  placeholder="https://www.xiaohongshu.com/explore/existed1&#10;https://www.xiaohongshu.com/explore/existed2"
                />
              </div>

              <Button
                onClick={handleTest}
                disabled={!testUrl.trim()}
                className="w-full"
              >
                开始测试验证
              </Button>
            </div>

            {result && (
              <div className="mt-8 space-y-6">
                <div className="glass-effect p-6 border border-blue-500/30">
                  <h3 className="text-xl font-bold text-blue-300 mb-4">🔍 验证结果</h3>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">URL解析信息</h4>
                      <div className="space-y-2 text-sm">
                        <div className="text-white/80">
                          <span className="text-white">有效小红书链接:</span>{' '}
                          <span className={result.urlInfo.isValidXHSUrl ? 'text-green-300' : 'text-red-300'}>
                            {result.urlInfo.isValidXHSUrl ? '✅ 是' : '❌ 否'}
                          </span>
                        </div>
                        {result.urlInfo.postId && (
                          <div className="text-white/80">
                            <span className="text-white">帖子ID:</span> {result.urlInfo.postId}
                          </div>
                        )}
                        {result.urlInfo.userId && (
                          <div className="text-white/80">
                            <span className="text-white">用户ID:</span> {result.urlInfo.userId}
                          </div>
                        )}
                        <div className="text-white/80">
                          <span className="text-white">标准化URL:</span> {result.normalized}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-white mb-3">主页绑定信息</h4>
                      <div className="space-y-2 text-sm">
                        <div className="text-white/80">
                          <span className="text-white">已绑定主页:</span>{' '}
                          <span className={result.hasProfile ? 'text-green-300' : 'text-yellow-300'}>
                            {result.hasProfile ? '✅ 是' : '⚠️ 否'}
                          </span>
                        </div>
                        {result.profileInfo && (
                          <>
                            <div className="text-white/80">
                              <span className="text-white">主页有效性:</span>{' '}
                              <span className={result.profileInfo.isValidXHSUrl ? 'text-green-300' : 'text-red-300'}>
                                {result.profileInfo.isValidXHSUrl ? '✅ 有效' : '❌ 无效'}
                              </span>
                            </div>
                            {result.profileInfo.userId && (
                              <div className="text-white/80">
                                <span className="text-white">主页用户ID:</span> {result.profileInfo.userId}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 border-t border-white/20">
                    <h4 className="text-lg font-semibold text-white mb-3">最终验证结果</h4>
                    <div className="space-y-2">
                      <div className="text-white/80">
                        <span className="text-white">验证状态:</span>{' '}
                        <span className={result.validation.isValid ? 'text-green-300' : 'text-red-300'}>
                          {result.validation.isValid ? '✅ 通过' : '❌ 不通过'}
                        </span>
                      </div>
                      <div className="text-white/80">
                        <span className="text-white">验证原因:</span> {result.validation.reason}
                      </div>
                      {result.validation.userInfo && (
                        <div className="text-white/80">
                          <span className="text-white">用户信息:</span> {JSON.stringify(result.validation.userInfo)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="glass-effect p-6 border border-green-500/30">
                  <h3 className="text-xl font-bold text-green-300 mb-4">📋 测试用例推荐</h3>
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="text-white font-medium mb-2">有效帖子链接:</h4>
                      <div className="text-green-200 font-mono text-xs bg-green-500/10 p-2 rounded">
                        https://www.xiaohongshu.com/explore/67123abc456def789
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-2">有效主页链接:</h4>
                      <div className="text-green-200 font-mono text-xs bg-green-500/10 p-2 rounded">
                        https://www.xiaohongshu.com/user/profile/5f1a2b3c4d5e6f7g8h9i
                      </div>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-2">短链接:</h4>
                      <div className="text-blue-200 font-mono text-xs bg-blue-500/10 p-2 rounded">
                        https://xhslink.com/AbCdEf123
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}