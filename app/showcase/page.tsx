import Card from '../components/Card'

export default function ShowcasePage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-12 text-center fade-in-up">
        <h1 className="text-4xl font-bold gradient-text mb-6">🏆 优秀案例展示墙</h1>
        <p className="text-xl text-white/80">
          学习优秀学员的爆款内容和行业经验分享 🌠
        </p>
      </div>

      <Card icon="🚀">
        <div className="text-center py-16">
          <div className="text-6xl mb-8 breathing-glow">🌟</div>
          <h2 className="text-3xl font-bold gradient-text mb-6">
            优秀案例展示墙正在加速开发中
          </h2>
          <p className="text-white/70 mb-10 text-lg">
            即将为您呈现创富营之星和行业爆款内容，敬请期待！
          </p>
          <div className="glass-effect p-8 rounded-2xl border border-white/20">
            <h3 className="text-xl font-bold text-white mb-6">🌌 V2.0 即将推出</h3>
            <ul className="text-left text-white/80 space-y-3 max-w-md mx-auto">
              <li className="flex items-center">
                <span className="text-2xl mr-3">📊</span>
                <span>创富营之星排行榜</span>
              </li>
              <li className="flex items-center">
                <span className="text-2xl mr-3">🔥</span>
                <span>行业爆款内容精选</span>
              </li>
              <li className="flex items-center">
                <span className="text-2xl mr-3">📈</span>
                <span>数据表现分析</span>
              </li>
              <li className="flex items-center">
                <span className="text-2xl mr-3">💡</span>
                <span>成功经验分享</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}