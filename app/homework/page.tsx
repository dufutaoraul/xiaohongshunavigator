'use client';

import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GlobalUserMenu from '@/app/components/GlobalUserMenu';

export default function HomeworkPage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white relative">
      {/* 全局用户菜单 - 左上角 */}
      <GlobalUserMenu className="absolute top-6 left-6 z-50" />

      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
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