# 小红书AI灵感领航员 - 学员IP孵化器

一个基于 Next.js 的 AI 驱动的 Web 应用，为"爱学AI创富营"在线课程学员提供个人IP设定、AI内容生成和自动化打卡功能。

## 技术栈

- **前端**: Next.js (App Router) + Tailwind CSS
- **数据库**: Supabase (PostgreSQL)
- **部署**: Netlify (利用Netlify Functions实现后端逻辑)
- **流程编排**: n8n
- **AI内容生成**: Dify API
- **未来扩展**: 第三方数据抓取API

## 项目结构

```
app/
├── profile/page.tsx          # 个人IP资料库页面
├── generate/page.tsx         # AI灵感内容引擎页面
├── dashboard/page.tsx        # 自动化打卡与进度可视系统页面
├── showcase/page.tsx         # 优秀案例展示墙页面 (V2)
├── components/              # 公共组件
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Calendar.tsx
│   └── ComingSoonPlaceholder.tsx
└── api/                     # API路由 (自动部署为Netlify Functions)
    ├── user/route.ts         # 用户信息管理
    ├── generate/route.ts     # AI内容生成
    ├── punch/route.ts        # 打卡提交
    └── punch-history/route.ts # 打卡历史查询
```

## 数据库Schema (Supabase)

### users 表
| 字段名 | 数据类型 | 描述 |
|--------|----------|------|
| id | uuid (PK) | 默认用户ID |
| student_id | text (Unique) | 学员学号，如'AXCF2025040088' |
| created_at | timestampz | 创建时间 |
| persona | text | 学员人设定位 (一句话) |
| keywords | text | 3个内容方向，逗号分隔 |
| vision | text | 90天后愿景 |

### punch_cards 表
| 字段名 | 数据类型 | 描述 |
|--------|----------|------|
| id | uuid (PK) | 打卡记录ID |
| user_id | uuid (FK) | 关联的用户ID |
| submitted_at | timestampz | 学员在网站提交链接的时间 |
| post_url | text (Unique) | 提交的小红书帖子URL |
| post_created_at | timestampz | 帖子真实发布时间 |
| likes | integer | 帖子点赞数 |
| comments | integer | 帖子评论数 |
| collections | integer | 帖子收藏数 |

## 核心功能模块 (V1.0)

### 1. 个人IP资料库 (/profile)
- 学员输入学号查询和修改个人信息
- 表单包含人设定位、内容关键词、90天愿景
- API: GET/POST /api/user (通过Netlify Functions或Next.js API Route)

### 2. AI灵感内容引擎 (/generate)
- 用户输入学习主题/灵感
- 选择分享角度（踩坑经验、效率提升、新手建议等）
- 通过Dify API生成文案和视觉建议
- API: POST /api/generate (通过Netlify Functions或Next.js API Route)

### 3. 自动化打卡与进度可视系统 (/dashboard)
- 提交小红书帖子URL进行打卡
- 日历热力图展示打卡记录
- 统计数据展示（打卡天数、打卡率等）
- API: POST /api/punch, GET /api/punch-history (通过Netlify Functions或Next.js API Route)

### 4. 优秀案例展示墙 (/showcase)
- V1.0: 显示占位符"正在加速开发中"
- V2.0: 实现创富营之星和行业爆款展示

## 环境变量设置

在 `.env.local` 中配置：
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
DIFY_API_URL=your_dify_api_url
DIFY_API_KEY=your_dify_api_key
```

## 开发优先级

1. **Phase 1**: 实现个人IP资料库 (/profile) - 验证技术栈连通性
2. **Phase 2**: AI内容生成引擎 (/generate)
3. **Phase 3**: 打卡与进度系统 (/dashboard)
4. **Phase 4**: 案例展示墙占位符 (/showcase)

## 关键技术实现点

- 使用 Next.js App Router 进行路由管理
- Tailwind CSS 进行样式设计
- Supabase 作为数据库和后端服务
- n8n 作为工作流编排器处理复杂业务逻辑
- Dify API 集成实现AI内容生成
- Netlify Functions 自动部署API路由 (支持Next.js API Routes)

## 未来扩展 (V2/V3)

- V2: 集成真实的第三方数据抓取API获取帖子数据
- V3: AI自优化反馈闭环系统
- 数据分析和运营看板功能

## 部署配置

### Netlify 部署设置
- **构建命令**: `npm run build`
- **发布目录**: `.next` (Next.js静态导出) 或 `out` (如使用静态导出)
- **Node版本**: 18.x或以上
- **环境变量**: 在Netlify后台配置Supabase和Dify相关的API密钥

### 环境变量配置
在Netlify后台的Environment Variables中设置：
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `DIFY_API_URL`
- `DIFY_API_KEY`

## 常用命令

```bash
# 安装依赖
npm install

# 开发环境启动
npm run dev

# 构建项目
npm run build

# 本地Netlify Functions测试
netlify dev

# 类型检查
npm run type-check

# 代码格式化
npm run format

# 代码检查
npm run lint

# 部署到Netlify
netlify deploy --prod
```