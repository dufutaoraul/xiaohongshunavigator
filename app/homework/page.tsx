'use client';

import { useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';

export default function HomeworkPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
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
              欢迎回来，{user.student_name || user.student_id}！
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* 提交作业 */}
            <Link href="/homework/submit">
              <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 cursor-pointer group">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/30 transition-colors">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    提交作业
                  </h3>
                  <p className="text-white/60">
                    选择作业并上传附件进行提交
                  </p>
                </div>
              </div>
            </Link>

            {/* 查询我的作业 */}
            <Link href="/homework/my-assignments">
              <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 cursor-pointer group">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500/30 transition-colors">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    查询我的作业
                  </h3>
                  <p className="text-white/60">
                    查看作业提交历史和批改结果
                  </p>
                </div>
              </div>
            </Link>

            {/* 查询毕业资格 */}
            <Link href="/homework/graduation-check">
              <div className="bg-white/5 backdrop-blur-lg border border-white/20 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 cursor-pointer group">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-500/30 transition-colors">
                    <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    查询毕业资格
                  </h3>
                  <p className="text-white/60">
                    检查是否满足毕业条件
                  </p>
                </div>
              </div>
            </Link>
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