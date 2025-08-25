'use client';

import { useState, useEffect } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { HotNotesCarousel } from '../components/HotNotesCarousel';

export default function TestXhsBridgePage() {
  const [fastApiStatus, setFastApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [searchKeyword, setSearchKeyword] = useState('美食');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [cookies, setCookies] = useState('');

  // 检查FastAPI服务状态
  const checkFastApiStatus = async () => {
    try {
      setFastApiStatus('checking');
      const response = await fetch('/api/xhs-proxy?action=health');
      const result = await response.json();
      
      if (result.success) {
        setFastApiStatus('online');
      } else {
        setFastApiStatus('offline');
      }
    } catch (error) {
      setFastApiStatus('offline');
    }
  };

  // 测试搜索功能
  const testSearch = async () => {
    try {
      setSearchLoading(true);
      setSearchResult(null);

      const response = await fetch('/api/xhs-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'search',
          keyword: searchKeyword,
          page: 1,
          pageSize: 5,
          ...(cookies && { cookies })
        })
      });

      const result = await response.json();
      setSearchResult(result);
    } catch (error) {
      setSearchResult({
        success: false,
        error: error instanceof Error ? error.message : '搜索失败'
      });
    } finally {
      setSearchLoading(false);
    }
  };

  // 页面加载时检查服务状态
  useEffect(() => {
    checkFastApiStatus();
  }, []);

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-black mb-4">
            🔗 小红书数据桥接测试
          </h1>
          <p className="text-xl text-gray-700">
            测试FastAPI微服务 → Next.js API代理 → 前端展示的完整流程
          </p>
        </div>

        {/* 服务状态检查 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">🚀 服务状态检查</h2>
            <Button onClick={checkFastApiStatus} disabled={fastApiStatus === 'checking'}>
              {fastApiStatus === 'checking' ? '检查中...' : '重新检查'}
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                fastApiStatus === 'online' ? 'bg-green-500' : 
                fastApiStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <span className="font-medium">FastAPI微服务</span>
              <span className={`text-sm px-2 py-1 rounded ${
                fastApiStatus === 'online' ? 'bg-green-100 text-green-800' : 
                fastApiStatus === 'offline' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {fastApiStatus === 'online' ? '在线' : 
                 fastApiStatus === 'offline' ? '离线' : '检查中'}
              </span>
            </div>
            
            {fastApiStatus === 'offline' && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg">
                <div className="text-red-800 font-medium mb-1">FastAPI服务未启动</div>
                <div className="text-red-700 text-sm space-y-1">
                  <div>请在终端运行以下命令启动服务：</div>
                  <code className="block bg-red-100 p-2 rounded text-xs">
                    cd xhs-service/fastapi-service && python app.py
                  </code>
                  <div>或者使用启动脚本：</div>
                  <code className="block bg-red-100 p-2 rounded text-xs">
                    cd xhs-service/fastapi-service && bash start.sh
                  </code>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cookie配置 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🍪 Cookie配置（可选）</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                小红书Cookie（留空将使用演示数据）
              </label>
              <textarea
                value={cookies}
                onChange={(e) => setCookies(e.target.value)}
                placeholder="粘贴从小红书网站获取的完整Cookie字符串..."
                className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs"
              />
            </div>
            <div className="text-xs text-gray-500">
              💡 如何获取Cookie：登录小红书网页版 → F12开发者工具 → Network标签 → 复制请求头中的Cookie
            </div>
          </div>
        </div>

        {/* 搜索测试 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🔍 搜索功能测试</h2>
          <div className="flex space-x-3 mb-4">
            <Input
              value={searchKeyword}
              onChange={setSearchKeyword}
              placeholder="输入搜索关键词"
              className="flex-1"
            />
            <Button 
              onClick={testSearch} 
              disabled={searchLoading || fastApiStatus !== 'online'}
            >
              {searchLoading ? '搜索中...' : '测试搜索'}
            </Button>
          </div>

          {searchResult && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">搜索结果：</h3>
              <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
                <pre className="text-xs">
                  {JSON.stringify(searchResult, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* 热门笔记轮播展示 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🎠 热门笔记轮播展示</h2>
          <div className="text-sm text-gray-600 mb-4">
            这是第三步的核心功能：通过轮播组件展示热门笔记，验证整个数据流程
          </div>
          
          {fastApiStatus === 'online' ? (
            <HotNotesCarousel cookies={cookies} count={8} />
          ) : (
            <div className="text-center py-8 text-gray-500">
              请先启动FastAPI服务以查看热门笔记轮播
            </div>
          )}
        </div>

        {/* 测试步骤说明 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">📋 测试步骤说明</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <div>
                <div className="font-medium">启动FastAPI微服务</div>
                <div className="text-sm text-gray-600">
                  在终端运行: <code className="bg-gray-100 px-1 rounded">cd xhs-service/fastapi-service && python app.py</code>
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
              <div>
                <div className="font-medium">检查服务状态</div>
                <div className="text-sm text-gray-600">
                  点击&quot;重新检查&quot;按钮，确认FastAPI服务状态为&quot;在线&quot;
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
              <div>
                <div className="font-medium">测试搜索功能</div>
                <div className="text-sm text-gray-600">
                  输入关键词并点击&quot;测试搜索&quot;，验证API代理是否正常工作
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
              <div>
                <div className="font-medium">查看热门笔记轮播</div>
                <div className="text-sm text-gray-600">
                  观察轮播组件是否正常显示热门笔记，可以左右滑动浏览
                </div>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</div>
              <div>
                <div className="font-medium">完成验证</div>
                <div className="text-sm text-gray-600">
                  如果以上步骤都正常，说明小红书数据桥接功能已成功集成！
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}