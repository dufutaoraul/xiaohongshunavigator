# 部署说明 - 小红书AI灵感领航员

## 🚀 Netlify部署步骤

### 1. 环境变量配置

在Netlify项目设置中，添加以下环境变量：

#### Supabase配置
```
NEXT_PUBLIC_SUPABASE_URL=https://jwfthdjxmqexsvzyiral.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[从Supabase控制台获取]
SUPABASE_SERVICE_ROLE_KEY=[从Supabase控制台获取]
```

#### 如何获取Supabase密钥：
1. 访问：https://supabase.com/dashboard/project/jwfthdjxmqexsvzyiral
2. 进入 Settings → API
3. 复制 `anon public` 和 `service_role` 密钥

#### Dify配置（稍后提供）
```
DIFY_API_URL=[您的Dify API地址]
DIFY_API_KEY=[您的Dify API密钥]
DIFY_WORKFLOW_ID=[您的工作流ID]
```

### 2. Netlify构建设置

**构建命令：** `npm run build`
**发布目录：** `.next`
**Node版本：** 18.x

### 3. 需要的Supabase表结构

运行以下SQL在您的Supabase数据库中创建必要的表：

```sql
-- 学员信息表
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  persona TEXT,
  keywords TEXT,
  vision TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 打卡记录表
CREATE TABLE IF NOT EXISTS punch_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES students(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  post_url TEXT UNIQUE NOT NULL,
  post_created_at TIMESTAMPTZ,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  collections INTEGER DEFAULT 0
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_punch_cards_user_id ON punch_cards(user_id);
```

### 4. 域名配置（可选）

如果您有自定义域名，在Netlify中配置：
- Site settings → Domain management → Add custom domain

## 🔧 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建项目
npm run build
```

## 📝 重要注意事项

- ⚠️ 绝不要将真实API密钥提交到GitHub
- ✅ 所有密钥都通过Netlify环境变量配置
- 🔄 环境变量修改后需要重新部署才能生效
- 🔒 service_role密钥权限很高，请妥善保管