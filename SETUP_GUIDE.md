# 📋 小红书集成功能部署指南

## 🎯 总览
这个指南将帮助您一步步部署小红书数据集成功能。

## 📁 第一步：部署xiaohongshu-mcp服务

### 1.1 安装Go语言环境
**为什么需要？** xiaohongshu-mcp是用Go语言编写的，需要Go环境来编译运行。

**操作步骤：**
1. 访问 https://golang.org/dl/
2. 下载适合您系统的安装包：
   - Windows：下载 `.msi` 文件
   - Mac：下载 `.pkg` 文件
3. 双击安装包，按提示安装
4. 验证安装：打开命令行，输入 `go version`，应该显示版本信息

### 1.2 克隆和编译项目
```bash
# 打开命令行，进入您想放置项目的目录
cd D:\工作盘\三个月陪跑

# 克隆项目
git clone https://github.com/xpzouying/xiaohongshu-mcp
cd xiaohongshu-mcp

# 下载依赖
go mod tidy

# 编译项目
go build
```

### 1.3 运行服务
```bash
# Windows用户：
.\xiaohongshu-mcp.exe

# Mac/Linux用户：
./xiaohongshu-mcp
```

### 1.4 登录小红书账号
1. 服务启动后，会显示一个网址（通常是 http://localhost:8080）
2. 在浏览器中打开这个网址
3. 按照界面提示，使用您的小红书账号登录
4. 登录成功后，服务就可以代表您的账号获取数据了

**⚠️ 重要提醒：**
- 使用您个人的小红书账号，不要使用公司或他人账号
- 保持服务持续运行，关闭服务会断开登录状态

---

## 🗄️ 第二步：创建数据库表

### 2.1 为什么需要新的数据库表？
您现在的数据库主要存储学员信息和打卡记录，但要存储小红书的数据（用户信息、帖子数据、搜索结果等），需要新的表结构。

### 2.2 要创建哪些表？
- **xhs_users_cache**: 小红书用户信息（昵称、粉丝数等）
- **xhs_posts_cache**: 小红书帖子数据（标题、点赞数、评论数等）
- **xhs_search_cache**: 搜索结果缓存（避免重复搜索相同关键词）
- **xhs_trending_posts**: 热门帖子排行榜
- **xhs_crawl_logs**: 操作日志记录

### 2.3 操作步骤
1. **登录Supabase**
   - 访问 https://supabase.com
   - 登录您的账号
   - 选择您的项目（xiaohongshu项目）

2. **打开SQL编辑器**
   - 在左侧菜单找到 "SQL Editor"
   - 点击进入

3. **执行建表脚本**
   - 打开文件：`supabase/migrations/20250925_xhs_integration_tables.sql`
   - 复制全部内容（大约400行SQL代码）
   - 粘贴到Supabase的SQL编辑器中
   - 点击右上角的 "Run" 按钮

4. **验证创建成功**
   - 切换到 "Table Editor"
   - 应该能看到新创建的5个表（以xhs_开头）

---

## ⚙️ 第三步：配置环境变量

### 3.1 修改.env.local文件
在您的项目根目录找到 `.env.local` 文件，添加以下配置：
```bash
# 小红书MCP服务配置
XHS_MCP_HOST=localhost
XHS_MCP_PORT=3001
```

**注意：** 如果xiaohongshu-mcp服务使用的不是3001端口，请修改为实际端口号。

---

## 🧪 第四步：测试功能

### 4.1 启动您的Next.js应用
```bash
npm run dev
```

### 4.2 测试关键词搜索功能
1. 访问 http://localhost:3000/generate
2. 登录您的学员账号
3. 在"今日学习主题/灵感"中输入内容，比如：
   ```
   今天学会了使用ChatGPT做思维导图，效率提升了很多
   ```
4. 查看页面下方是否出现"💡 热门帖子参考"模块
5. 点击"相关热门"或"个性化推荐"按钮
6. 如果一切正常，应该会显示相关的小红书热门帖子

### 4.3 预期效果
- 看到热门帖子卡片，显示标题、作者、点赞数等
- 点击"查看原文"可以跳转到小红书
- 搜索结果会被缓存，相同关键词24小时内不会重复搜索

---

## ❌ 常见问题排查

### Q1: Go语言安装失败
**解决方案：**
- 确保从官方网站下载：https://golang.org/dl/
- Windows用户需要管理员权限安装
- 安装后重启命令行工具

### Q2: git clone失败
**解决方案：**
- 检查网络连接
- 如果GitHub访问慢，可以使用镜像：
  ```bash
  git clone https://gitclone.com/github.com/xpzouying/xiaohongshu-mcp
  ```

### Q3: go build编译失败
**解决方案：**
- 确保Go版本是1.18以上：`go version`
- 检查网络，可能需要设置代理：
  ```bash
  go env -w GOPROXY=https://goproxy.cn,direct
  ```

### Q4: xiaohongshu-mcp服务启动失败
**解决方案：**
- 检查端口是否被占用
- 查看错误日志，通常会显示具体原因
- 尝试重新编译：`go clean && go build`

### Q5: 数据库表创建失败
**解决方案：**
- 检查SQL语法是否完整
- 确保有数据库写入权限
- 尝试分段执行SQL（一次执行一个CREATE TABLE语句）

### Q6: 前端显示"搜索失败"
**可能原因：**
- xiaohongshu-mcp服务未启动
- 环境变量配置错误
- 小红书账号登录状态失效

**排查步骤：**
1. 确认xiaohongshu-mcp服务正在运行
2. 检查浏览器控制台的错误信息
3. 确认.env.local中的端口配置正确

---

## ✅ 完成检查清单

- [ ] Go语言环境安装成功（`go version`显示版本）
- [ ] xiaohongshu-mcp项目克隆成功
- [ ] xiaohongshu-mcp服务编译成功
- [ ] xiaohongshu-mcp服务启动成功
- [ ] 小红书账号登录成功
- [ ] 数据库表创建成功（在Supabase中能看到5个新表）
- [ ] 环境变量配置完成
- [ ] Next.js应用能正常启动
- [ ] 关键词搜索功能测试成功

完成所有步骤后，您就可以在AI内容生成页面看到热门帖子推荐功能了！

---

## 🆘 需要帮助？

如果遇到任何问题，请详细描述：
1. 在哪一步遇到问题
2. 具体的错误信息
3. 您的操作系统（Windows/Mac/Linux）
4. 您已经完成了哪些步骤

这样我可以提供更精准的帮助！