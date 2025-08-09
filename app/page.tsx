import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-6xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold gradient-text mb-8 fade-in-up">
            🌟 小红书AI灵感领航员
          </h1>
          <p className="text-2xl text-white/80 mb-4 fade-in-up" style={{animationDelay: '0.2s'}}>
            探索AI智慧的宇宙，点亮创作的星火
          </p>
          <p className="text-lg text-white/60 mb-12 fade-in-up" style={{animationDelay: '0.4s'}}>
            为爱学AI创富营学员打造的一体化IP孵化工具
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="glass-effect p-8 text-center floating-card group cursor-pointer">
            <div className="text-5xl mb-6 breathing-glow">🧑‍💼</div>
            <h3 className="text-xl font-bold text-white mb-4 gradient-text">个人IP资料库</h3>
            <p className="text-white/70 text-sm mb-6 leading-relaxed">
              设定你的人设定位、内容关键词和90天愿景，建立专属的AI创作基因。通过详细的个人信息录入，为后续的内容生成提供精准的个性化参数。
            </p>
            <Link 
              href="/profile" 
              className="inline-block cosmic-button px-6 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              启航设置 ✨
            </Link>
          </div>

          <div className="glass-effect p-8 text-center floating-card group cursor-pointer">
            <div className="text-5xl mb-6 breathing-glow">🤖</div>
            <h3 className="text-xl font-bold text-white mb-4 gradient-text">AI灵感引擎</h3>
            <p className="text-white/70 text-sm mb-6 leading-relaxed">
              基于你的人设，AI生成高质量小红书内容，让创意如星河般闪耀。智能分析你的特色定位，自动生成吸引人的标题和正文内容。
            </p>
            <Link 
              href="/generate" 
              className="inline-block cosmic-button px-6 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              智慧生成 🚀
            </Link>
          </div>

          <div className="glass-effect p-8 text-center floating-card group cursor-pointer">
            <div className="text-5xl mb-6 breathing-glow">📊</div>
            <h3 className="text-xl font-bold text-white mb-4 gradient-text">打卡中心</h3>
            <p className="text-white/70 text-sm mb-6 leading-relaxed">
              提交小红书链接，追踪你的创作进度，每一步都是星座的轨迹。通过智能日历热力图直观显示打卡记录，统计发布频率和互动数据。
            </p>
            <Link 
              href="/dashboard" 
              className="inline-block cosmic-button px-6 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              进度追踪 📈
            </Link>
          </div>

          <div className="glass-effect p-8 text-center floating-card group cursor-pointer">
            <div className="text-5xl mb-6 breathing-glow">🏆</div>
            <h3 className="text-xl font-bold text-white mb-4 gradient-text">优秀案例</h3>
            <p className="text-white/70 text-sm mb-6 leading-relaxed">
              学习优秀学员的爆款内容和经验，在星光指引下前行。精选创富营内最具影响力的成功案例，深度解析爆款内容的创作技巧。
            </p>
            <Link 
              href="/showcase" 
              className="inline-block cosmic-button px-6 py-3 rounded-lg font-semibold transition-all duration-300"
            >
              灵感探索 🌠
            </Link>
          </div>
        </div>

        <div className="text-center mt-16">
          <div className="glass-effect inline-block p-6 rounded-2xl fade-in-up" style={{animationDelay: '0.8s'}}>
            <p className="text-white/80 text-lg">
              🌌 &ldquo;科技连接宇宙智慧，每一个创作者都是闪耀的星辰&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}