interface ComingSoonProps {
  title: string
  description: string
  icon: string
}

export default function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-2xl mx-auto py-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="glass-effect p-12 rounded-3xl border border-white/20 backdrop-blur-lg">
          <div className="text-8xl mb-8 animate-pulse">{icon}</div>
          <h1 className="text-4xl font-bold gradient-text mb-6">{title}</h1>
          <p className="text-xl text-white/80 mb-8 leading-relaxed">
            {description}
          </p>
          <div className="space-y-4 text-white/60">
            <p className="text-lg">🚀 此功能正在研发中，敬请期待~</p>
            <p className="text-sm">我们正在全力以赴为您打造更完美的体验</p>
          </div>
          
          {/* 动效装饰 */}
          <div className="mt-12 flex justify-center space-x-4">
            <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    </div>
  )
}