# 🔥 小红书AI灵感领航员 - 数据集成功能

## 📊 功能概览

基于 `xiaohongshu-mcp` 开源项目，实现三大核心功能：

### ✅ 已完成功能

#### 🎯 功能3：关键词热门帖子推荐
- **位置**：AI内容生成页面 (`/generate`)
- **功能**：根据学员输入的关键词，实时搜索并显示全网最热门的小红书帖子
- **特点**：
  - 智能关键词提取
  - 热度算法排序（点赞、评论、收藏综合评分）
  - 个性化推荐（基于学员档案关键词）
  - 智能缓存系统（24小时有效期）

#### 🛡️ 完整的风控保护系统
- **智能频率控制**：分钟/小时/天多级限制
- **风险监控**：实时检测验证码、频率限制等风险信号
- **自动暂停机制**：遇到风控时自动冷却
- **分时段控制**：在合适的时间段执行不同类型的抓取

### 🚧 待开发功能

#### 🏆 功能1：学员主页优秀帖子展示
- **实现思路**：定期抓取所有学员的小红书主页，分析帖子数据
- **展示位置**：首页轮播或专门的展示页面
- **排行算法**：基于互动数据计算综合热度得分

#### 📈 功能2：打卡帖子数据分析
- **实现思路**：分析学员打卡提交的帖子链接，生成周期性排行榜
- **展示位置**：打卡中心或专门的数据分析页面
- **更新频率**：每周更新一次排行榜

## 🏗️ 技术架构

### 核心组件
```
├── lib/xhs-integration/
│   ├── config.ts                 # 配置管理（频率限制、时段控制）
│   ├── rate-limiter.ts           # 智能频率控制系统
│   ├── risk-monitor.ts           # 风险监控系统
│   ├── mcp-client.ts             # xiaohongshu-mcp客户端封装
│   └── services/
│       └── keyword-search.ts     # 关键词搜索服务
├── app/api/xhs/
│   └── keyword-search/route.ts   # 搜索API接口
├── app/components/
│   └── TrendingPostsWidget.tsx   # 热门帖子展示组件
└── supabase/migrations/
    └── 20250925_xhs_integration_tables.sql  # 数据库表结构
```

### 数据库表结构
- `xhs_users_cache`: 小红书用户信息缓存
- `xhs_posts_cache`: 小红书帖子数据缓存
- `xhs_trending_posts`: 热门帖子汇总表
- `xhs_search_cache`: 搜索结果缓存表
- `xhs_crawl_logs`: 数据抓取日志表

## 🚀 部署指南

### 前提条件
1. **xiaohongshu-mcp服务**：需要部署并运行 Go 服务
2. **小红书账号**：使用您的个人小红书账号登录MCP服务
3. **环境变量**：配置MCP服务的连接信息

### 环境变量配置
```bash
# 在 .env.local 中添加
XHS_MCP_HOST=localhost          # MCP服务地址
XHS_MCP_PORT=3001              # MCP服务端口
NODE_ENV=development           # 环境模式
```

### 部署步骤

#### 1. 部署xiaohongshu-mcp服务
```bash
# 克隆项目
git clone https://github.com/xpzouying/xiaohongshu-mcp
cd xiaohongshu-mcp

# 按照项目README编译和运行
go build
./xiaohongshu-mcp

# 手动登录您的小红书账号
```

#### 2. 运行数据库迁移
```bash
# 在Supabase SQL编辑器中执行
# 文件：supabase/migrations/20250925_xhs_integration_tables.sql
```

#### 3. 部署到当前分支
```bash
# 提交当前功能
git add .
git commit -m "✨ 实现关键词热门帖子推荐功能

- 完整的风控保护系统
- 智能频率控制和风险监控
- 关键词搜索和个性化推荐
- 数据缓存和性能优化"

# 推送到远程仓库
git push origin feature/xhs-integration
```

#### 4. 测试功能
1. 访问 `/generate` 页面
2. 输入学习主题（如："ChatGPT 思维导图"）
3. 查看页面下方的热门帖子推荐
4. 点击"个性化推荐"获取基于你关键词的推荐

## ⚙️ 配置参数

### 风控策略配置
```typescript
// 可在 lib/xhs-integration/config.ts 中调整

// 开发环境（更严格）
requestsPerMinute: 1,    // 每分钟1个请求
requestsPerHour: 20,     // 每小时20个请求
requestsPerDay: 100,     // 每天100个请求

// 生产环境（相对宽松但安全）
requestsPerMinute: 2,    // 每分钟2个请求
requestsPerHour: 30,     // 每小时30个请求
requestsPerDay: 200,     // 每天200个请求
```

### 时段控制
```typescript
timeSlots: {
  keywordSearch: ['09:00-11:00', '14:00-16:00', '19:00-21:00'],    // 关键词搜索
  profileCrawl: ['14:00-16:00', '20:00-22:00'],                   // 主页抓取
  checkinDataUpdate: ['22:00-24:00', '02:00-04:00']              // 打卡数据更新
}
```

## 🔍 使用方法

### 1. 关键词搜索推荐
- **自动触发**：在生成页面输入内容时，自动提取关键词并搜索相关帖子
- **手动搜索**：点击"相关热门"按钮，基于当前输入内容搜索
- **个性化推荐**：点击"个性化推荐"按钮，基于学员档案关键词推荐

### 2. API调用示例
```javascript
// 搜索关键词
GET /api/xhs/keyword-search?keywords=ChatGPT&limit=10&sortBy=popular

// 获取个性化推荐
POST /api/xhs/keyword-search/personalized
{
  "student_id": "AXCF2025040088",
  "limit": 10,
  "useCache": true
}
```

## 🛡️ 安全保障

### 账号安全
- ✅ 单账号策略，避免批量操作风险
- ✅ 智能频率控制，模拟真人浏览习惯
- ✅ 实时风控监测，自动暂停异常操作
- ✅ 分时段执行，避开高风险时间

### 数据保护
- ✅ 完整的错误处理和重试机制
- ✅ 数据缓存减少重复请求
- ✅ 详细的操作日志记录
- ✅ 自动清理过期数据

## 📊 监控与维护

### 风险监控
- **实时状态**：通过 `xhsRiskMonitor.getStatus()` 查看当前风险状态
- **成功率追踪**：监控请求成功率，及时发现问题
- **自动恢复**：风控触发后自动冷却，无需人工干预

### 数据清理
```sql
-- 定期执行清理函数
SELECT cleanup_xhs_cache();

-- 查看数据统计
SELECT
  'users' as table_name, COUNT(*) as count FROM xhs_users_cache
UNION ALL
SELECT
  'posts' as table_name, COUNT(*) as count FROM xhs_posts_cache
UNION ALL
SELECT
  'search_cache' as table_name, COUNT(*) as count FROM xhs_search_cache;
```

## 🎯 后续规划

### Phase 1: 完成剩余功能（预计2-3周）
- [ ] 实现功能1：学员主页优秀帖子展示
- [ ] 实现功能2：打卡帖子数据分析
- [ ] 添加定时任务支持

### Phase 2: 功能增强（预计1-2周）
- [ ] 添加帖子详情页面
- [ ] 实现帖子收藏和标记功能
- [ ] 优化UI/UX体验

### Phase 3: 生产就绪（预计1周）
- [ ] 性能优化和压力测试
- [ ] 完善错误处理和日志
- [ ] 编写完整的用户手册

## ⚠️ 注意事项

1. **首次使用**：需要手动登录xiaohongshu-mcp服务中的小红书账号
2. **网络环境**：确保MCP服务网络稳定，避免频繁断线
3. **数据延迟**：搜索结果可能有1-2分钟的延迟，属于正常现象
4. **缓存机制**：相同关键词24小时内会使用缓存数据，减少重复请求

## 🤝 需要您的配合

现在功能3（关键词热门帖子推荐）已经完全实现并集成。您需要：

1. **部署xiaohongshu-mcp服务**并用您的小红书账号登录
2. **运行数据库迁移脚本**创建必要的数据表
3. **测试功能**是否正常工作
4. **确认是否继续开发**功能1和功能2

准备好后，我们就可以继续开发剩余的功能了！🚀