# 数据库迁移策略

## 当前环境架构

```
开发环境: ai-xiaohongshu-DEV (当前开发分支)
生产环境: ai-xiaohongshu-navigator (主干/生产分支)
已停用: zuoyepigai (之前的作业系统)
```

## 迁移策略

### 方案1：渐进式迁移（推荐）

1. **开发阶段**
   - 在 `ai-xiaohongshu-DEV` 中创建作业相关表
   - 完成功能开发和测试
   - 确保所有功能正常工作

2. **预生产准备**
   - 创建迁移脚本 `production-migration.sql`
   - 包含所有新表结构和必要数据
   - 测试迁移脚本的完整性

3. **生产环境部署**
   - 在 `ai-xiaohongshu-navigator` 中执行迁移脚本
   - 不影响现有表结构
   - 只添加新的作业相关表

### 方案2：功能开关模式

1. **代码层面**
   - 添加功能开关，控制作业系统的启用
   - 在生产环境中先关闭作业功能
   - 部署后再开启

2. **数据库层面**
   - 新表与现有表完全独立
   - 不修改任何现有表结构
   - 零风险部署

## 具体实施步骤

### 第一步：开发环境设置

1. 登录 Supabase，选择 `ai-xiaohongshu-DEV`
2. 进入 SQL Editor
3. 执行以下脚本：

```sql
-- 检查是否已存在作业相关表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('assignments', 'submissions');
```

4. 如果不存在，执行 `supabase-homework-setup.sql`
5. 执行 `supabase-test-data.sql` 添加测试数据

### 第二步：生产环境准备

创建生产迁移脚本，确保：
- 不影响现有用户表
- 不影响现有功能
- 可以安全回滚

### 第三步：部署策略

1. **代码部署**：先部署代码，功能开关关闭
2. **数据库迁移**：执行迁移脚本
3. **功能验证**：在生产环境测试
4. **功能开启**：确认无误后开启作业功能

## 风险控制

1. **数据备份**：迁移前备份生产数据库
2. **回滚计划**：准备回滚脚本
3. **监控告警**：部署后密切监控
4. **灰度发布**：可以考虑先对部分用户开放

## 表结构兼容性

新增的作业表与现有表完全独立：

```
现有表：
- users (用户表)
- 其他业务表...

新增表：
- assignments (作业表)
- submissions (提交表)
```

通过 `student_id` 字段关联，不修改现有表结构。