-- ===================================
-- 🚀 超简单数据迁移 - 一键复制版本
-- ===================================

-- =====================================================
-- 🔥 第1步：在生产数据库执行（删除旧表）
-- =====================================================
DROP TABLE IF EXISTS checkin_records CASCADE;
DROP TABLE IF EXISTS checkin_schedules CASCADE;

-- =====================================================
-- 📊 第2步：在开发数据库执行（查看数据）
-- =====================================================
SELECT '开发数据库统计:' as info;
SELECT COUNT(*) as checkin_schedules_count FROM checkin_schedules;
SELECT COUNT(*) as checkin_records_count FROM checkin_records;

-- =====================================================
-- 🏗️ 第3步：在开发数据库执行（导出表结构）
-- =====================================================

-- 3.1 查看 checkin_schedules 表结构
SELECT '=== checkin_schedules 表字段 ===' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'checkin_schedules' 
ORDER BY ordinal_position;

-- 3.2 查看 checkin_records 表结构  
SELECT '=== checkin_records 表字段 ===' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'checkin_records' 
ORDER BY ordinal_position;

-- =====================================================
-- 📥 第4步：在开发数据库执行（生成数据）
-- =====================================================

-- 4.1 导出 checkin_schedules 数据
SELECT '=== checkin_schedules 数据 ===' as info;
SELECT * FROM checkin_schedules;

-- 4.2 导出 checkin_records 数据
SELECT '=== checkin_records 数据 ===' as info;
SELECT * FROM checkin_records;

-- =====================================================
-- 📋 操作说明
-- =====================================================
/*
🎯 超简单操作步骤：

1️⃣ 在生产数据库执行第1步（删除表）

2️⃣ 在开发数据库执行第2-4步，查看：
   - 数据统计
   - 表结构
   - 所有数据

3️⃣ 根据查看结果，手动在生产数据库创建表：
   CREATE TABLE checkin_schedules (...);
   CREATE TABLE checkin_records (...);

4️⃣ 根据导出的数据，手动插入：
   INSERT INTO checkin_schedules VALUES (...);
   INSERT INTO checkin_records VALUES (...);

这样最简单，不会有语法错误！
*/
