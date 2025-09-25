# Netlify 部署环境变量配置指南

## 问题描述
管理员后台设置打卡日期时出现"Database connection failed"错误，这是因为Netlify部署环境中缺少必要的环境变量配置。

## 解决方案

### 1. 在Netlify控制台配置环境变量

登录 [Netlify控制台](https://app.netlify.com)，找到你的项目，然后：

1. 进入 **Site settings** → **Environment variables**
2. 添加以下环境变量：

```
NEXT_PUBLIC_SUPABASE_URL=https://edoljoofbxinghqidgmr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkb2xqb29mYnhpbmdocWlkZ21yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTM3MTQsImV4cCI6MjA3MDQ4OTcxNH0.zvfubmdXl1ZBDEHm7kUhezFdtSWguI9MdLhuc4VAomg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkb2xqb29mYnhpbmdocWlkZ21yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxMzcxNCwiZXhwIjoyMDcwNDg5NzE0fQ.aN3NjbYp-57tUsK7OXvNFpPevTPZ1eO9ci9oTcVjEQ4
DIFY_API_URL=https://pro.aifunbox.com/v1/workflows/run
DIFY_API_KEY=app-ripbKirWn66Re94CtLc1m2Dn
DIFY_WORKFLOW_ID=8d9d5dea-7992-4e4f-b12c-de1126743ce2
```

### 2. 重新部署网站

配置完环境变量后，需要重新部署网站：

1. 在Netlify控制台中，进入 **Deploys** 页面
2. 点击 **Trigger deploy** → **Deploy site**
3. 等待部署完成

### 3. 验证配置

部署完成后，可以通过以下方式验证：

1. **使用数据库测试API**：访问 `https://你的网站域名/api/test-db` 查看数据库连接状态
2. 访问管理员后台
3. 尝试设置打卡日期
4. 如果仍有问题，检查浏览器开发者工具的Network和Console标签页

### 4. 数据库连接测试

我们提供了一个专门的测试API来诊断数据库连接问题：

**测试URL**: `https://你的网站域名/api/test-db`

**成功响应示例**:
```json
{
  "success": true,
  "message": "数据库连接测试成功",
  "environment": {
    "hasSupabaseUrl": true,
    "hasSupabaseAnonKey": true,
    "hasSupabaseServiceKey": true,
    "isPlaceholder": false
  },
  "tableAccess": {
    "users": { "accessible": true, "error": null },
    "checkin_schedules": { "accessible": true, "error": null },
    "checkin_records": { "accessible": true, "error": null }
  }
}
```

**失败响应示例**:
```json
{
  "success": false,
  "error": "Database connection failed",
  "details": "Invalid API key",
  "environment": {
    "hasSupabaseUrl": true,
    "hasSupabaseAnonKey": false,
    "isPlaceholder": true
  }
}
```

## 常见问题

### Q: 为什么需要这些环境变量？
A: 这些环境变量用于连接Supabase数据库和其他第三方服务。没有正确配置会导致数据库连接失败。

### Q: 环境变量配置后还是不工作怎么办？
A: 
1. 确保所有环境变量都正确复制（注意不要有多余的空格）
2. 重新部署网站
3. 清除浏览器缓存
4. 检查Supabase服务是否正常运行

### Q: 如何检查环境变量是否生效？
A: 可以在API路由中添加日志输出来检查环境变量是否正确加载。

## 技术说明

修改了以下文件来改进错误处理：

1. `app/api/admin/checkin-schedule/route.ts` - 添加了更详细的环境变量检查和错误信息
2. `app/admin/page.tsx` - 改进了前端错误显示，提供更友好的错误信息

这些修改会在用户遇到数据库连接问题时提供更清晰的错误信息和解决建议。
