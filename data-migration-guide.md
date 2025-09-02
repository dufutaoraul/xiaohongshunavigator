# 📊 测试数据迁移指南

## 🎯 目标
将开发数据库 `ai-xiaohongshu-DEV` 中的测试数据迁移到生产数据库 `ai-xiaohongshu-navigator`

## 📋 迁移步骤

### 第一步：从开发数据库导出数据

在开发数据库的 SQL Editor 中运行以下查询：

#### 1. 导出 checkin_schedules 数据
```sql
-- 查看 checkin_schedules 表数据
SELECT 
    id,
    student_id,
    start_date,
    end_date,
    created_at,
    created_by,
    is_active
FROM checkin_schedules 
ORDER BY created_at;
```

#### 2. 导出 checkin_records 数据
```sql
-- 查看 checkin_records 表数据
SELECT 
    id,
    student_id,
    plan_id,
    checkin_date,
    xhs_url,
    post_publish_time,
    status,
    admin_review_notes,
    created_at,
    updated_at,
    content_title,
    content_description,
    student_name,
    xiaohongshu_url
FROM checkin_records 
ORDER BY created_at;
```

### 第二步：清理生产数据库不需要的表

在生产数据库中运行 `cleanup-unused-tables.sql` 脚本：

**建议删除的表：**
- ❌ `punch_cards` - 旧版打卡表，功能重复
- ❌ `generated_content` - 内容生成表，当前未使用

**保留的表：**
- ✅ `users` - 用户信息（268条记录）
- ✅ `checkin_schedules` - 打卡计划
- ✅ `checkin_records` - 打卡记录

### 第三步：迁移数据到生产数据库

⚠️ **重要提醒**：生产数据库的表结构可能比开发数据库更复杂，有更多字段。我们只插入开发数据库中存在的字段，其他字段使用默认值。

#### 3.1 先检查生产数据库的表结构
```sql
-- 检查 checkin_schedules 表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'checkin_schedules'
ORDER BY ordinal_position;

-- 检查 checkin_records 表结构
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'checkin_records'
ORDER BY ordinal_position;
```

#### 3.2 迁移数据（只插入开发数据库中存在的字段）

使用从第一步获取的实际数据，在生产数据库中运行：

```sql
-- 迁移 checkin_schedules 数据
-- 只插入开发数据库中存在的字段，其他字段使用默认值
INSERT INTO checkin_schedules (id, student_id, start_date, end_date, created_at, created_by, is_active)
VALUES
-- 将第一步查询的结果粘贴到这里
('实际的id', '实际的student_id', '实际的start_date', '实际的end_date', '实际的created_at', '实际的created_by', 实际的is_active)
ON CONFLICT (id) DO NOTHING;

-- 迁移 checkin_records 数据
-- 只插入开发数据库中存在的字段，其他字段使用默认值
INSERT INTO checkin_records (
    id, student_id, plan_id, checkin_date, xhs_url,
    post_publish_time, status, admin_review_notes,
    created_at, updated_at, content_title, content_description,
    student_name, xiaohongshu_url
)
VALUES
-- 将第一步查询的结果粘贴到这里
('实际的数据...')
ON CONFLICT (id) DO NOTHING;
```

#### 3.3 如果遇到字段不存在的错误
如果插入时报错某个字段不存在，请：
1. 从 INSERT 语句中移除该字段
2. 从 VALUES 中移除对应的值
3. 重新执行插入语句

### 第四步：验证迁移结果

运行 `verify-production-migration.sql` 脚本验证：

```sql
-- 检查数据量
SELECT 'checkin_schedules' as table_name, COUNT(*) as count FROM checkin_schedules
UNION ALL
SELECT 'checkin_records' as table_name, COUNT(*) as count FROM checkin_records
UNION ALL
SELECT 'users' as table_name, COUNT(*) as count FROM users;
```

## 🔍 关于 "Unrestricted" 的说明

**Unrestricted** = 没有启用 RLS（Row Level Security）

### 特点：
- ✅ **简单**：不需要复杂的权限策略
- ✅ **适合管理后台**：管理员可以访问所有数据
- ⚠️ **安全性较低**：任何有数据库权限的用户都能访问所有数据

### 是否需要设置？
- **当前阶段**：保持 Unrestricted 即可，简化开发
- **未来考虑**：如果需要多租户或更细粒度的权限控制，可以启用 RLS

### 如何启用 RLS（可选）：
```sql
-- 启用 RLS
ALTER TABLE checkin_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_records ENABLE ROW LEVEL SECURITY;

-- 创建策略（示例）
CREATE POLICY "用户只能查看自己的数据" ON checkin_records
    FOR ALL USING (student_id = current_user);
```

## ✅ 完成检查清单

- [ ] 从开发数据库导出测试数据
- [ ] 在生产数据库中清理不需要的表
- [ ] 迁移 checkin_schedules 数据
- [ ] 迁移 checkin_records 数据
- [ ] 运行验证脚本确认迁移成功
- [ ] 更新 Vercel 环境变量指向生产数据库
- [ ] 重新部署应用并测试功能

## 🚨 注意事项

1. **备份重要数据**：删除表前确保有备份
2. **逐步执行**：一步一步执行，出错时容易排查
3. **验证功能**：迁移完成后测试应用的核心功能
4. **保持数据一致性**：确保外键关系正确
