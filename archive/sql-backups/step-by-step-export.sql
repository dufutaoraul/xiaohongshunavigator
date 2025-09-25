-- 分步执行的数据导出脚本
-- 在开发数据库中逐个执行以下查询

-- =====================================================
-- 第1步：检查 checkin_schedules 表结构
-- =====================================================
SELECT 'checkin_schedules 表结构:' as info;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'checkin_schedules' 
ORDER BY ordinal_position;

-- =====================================================
-- 第2步：查看 checkin_schedules 数据
-- =====================================================
SELECT 'checkin_schedules 数据内容:' as info;

SELECT * FROM checkin_schedules ORDER BY student_id;

-- =====================================================
-- 第3步：生成 checkin_schedules 的 INSERT 语句
-- =====================================================
SELECT 
    'INSERT INTO checkin_schedules (student_id, start_date, end_date, created_at) VALUES ' ||
    string_agg(
        '(''' || student_id || ''', ''' || start_date || ''', ''' || end_date || ''', ''' || created_at || ''')',
        ', '
    ) || ';'
    AS checkin_schedules_insert
FROM checkin_schedules;

-- =====================================================
-- 第4步：检查 checkin_records 表结构
-- =====================================================
SELECT 'checkin_records 表结构:' as info;

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'checkin_records' 
ORDER BY ordinal_position;

-- =====================================================
-- 第5步：查看 checkin_records 数据统计
-- =====================================================
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT student_id) as unique_students,
    MIN(checkin_date) as earliest_date,
    MAX(checkin_date) as latest_date
FROM checkin_records;

-- =====================================================
-- 第6步：查看 checkin_records 最近数据
-- =====================================================
SELECT * FROM checkin_records ORDER BY created_at DESC LIMIT 10;

-- =====================================================
-- 第7步：生成 checkin_records 的 INSERT 语句
-- =====================================================
SELECT 
    'INSERT INTO checkin_records (student_id, checkin_date, status, created_at) VALUES ' ||
    string_agg(
        '(''' || student_id || ''', ''' || checkin_date || ''', ''' || status || ''', ''' || created_at || ''')',
        ', '
    ) || ';'
    AS checkin_records_insert
FROM checkin_records;
