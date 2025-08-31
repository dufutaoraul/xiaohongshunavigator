'use client';

import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomeworkPage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-16">
        {/* 头部区域 - 添加退出登录按钮 */}
        <div className="flex justify-between items-start mb-8">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold gradient-text mb-4">
              小红书AI灵感领航员 - 作业系统
            </h1>
            <p className="text-xl text-white/60">
              智能化作业提交、批改和毕业资格审核
            </p>
            {user && (
              <div className="mt-4 text-purple-300">
                欢迎回来，{user.name || user.student_id}！
              </div>
            )}
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('userSession')
              router.push('/')
            }}
            className="px-4 py-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-red-200 rounded-lg text-sm transition-all duration-300 flex items-center gap-2"
          >
            🚪 退出登录
          </button>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="mt-12">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 提交作业 */}
              <a
                href="https://ui6t5revpkk.feishu.cn/share/base/form/shrcntFYZDF0V9exB5LkGCdcyXc"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-green-500/10 backdrop-blur-lg border border-green-400/30 rounded-2xl p-6 hover:bg-green-500/20 transition-all duration-300 cursor-pointer group"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-green-500/30 transition-colors">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-green-300 mb-2">
                    提交作业
                  </h3>
                  <p className="text-green-200/60 text-sm">
                    飞书表单提交
                  </p>
                </div>
              </a>

              {/* 查看作业 */}
              <a
                href="https://ui6t5revpkk.feishu.cn/share/base/query/shrcn8H3yrRLtH6GOvG9kL8i54g"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500/10 backdrop-blur-lg border border-blue-400/30 rounded-2xl p-6 hover:bg-blue-500/20 transition-all duration-300 cursor-pointer group"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-500/30 transition-colors">
                    <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-blue-300 mb-2">
                    查看作业
                  </h3>
                  <p className="text-blue-200/60 text-sm">
                    飞书查询系统
                  </p>
                </div>
              </a>

              {/* 毕业查询 */}
              <a
                href="https://ui6t5revpkk.feishu.cn/share/base/query/shrcn73ZXT4ig28MiiSzAtXJSFc"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-purple-500/10 backdrop-blur-lg border border-purple-400/30 rounded-2xl p-6 hover:bg-purple-500/20 transition-all duration-300 cursor-pointer group"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-500/30 transition-colors">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-purple-300 mb-2">
                    毕业查询
                  </h3>
                  <p className="text-purple-200/60 text-sm">
                    毕业资格查询
                  </p>
                </div>
              </a>

              {/* 作业后台 */}
              <a
                href="https://ui6t5revpkk.feishu.cn/wiki/Gq9NwOGkUier7kkWdcqcijdEn0d"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-orange-500/10 backdrop-blur-lg border border-orange-400/30 rounded-2xl p-6 hover:bg-orange-500/20 transition-all duration-300 cursor-pointer group"
              >
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-500/30 transition-colors">
                    <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-orange-300 mb-2">
                    作业后台
                  </h3>
                  <p className="text-orange-200/60 text-sm">
                    管理员后台
                  </p>
                </div>
              </a>
            </div>

            <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-400/30 rounded-lg">
              <p className="text-yellow-300 text-sm text-center">
                💡 提示：飞书作业系统提供快速的作业提交和查询功能，点击上方链接直接访问
              </p>
            </div>
          </div>

          {/* 管理员功能 - 仅管理员可见 */}
          {user?.role === 'admin' && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-center mb-8 gradient-text">
                管理员功能
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                {/* 作业批改管理 */}
                <Link href="/admin/homework-review">
                  <div className="bg-orange-500/10 backdrop-blur-lg border border-orange-400/30 rounded-2xl p-8 hover:bg-orange-500/20 transition-all duration-300 cursor-pointer group">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-500/30 transition-colors">
                        <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-orange-300 mb-2">
                        作业批改管理
                      </h3>
                      <p className="text-orange-200/60">
                        查看和管理所有学员作业提交
                      </p>
                    </div>
                  </div>
                </Link>

                {/* 毕业审核管理 */}
                <Link href="/admin/graduation">
                  <div className="bg-pink-500/10 backdrop-blur-lg border border-pink-400/30 rounded-2xl p-8 hover:bg-pink-500/20 transition-all duration-300 cursor-pointer group">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-pink-500/30 transition-colors">
                        <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-pink-300 mb-2">
                        毕业审核管理
                      </h3>
                      <p className="text-pink-200/60">
                        审核学员毕业资格和证书发放
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* 底部信息 */}
        <div className="text-center mt-16">
          <p className="text-white/40">
            基于AI智能批改 · 智能毕业资格审核
          </p>
        </div>
      </div>
    </div>
  );
}