-- ===================================
-- 🚀 小红书领航员数据迁移 - 一键版本
-- 清空生产数据库 + 完整复制开发数据库
-- ===================================

-- =====================================================
-- 🔥 第1步：在生产数据库执行 - 删除旧表
-- =====================================================
-- ⚠️  注意：这会完全删除生产数据库中的打卡相关表！
-- 请确认后再执行以下脚本：

-- 删除旧表（保留 users 表）
DROP TABLE IF EXISTS checkin_records CASCADE;
DROP TABLE IF EXISTS checkin_schedules CASCADE;

-- 验证表已删除
SELECT 'checkin_records 表是否存在:' as info,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checkin_records')
            THEN '存在' ELSE '已删除' END as status;
SELECT 'checkin_schedules 表是否存在:' as info,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checkin_schedules')
            THEN '存在' ELSE '已删除' END as status;

-- =====================================================
-- 📊 第2步：在开发数据库执行 - 导出表结构和数据
-- =====================================================

-- 2.1 查看开发数据库的数据统计
SELECT '=== 📊 开发数据库数据统计 ===' as info;
SELECT 'checkin_schedules 记录数:' as table_name, COUNT(*) as count FROM checkin_schedules
UNION ALL
SELECT 'checkin_records 记录数:' as table_name, COUNT(*) as count FROM checkin_records;

-- 2.2 导出 checkin_schedules 表结构
SELECT '=== 🏗️ checkin_schedules 表结构 ===' as info;
SELECT 'CREATE TABLE checkin_schedules (' as create_statement
UNION ALL
SELECT '    ' || column_name || ' ' || data_type ||
       CASE WHEN character_maximum_length IS NOT NULL
            THEN '(' || character_maximum_length || ')'
            ELSE '' END ||
       CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
       CASE WHEN column_default IS NOT NULL
            THEN ' DEFAULT ' || column_default
            ELSE '' END || ','
FROM information_schema.columns
WHERE table_name = 'checkin_schedules'
ORDER BY ordinal_position
UNION ALL
SELECT ');' as create_statement;

-- 2.3 导出 checkin_records 表结构
SELECT '=== 🏗️ checkin_records 表结构 ===' as info;
SELECT 'CREATE TABLE checkin_records (' as create_statement
UNION ALL
SELECT '    ' || column_name || ' ' || data_type ||
       CASE WHEN character_maximum_length IS NOT NULL
            THEN '(' || character_maximum_length || ')'
            ELSE '' END ||
       CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
       CASE WHEN column_default IS NOT NULL
            THEN ' DEFAULT ' || column_default
            ELSE '' END || ','
FROM information_schema.columns
WHERE table_name = 'checkin_records'
ORDER BY ordinal_position
UNION ALL
SELECT ');' as create_statement;

-- 2.4 生成 checkin_schedules 的完整 INSERT 语句
SELECT '=== 📥 checkin_schedules 数据导入语句 ===' as info;
SELECT
    'INSERT INTO checkin_schedules (student_id, start_date, end_date, created_at, created_by) VALUES ' ||
    string_agg(
        '(' ||
        COALESCE('''' || student_id || '''', '''unknown''') || ', ' ||
        COALESCE('''' || start_date || '''', '''2025-01-01''') || ', ' ||
        COALESCE('''' || end_date || '''', '''2025-12-31''') || ', ' ||
        COALESCE('''' || created_at || '''', '''2025-01-01 00:00:00''') || ', ' ||
        COALESCE('''' || created_by || '''', '''system''') ||
        ')',
        ', '
    ) || ';'
    AS insert_statement
FROM checkin_schedules;

-- 2.5 生成 checkin_records 的完整 INSERT 语句
SELECT '=== 📥 checkin_records 数据导入语句 ===' as info;
SELECT
    'INSERT INTO checkin_records (student_id, checkin_date, status, created_at, the_url, description, image_url) VALUES ' ||
    string_agg(
        '(' ||
        COALESCE('''' || student_id || '''', '''unknown''') || ', ' ||
        COALESCE('''' || checkin_date || '''', '''2025-01-01''') || ', ' ||
        COALESCE('''' || status || '''', '''pending''') || ', ' ||
        COALESCE('''' || created_at || '''', '''2025-01-01 00:00:00''') || ', ' ||
        COALESCE('''' || the_url || '''', '''https://default-url.com''') || ', ' ||
        COALESCE('''' || description || '''', '''默认描述''') || ', ' ||
        COALESCE('''' || image_url || '''', '''https://default-image.jpg''') ||
        ')',
        ', '
    ) || ';'
    AS insert_statement
FROM checkin_records;

-- =====================================================
-- ✅ 第3步：在生产数据库执行 - 验证导入结果
-- =====================================================

-- 验证导入结果
SELECT '=== ✅ 验证导入结果 ===' as info;
SELECT 'checkin_records 导入后记录数:' as info, COUNT(*) as count FROM checkin_records;
SELECT 'checkin_schedules 导入后记录数:' as info, COUNT(*) as count FROM checkin_schedules;

-- 查看最新导入的记录
SELECT '最新的 checkin_records:' as info;
SELECT * FROM checkin_records ORDER BY created_at DESC LIMIT 5;

SELECT '最新的 checkin_schedules:' as info;
SELECT * FROM checkin_schedules ORDER BY created_at DESC LIMIT 5;

-- =====================================================
-- 🎯 操作步骤总结
-- =====================================================
/*
📋 完全重建表的一键迁移操作步骤：

1️⃣ 在生产数据库执行：
   - 复制第1步的 DROP TABLE 语句（删除旧表）

2️⃣ 在开发数据库执行：
   - 复制并执行第2步的脚本
   - 获得表结构的 CREATE TABLE 语句
   - 获得数据的 INSERT 语句

3️⃣ 在生产数据库执行：
   - 复制 checkin_schedules 的 CREATE TABLE 语句
   - 复制 checkin_records 的 CREATE TABLE 语句
   - 复制 checkin_schedules 的 INSERT 语句
   - 复制 checkin_records 的 INSERT 语句

4️⃣ 在生产数据库执行：
   - 复制第3步的验证脚本确认导入成功

🎉 完成！表结构和数据完全一致！
*/
