-- 🚀 数据迁移脚本 - 清空生产表并导入开发数据
-- ⚠️  请按顺序执行，先在生产数据库清空表，再在开发数据库生成数据

-- =====================================================
-- 🔥 第1步：在生产数据库执行 - 清空表数据
-- =====================================================
-- ⚠️  注意：这会删除生产数据库中的所有打卡相关数据！
-- 请确认后再执行！

-- 1.1 禁用外键约束（避免删除时的约束问题）
ALTER TABLE checkin_records DISABLE TRIGGER ALL;
ALTER TABLE checkin_schedules DISABLE TRIGGER ALL;

-- 1.2 清空表数据（保留表结构）
TRUNCATE TABLE checkin_records RESTART IDENTITY CASCADE;
TRUNCATE TABLE checkin_schedules RESTART IDENTITY CASCADE;

-- 1.3 重新启用外键约束
ALTER TABLE checkin_records ENABLE TRIGGER ALL;
ALTER TABLE checkin_schedules ENABLE TRIGGER ALL;

-- 1.4 验证表已清空
SELECT 'checkin_records 剩余记录数:' as info, COUNT(*) as count FROM checkin_records;
SELECT 'checkin_schedules 剩余记录数:' as info, COUNT(*) as count FROM checkin_schedules;

-- =====================================================
-- 📊 第2步：在开发数据库执行 - 生成导出数据
-- =====================================================

-- 2.1 查看开发数据库的数据统计
SELECT '=== 开发数据库数据统计 ===' as info;
SELECT 'checkin_schedules 记录数:' as table_name, COUNT(*) as count FROM checkin_schedules
UNION ALL
SELECT 'checkin_records 记录数:' as table_name, COUNT(*) as count FROM checkin_records;

-- 2.2 生成 checkin_schedules 的完整 INSERT 语句
SELECT '=== checkin_schedules 导入语句 ===' as info;
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

-- 2.3 检查当前开发数据库表结构
SELECT '=== 检查开发数据库 checkin_records 表结构 ===' as info;
SELECT column_name, is_nullable, column_default, data_type
FROM information_schema.columns
WHERE table_name = 'checkin_records'
ORDER BY ordinal_position;

-- 2.4 生成包含所有必填字段的 checkin_records INSERT 语句
SELECT '=== checkin_records 导入语句（包含所有字段） ===' as info;
SELECT
    'INSERT INTO checkin_records (student_id, checkin_date, status, created_at, the_url) VALUES ' ||
    string_agg(
        '(' ||
        COALESCE('''' || student_id || '''', '''unknown''') || ', ' ||
        COALESCE('''' || checkin_date || '''', '''2025-01-01''') || ', ' ||
        COALESCE('''' || status || '''', '''pending''') || ', ' ||
        COALESCE('''' || created_at || '''', '''2025-01-01 00:00:00''') || ', ' ||
        COALESCE('''' || the_url || '''', '''https://default-url.com''') ||
        ')',
        ', '
    ) || ';'
    AS insert_statement
FROM checkin_records
WHERE student_id IS NOT NULL
  AND checkin_date IS NOT NULL
  AND status IS NOT NULL;
