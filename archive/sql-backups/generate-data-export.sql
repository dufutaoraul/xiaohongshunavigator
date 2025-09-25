-- 在开发数据库中运行此脚本，生成可在生产数据库中执行的 INSERT 语句
-- 数据库：https://edoljoofbxinghqidgmr.supabase.co

-- =====================================================
-- 生成 checkin_schedules 表的 INSERT 语句
-- =====================================================

-- 先检查表结构
SELECT 'checkin_schedules 表结构:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'checkin_schedules'
ORDER BY ordinal_position;

-- 生成简单的 INSERT 语句（不使用 ON CONFLICT）
SELECT
    'INSERT INTO checkin_schedules (student_id, start_date, end_date, created_at) VALUES ' ||
    string_agg(
        '(''' || student_id || ''', ''' || start_date || ''', ''' || end_date || ''', ''' || created_at || ''')',
        ', '
    ) || ';'
    AS checkin_schedules_insert
FROM checkin_schedules;

-- =====================================================
-- 生成 checkin_records 表的 INSERT 语句
-- =====================================================

-- 先检查表结构
SELECT 'checkin_records 表结构:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'checkin_records'
ORDER BY ordinal_position;

-- 生成简单的 INSERT 语句（不使用 ON CONFLICT）
SELECT
    'INSERT INTO checkin_records (student_id, checkin_date, status, created_at) VALUES ' ||
    string_agg(
        '(''' || student_id || ''', ''' || checkin_date || ''', ''' || status || ''', ''' || created_at || ''')',
        ', '
    ) || ';'
    AS checkin_records_insert
FROM checkin_records;

-- =====================================================
-- 查看当前数据统计
-- =====================================================

-- 查看 checkin_schedules 数据统计
SELECT 
    'checkin_schedules' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT student_id) as unique_students,
    MIN(start_date) as earliest_start,
    MAX(end_date) as latest_end
FROM checkin_schedules

UNION ALL

-- 查看 checkin_records 数据统计
SELECT 
    'checkin_records' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT student_id) as unique_students,
    MIN(checkin_date)::text as earliest_date,
    MAX(checkin_date)::text as latest_date
FROM checkin_records;

-- =====================================================
-- 查看具体数据内容（用于验证）
-- =====================================================

-- 查看 checkin_schedules 的所有数据
SELECT 'checkin_schedules 数据:' as info;
SELECT * FROM checkin_schedules ORDER BY student_id;

-- 查看 checkin_records 的最近数据
SELECT 'checkin_records 最近数据:' as info;
SELECT * FROM checkin_records ORDER BY created_at DESC LIMIT 20;
