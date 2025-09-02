# Vercel 部署配置指南

## 🚨 紧急修复：环境变量配置

当前部署失败是因为 Vercel 环境变量配置不完整。请按以下步骤配置：

### 1. 在 Vercel Dashboard 中配置环境变量

访问：https://vercel.com/dashboard → 选择项目 → Settings → Environment Variables

添加以下环境变量：

#### 必需的环境变量
```bash
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. 获取 Supabase 密钥

1. 访问 Supabase Dashboard：https://supabase.com/dashboard
2. 选择你的项目
3. 进入 Settings → API
4. 复制以下密钥：
   - **anon public** → 用于 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → 用于 `SUPABASE_SERVICE_ROLE_KEY`

### 3. 环境变量作用域

确保为以下环境设置变量：
- ✅ **Production** (生产环境)
- ✅ **Preview** (预览环境)
- ✅ **Development** (开发环境)

### 4. 重新部署

配置完环境变量后：
1. 在 Vercel Dashboard 中点击 "Redeploy"
2. 或者推送一个新的 commit 触发重新部署

## 🔍 故障排除

### 如果仍然失败：

1. **检查环境变量名称**：确保名称完全匹配，区分大小写
2. **检查密钥有效性**：在 Supabase Dashboard 中验证密钥是否正确
3. **清除构建缓存**：在 Vercel 中选择 "Redeploy" 时勾选 "Use existing Build Cache" 为 false

### 常见错误：

- `supabaseUrl is required` → 检查 `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY not found` → 检查 `SUPABASE_SERVICE_ROLE_KEY`
- `Failed to collect page data` → 通常是环境变量配置问题

## 📝 验证部署成功

部署成功后，访问网站应该能够：
1. 正常加载页面
2. 登录功能正常
3. 数据库连接正常
4. 不再出现 Supabase 相关错误

## 🔗 相关文档

- [Vercel 环境变量文档](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase 密钥管理](https://supabase.com/docs/guides/api/api-keys)
