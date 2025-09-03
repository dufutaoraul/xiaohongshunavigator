# 🚀 Vercel 完整重新部署配置指南

## 📋 **第一步：删除现有Vercel项目**

1. **登录Vercel控制台**
   - 访问 https://vercel.com/dashboard
   - 使用你的GitHub账号登录

2. **找到并删除现有项目**
   - 在Dashboard中找到你的小红书导航器项目
   - 点击项目名称进入项目详情页
   - 点击右上角的 "Settings" 按钮
   - 滚动到页面最底部，找到 "Delete Project" 部分
   - 点击 "Delete" 按钮
   - 输入项目名称确认删除
   - 等待删除完成

## 📋 **第二步：重新导入GitHub项目**

1. **创建新项目**
   - 回到Vercel Dashboard主页
   - 点击 "New Project" 按钮
   - 选择 "Import Git Repository"

2. **连接GitHub仓库**
   - 找到你的 `xiaohongshunavigator` 仓库
   - 点击 "Import" 按钮

3. **配置项目设置**
   - Project Name: `xiaohongshunavigator` (或你喜欢的名称)
   - Framework Preset: Next.js
   - Root Directory: `./` (保持默认)
   - Build and Output Settings: 保持默认

## 📋 **第三步：配置环境变量**

**重要：Vercel的环境变量配置与Netlify完全相同，请按以下步骤配置：**

1. **在项目配置页面添加环境变量**
   - 在导入项目时，点击 "Environment Variables" 展开
   - 或者项目创建后，进入 Settings → Environment Variables

2. **添加以下环境变量（与Netlify完全相同）：**

### 🔑 **Supabase 数据库配置**
```
NEXT_PUBLIC_SUPABASE_URL = [你的Supabase项目URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [你的Supabase匿名密钥]
SUPABASE_SERVICE_ROLE_KEY = [你的Supabase服务角色密钥]
```

### 🤖 **AI服务配置**
```
DIFY_API_URL = [你的Dify API URL]
DIFY_API_KEY = [你的Dify API密钥]
DIFY_WORKFLOW_ID = [你的Dify工作流ID]

GEMINI_API_URL = [你的Gemini API URL]
GEMINI_API_KEY = [你的Gemini API密钥]
GEMINI_MODEL_ID = [你的Gemini模型ID]
```

### ☁️ **腾讯云配置**
```
TENCENT_COS_REGION = [你的腾讯云COS区域]
TENCENT_COS_BUCKET = [你的腾讯云COS存储桶]
TENCENT_SECRET_ID = [你的腾讯云密钥ID]
```

### 🔐 **支付网关配置**
```
AI_GATEWAY_API_KEY = [你的AI网关API密钥]
```

3. **环境变量配置注意事项**
   - 每个环境变量都要设置为 "All Environments" (Production, Preview, Development)
   - 确保没有多余的空格或换行符
   - 所有值都要与Netlify中的完全一致

## 📋 **第四步：部署项目**

1. **开始部署**
   - 配置完环境变量后，点击 "Deploy" 按钮
   - 等待构建和部署完成（通常需要2-5分钟）

2. **检查部署状态**
   - 在部署过程中可以查看构建日志
   - 如果出现错误，检查环境变量是否正确配置

## 📋 **第五步：验证部署**

1. **访问部署的网站**
   - 部署完成后，Vercel会提供一个URL
   - 点击访问你的网站

2. **测试数据库连接**
   - 尝试注册一个测试账号
   - 尝试登录和保存个人资料
   - 检查是否能正常读写数据库

3. **测试AI功能**
   - 尝试使用AI生成内容功能
   - 检查是否能正常调用AI服务

## 🔧 **常见问题排查**

### **如果数据库连接失败：**
1. 检查 `NEXT_PUBLIC_SUPABASE_URL` 是否正确
2. 检查 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 是否正确
3. 确认Supabase项目状态正常

### **如果AI功能不工作：**
1. 检查所有AI相关的环境变量
2. 确认API密钥有效且有足够额度
3. 检查API URL格式是否正确

### **如果构建失败：**
1. 查看构建日志中的具体错误信息
2. 检查是否有语法错误或依赖问题
3. 确认所有必需的环境变量都已配置

## 📞 **需要帮助时**

如果按照以上步骤操作后仍有问题，请提供：
1. Vercel构建日志的错误信息
2. 浏览器控制台的错误信息
3. 具体哪个功能不工作

---

**重要提醒：**
- 环境变量必须与Netlify中的完全一致
- 删除旧项目是为了避免配置冲突
- 部署完成后记得测试所有核心功能
