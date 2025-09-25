# 生产数据库迁移指南

## 🎯 迁移目标

将开发数据库 `ai-xiaohongshu-DEV` 的表结构同步到生产数据库 `ai-xiaohongshu-navigator`，**保留所有现有的 268 条学员数据**。

## 📊 当前状态分析

### 生产数据库 (ai-xiaohongshu-navigator)
- ✅ **users 表**：268 条真实学员数据
- ❌ **checkin_schedules 表**：不存在
- ❌ **checkin_records 表**：不存在

### 开发数据库 (ai-xiaohongshu-DEV)
- ✅ **users 表**：完整字段结构
- ✅ **checkin_schedules 表**：打卡计划管理
- ✅ **checkin_records 表**：打卡记录存储

## 🚀 迁移步骤

### 第一步：备份生产数据库

**⚠️ 重要：在执行任何迁移操作前，请先备份生产数据库！**

1. 登录 Supabase Dashboard：https://supabase.com/dashboard
2. 选择项目：`ai-xiaohongshu-navigator`
3. 进入 Settings → Database
4. 点击 "Create backup" 创建备份

### 第二步：执行迁移脚本

1. **登录生产数据库**
   - 访问：https://supabase.com/dashboard/project/jwfthdjxmqexsvzyiral
   - 进入 SQL Editor

2. **执行迁移脚本**
   ```sql
   -- 复制 production-database-migration.sql 的全部内容
   -- 粘贴到 SQL Editor 中执行
   ```

3. **观察执行结果**
   - 查看执行日志
   - 确认所有步骤都显示 "✅" 成功标记
   - 如有错误，立即停止并检查问题

### 第三步：验证迁移结果

1. **执行验证脚本**
   ```sql
   -- 复制 verify-production-migration.sql 的全部内容
   -- 粘贴到 SQL Editor 中执行
   ```

2. **检查验证结果**
   - 确认 users 表仍有 268 条记录
   - 确认新表 checkin_schedules 和 checkin_records 已创建
   - 确认所有字段和索引都正确创建

### 第四步：更新 Vercel 环境变量

在 Vercel Dashboard 中配置生产数据库的环境变量：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://jwfthdjxmqexsvzyiral.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZnRoZGp4bXFleHN2enlpcmFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2MzU1NDcsImV4cCI6MjA3MDIxMTU0N30.4bpCHJseDIaxvYs0c7Gk-M0dIVVDuwiGZZztl2nbz-4
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3ZnRoZGp4bXFleHN2enlpcmFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDYzNTU0NywiZXhwIjoyMDcwMjExNTQ3fQ.4Lf-HEfw-8qZPBt2Dc0jS83Q7LOnLm603pwbHsKyK5A
```

### 第五步：重新部署应用

1. 在 Vercel Dashboard 中点击 "Redeploy"
2. 或推送一个新的 commit 触发自动部署

## 📋 迁移内容详细说明

### 新增表结构

#### 1. checkin_schedules（打卡计划表）
```sql
- id: UUID (主键)
- student_id: TEXT (学员ID，关联 users 表)
- start_date: DATE (开始日期)
- end_date: DATE (结束日期)
- created_at: TIMESTAMP (创建时间)
- created_by: TEXT (创建者)
- is_active: BOOLEAN (是否激活)
```

#### 2. checkin_records（打卡记录表）
```sql
- id: UUID (主键)
- student_id: TEXT (学员ID，关联 users 表)
- plan_id: UUID (关联打卡计划，可选)
- checkin_date: DATE (打卡日期)
- xhs_url: TEXT (小红书链接)
- xiaohongshu_url: TEXT (备用链接字段)
- post_publish_time: TIMESTAMP (发布时间)
- status: TEXT (状态：valid/invalid/pending)
- admin_review_notes: TEXT (管理员审核备注)
- content_title: TEXT (内容标题)
- content_description: TEXT (内容描述)
- student_name: TEXT (学员姓名)
- created_at: TIMESTAMP (创建时间)
- updated_at: TIMESTAMP (更新时间)
```

### 新增字段到 users 表

- `real_name`: TEXT (真实姓名)
- `xiaohongshu_profile_url`: TEXT (小红书主页链接)
- `role`: TEXT (用户角色，默认 'student')

## ⚠️ 安全保障

### 数据安全
- ✅ **只新增，不删除**：迁移脚本只会新增表和字段，不会删除任何现有数据
- ✅ **外键保护**：新表通过外键关联到现有 users 表，确保数据一致性
- ✅ **事务保护**：所有操作在事务中执行，失败时自动回滚

### 回滚策略
如果迁移出现问题，可以执行以下回滚操作：

```sql
-- 紧急回滚脚本（仅在必要时使用）
DROP TABLE IF EXISTS checkin_records CASCADE;
DROP TABLE IF EXISTS checkin_schedules CASCADE;
ALTER TABLE users DROP COLUMN IF EXISTS real_name;
ALTER TABLE users DROP COLUMN IF EXISTS xiaohongshu_profile_url;
-- 注意：不要删除 role 字段，因为可能已有数据依赖
```

## 🔍 验证清单

迁移完成后，请确认以下项目：

- [ ] users 表仍有 268 条记录
- [ ] checkin_schedules 表已创建且为空
- [ ] checkin_records 表已创建且为空
- [ ] 所有索引和外键约束已创建
- [ ] RLS 策略已设置
- [ ] Vercel 环境变量已更新
- [ ] 应用重新部署成功
- [ ] 网站功能正常访问

## 📞 支持

如果在迁移过程中遇到任何问题：

1. **立即停止操作**
2. **检查错误日志**
3. **如有数据丢失风险，立即从备份恢复**
4. **联系技术支持进行协助**

## 🎉 迁移完成

迁移成功后，你的生产数据库将具备：
- ✅ 完整的用户数据（268 条记录保持不变）
- ✅ 打卡计划管理功能
- ✅ 打卡记录存储功能
- ✅ 与开发环境一致的表结构
- ✅ 支持所有新功能的数据库基础
