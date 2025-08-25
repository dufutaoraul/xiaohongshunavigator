'use client';

import { useState, useEffect } from 'react';
import Card from './Card';

interface NoteData {
  note_id: string;
  title: string;
  desc: string;
  cover?: string;
  user: {
    nickname: string;
    user_id: string;
  };
  interact_info: {
    liked_count: string;
    comment_count: string;
    collected_count: string;
  };
}

interface HotNotesCarouselProps {
  cookies?: string;
  count?: number;
}

export function HotNotesCarousel({ cookies, count = 8 }: HotNotesCarouselProps) {
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchHotNotes();
  }, [cookies, count]);

  const fetchHotNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        action: 'hot',
        count: count.toString(),
        ...(cookies && { cookies })
      });

      const response = await fetch(`/api/xhs-proxy?${params}`);
      const result = await response.json();

      if (result.success) {
        setNotes(result.data.notes || []);
      } else {
        setError(result.error || '获取热门笔记失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络请求失败');
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, notes.length - 3));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + Math.max(1, notes.length - 3)) % Math.max(1, notes.length - 3));
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">🔥 热门笔记</h2>
          <div className="text-sm text-gray-500">加载中...</div>
        </div>
        <div className="flex space-x-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-64">
              <Card className="h-80 animate-pulse">
                <div className="h-40 bg-gray-200 rounded-t-lg"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">🔥 热门笔记</h2>
          <button
            onClick={fetchHotNotes}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            重试
          </button>
        </div>
        <Card className="p-6 text-center">
          <div className="text-red-500 mb-2">⚠️ {error}</div>
          <div className="text-sm text-gray-500">
            {error.includes('连接失败') && (
              <div className="mt-2 p-3 bg-yellow-50 rounded-lg text-left">
                <div className="font-medium text-yellow-800 mb-1">解决方案：</div>
                <div className="text-yellow-700 text-xs space-y-1">
                  <div>1. 确保FastAPI服务正在运行</div>
                  <div>2. 在终端运行: cd xhs-service/fastapi-service && python app.py</div>
                  <div>3. 确认服务运行在 http://localhost:8000</div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">🔥 热门笔记</h2>
        </div>
        <Card className="p-6 text-center text-gray-500">
          暂无热门笔记数据
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">🔥 热门笔记</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {notes.length} 条笔记
          </span>
          {notes.length > 4 && (
            <div className="flex space-x-1">
              <button
                onClick={prevSlide}
                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                disabled={currentIndex === 0}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextSlide}
                className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                disabled={currentIndex >= notes.length - 4}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden">
        <div 
          className="flex transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 25}%)` }}
        >
          {notes.map((note, index) => (
            <div key={note.note_id} className="flex-shrink-0 w-1/4 px-2">
              <Card className="h-80 hover:shadow-lg transition-shadow cursor-pointer">
                {note.cover ? (
                  <img
                    src={note.cover}
                    alt={note.title}
                    className="w-full h-40 object-cover rounded-t-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-full h-40 bg-gradient-to-br from-pink-100 to-purple-100 rounded-t-lg flex items-center justify-center ${note.cover ? 'hidden' : ''}`}>
                  <div className="text-4xl">📝</div>
                </div>
                
                <div className="p-3 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="font-medium text-sm text-gray-800 line-clamp-2 mb-2">
                      {note.title}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {note.desc}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-xs text-gray-500">
                      <span className="truncate">@{note.user.nickname}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                          </svg>
                          {note.interact_info.liked_count}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {note.interact_info.comment_count}
                        </span>
                        <span className="flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                          {note.interact_info.collected_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* 指示器 */}
      {notes.length > 4 && (
        <div className="flex justify-center mt-4 space-x-1">
          {Array.from({ length: Math.max(1, notes.length - 3) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}