'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function TestRealXHSPage() {
  const [searchKeyword, setSearchKeyword] = useState('美食')
  const [searchResult, setSearchResult] = useState<any>(null)
  const [profileResult, setProfileResult] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{userId: string, xsecToken: string, nickname: string} | null>(null)

  const handleSearch = async () => {
    setIsSearching(true)
    setSearchResult(null)

    try {
      const response = await fetch('/api/xhs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ keyword: searchKeyword })
      })

      const data = await response.json()
      setSearchResult(data)
    } catch (error) {
      setSearchResult({
        success: false,
        error: error instanceof Error ? error.message : '请求失败'
      })
    } finally {
      setIsSearching(false)
    }
  }

  const handleGetUserProfile = async (userId: string, xsecToken: string, nickname: string) => {
    setIsLoadingProfile(true)
    setProfileResult(null)
    setSelectedUser({ userId, xsecToken, nickname })

    try {
      const response = await fetch('/api/xhs/user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, xsecToken })
      })

      const data = await response.json()
      setProfileResult(data)
    } catch (error) {
      setProfileResult({
        success: false,
        error: error instanceof Error ? error.message : '请求失败'
      })
    } finally {
      setIsLoadingProfile(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          真实小红书数据测试
        </h1>

        {/* 搜索部分 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔍 搜索小红书内容</h2>

          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="输入搜索关键词..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className={`px-6 py-2 rounded-lg text-white font-medium ${
                isSearching
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              {isSearching ? '搜索中...' : '搜索'}
            </button>
          </div>

          {searchResult && (
            <div className={`p-4 rounded-lg ${
              searchResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {searchResult.success ? (
                <div>
                  <div className="font-medium text-green-800 mb-3">
                    ✅ {searchResult.message}
                  </div>

                  <div className="grid gap-4">
                    {searchResult.data.posts.slice(0, 5).map((post: any, index: number) => (
                      <div key={index} className="bg-white p-4 rounded-lg border">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{post.title || '无标题'}</h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {post.description?.substring(0, 100)}...
                            </p>
                          </div>
                          {post.coverImage && (
                            <Image
                              src={post.coverImage}
                              alt="封面"
                              width={80}
                              height={80}
                              className="w-20 h-20 object-cover rounded ml-4"
                            />
                          )}
                        </div>

                        <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                          <div>
                            作者: <span className="font-medium">{post.author.nickname}</span>
                          </div>
                          <div className="flex gap-4">
                            <span>❤️ {post.stats.likes}</span>
                            <span>💬 {post.stats.comments}</span>
                            <span>⭐ {post.stats.collections}</span>
                          </div>
                        </div>

                        {post.userIdForProfile && post.xsecToken && (
                          <button
                            onClick={() => handleGetUserProfile(post.userIdForProfile, post.xsecToken, post.author.nickname)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                            disabled={isLoadingProfile}
                          >
                            {isLoadingProfile && selectedUser?.userId === post.userIdForProfile
                              ? '获取中...'
                              : '获取用户主页数据'
                            }
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-medium text-red-800">
                    ❌ 搜索失败
                  </div>
                  <p className="mt-2 text-red-700">
                    {searchResult.error}
                  </p>
                  {searchResult.suggestion && (
                    <p className="mt-2 text-red-600 text-sm">
                      💡 {searchResult.suggestion}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 用户主页数据部分 */}
        {profileResult && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              👤 用户主页数据 {selectedUser && `- ${selectedUser.nickname}`}
            </h2>

            <div className={`p-4 rounded-lg ${
              profileResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              {profileResult.success ? (
                <div>
                  <div className="font-medium text-green-800 mb-4">
                    ✅ {profileResult.message}
                  </div>

                  {/* 用户信息 */}
                  <div className="bg-white p-4 rounded-lg mb-4">
                    <h3 className="font-medium mb-3">基本信息</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">昵称:</span>
                        <span className="ml-2 font-medium">{profileResult.data.userInfo.nickname}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">粉丝:</span>
                        <span className="ml-2 font-medium">{profileResult.data.userInfo.stats.followers}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">关注:</span>
                        <span className="ml-2 font-medium">{profileResult.data.userInfo.stats.following}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">帖子数:</span>
                        <span className="ml-2 font-medium">{profileResult.data.userInfo.stats.posts}</span>
                      </div>
                    </div>
                  </div>

                  {/* 帖子列表 */}
                  <div className="bg-white p-4 rounded-lg">
                    <h3 className="font-medium mb-3">最新帖子 ({profileResult.data.posts.length}个)</h3>
                    <div className="space-y-3">
                      {profileResult.data.posts.slice(0, 10).map((post: any, index: number) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm">{post.title || '无标题'}</h4>
                              <p className="text-xs text-gray-600 mt-1">
                                {post.description?.substring(0, 80)}...
                              </p>
                            </div>
                            <div className="text-xs text-gray-500 ml-4 space-y-1">
                              <div>❤️ {post.stats.likes}</div>
                              <div>💬 {post.stats.comments}</div>
                              <div>⭐ {post.stats.collections}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-medium text-red-800">
                    ❌ 获取用户数据失败
                  </div>
                  <p className="mt-2 text-red-700">
                    {profileResult.error}
                  </p>
                  {profileResult.suggestion && (
                    <p className="mt-2 text-red-600 text-sm">
                      💡 {profileResult.suggestion}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}