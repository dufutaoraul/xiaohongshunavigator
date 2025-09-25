# 小红书导航器部署指南

## 🚀 快速开始

### 1. 环境要求
- Node.js 18+ 
- npm 或 pnpm
- Supabase 项目
- Python 3.8+ (FastAPI 后端)

### 2. 前端部署

#### 本地开发
```bash
# 克隆仓库
git clone https://github.com/dufutaoraul/xiaohongshunavigator.git
cd xiaohongshunavigator

# 切换到功能分支
git checkout feature/xhs-bridge

# 安装依赖
npm install
# 或
pnpm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入 Supabase 配置

# 启动开发服务器
npm run dev
# 或
pnpm dev

# 访问 http://localhost:3000/test-simple
```

#### 生产部署 (Vercel)
```bash
# 构建测试
npm run build

# 部署到 Vercel
vercel --prod

# 配置环境变量（在 Vercel Dashboard）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_XHS_API_BASE_URL=your_fastapi_url
ENABLE_XHS_PROXY=false
```

### 3. 后端部署 (FastAPI)

#### 本地开发
```bash
cd xhs-service/fastapi-service

# 安装依赖
pip install -r requirements.txt

# 启动服务
uvicorn app:app --host 0.0.0.0 --port 8002 --reload
```

#### 生产部署 (Render/Railway)
```bash
# 使用 Dockerfile 部署
# 或配置 Python 环境
python -m uvicorn app:app --host 0.0.0.0 --port $PORT
```

### 4. 数据库迁移

#### Supabase 迁移
```sql
-- 在 Supabase SQL Editor 中执行
-- 1. 执行 supabase/migrations/20250825_001_add_auth_fields.sql
-- 2. 执行 supabase/migrations/20250825_002_create_xhs_tables.sql
```

#### 验证迁移
```bash
# 运行测试脚本验证
./scripts/test-end2end.sh
# 或
PowerShell -ExecutionPolicy Bypass -File scripts/test-end2end.ps1
```

## 🔧 配置说明

### 环境变量配置

#### 前端 (.env.local)
```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# 后端 API 地址
NEXT_PUBLIC_XHS_API_BASE_URL=http://localhost:8002

# 代理开关（生产环境建议关闭）
ENABLE_XHS_PROXY=false

# 开发环境标识
NODE_ENV=development
```

#### 后端 (.env)
```env
# Supabase 服务端密钥（可选）
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 小红书 Cookie（可选，用于测试）
XHS_COOKIE=your_xhs_cookie

# 其他配置
PORT=8002
```

### Vercel 环境变量
在 Vercel Dashboard → Settings → Environment Variables 中配置：

| 变量名 | 值 | 环境 |
|--------|----|----- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | All |
| `NEXT_PUBLIC_XHS_API_BASE_URL` | FastAPI 服务地址 | All |
| `ENABLE_XHS_PROXY` | `false` | Production |

## 🗄️ 数据库设置

### Supabase 项目设置
1. 创建新的 Supabase 项目
2. 获取项目 URL 和 API Keys
3. 在 SQL Editor 中执行迁移脚本
4. 配置 RLS (Row Level Security) 策略

### 表结构验证
```sql
-- 验证表是否创建成功
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'xhs_%';

-- 应该返回：
-- xhs_checkins
-- xhs_search_logs  
-- xhs_notes_cache
-- xhs_alerts
-- xhs_refund_requests
```

## 🧪 测试验证

### 功能测试清单
- [ ] 访问 `/test-simple` 页面正常加载
- [ ] 关键词生成功能正常
- [ ] 搜索功能返回结果（演示数据）
- [ ] 查看原文显示二维码
- [ ] 打卡功能可以提交
- [ ] 热门轮播显示内容

### 自动化测试
```bash
# 确保前端和后端都在运行
npm run dev  # 前端 (3000端口)
uvicorn app:app --port 8002  # 后端 (8002端口)

# 运行端到端测试
./scripts/test-end2end.sh

# 预期结果：大部分测试通过（某些需要真实数据的测试可能失败）
```

## 🚨 故障排除

### 常见问题

#### 1. 构建失败
```bash
# 检查 TypeScript 错误
npm run type-check

# 检查 ESLint 错误  
npm run lint

# 清理缓存重新构建
rm -rf .next node_modules
npm install
npm run build
```

#### 2. Supabase 连接失败
- 检查环境变量是否正确配置
- 验证 Supabase 项目状态
- 检查网络连接和防火墙

#### 3. FastAPI 服务无法访问
- 检查端口是否被占用
- 验证 CORS 配置
- 检查防火墙和网络设置

#### 4. 数据库迁移失败
- 检查 SQL 语法
- 验证权限设置
- 查看 Supabase 日志

### 日志调试
```bash
# 前端日志
# 浏览器开发者工具 → Console

# 后端日志
# FastAPI 控制台输出

# Supabase 日志
# Supabase Dashboard → Logs
```

## 📋 部署检查清单

### 部署前
- [ ] 代码已合并到 `feature/xhs-bridge` 分支
- [ ] 所有测试通过
- [ ] 环境变量已配置
- [ ] 数据库迁移已执行
- [ ] 构建测试通过

### 部署后
- [ ] 前端页面可正常访问
- [ ] API 接口响应正常
- [ ] 数据库连接正常
- [ ] 核心功能可用
- [ ] 错误监控已配置

## 🔄 更新和维护

### 代码更新
```bash
# 拉取最新代码
git pull origin feature/xhs-bridge

# 安装新依赖
npm install

# 重新构建
npm run build

# 重启服务
```

### 数据库维护
- 定期备份数据
- 监控表大小和性能
- 清理过期数据

### 监控和日志
- 设置错误监控 (Sentry)
- 配置性能监控
- 定期检查日志

---

如有问题，请参考项目文档或联系开发团队。
