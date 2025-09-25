-- 复制打卡相关数据到生产数据库的SQL脚本
-- 请在生产数据库 (https://jwfthdjxmqexsvzyiral.supabase.co) 的SQL编辑器中执行

-- =====================================================
-- 第一步：复制 checkin_schedules 表数据
-- =====================================================

-- 从开发数据库复制的 checkin_schedules 数据
-- 注意：请先在开发数据库中导出这些数据，然后在生产数据库中执行插入

-- 示例插入语句（请根据实际数据替换）
INSERT INTO checkin_schedules (
    student_id,
    start_date,
    end_date,
    created_at
) VALUES
-- 这里需要您从开发数据库中获取实际数据
-- 可以在开发数据库中运行以下查询来获取数据：
-- SELECT student_id, start_date, end_date, created_at FROM checkin_schedules;

-- 示例数据格式：
-- ('AXCF2025010001', '2025-08-25', '2025-11-25', '2025-08-25 10:00:00+00'),
-- ('AXCF2025010002', '2025-08-25', '2025-11-25', '2025-08-25 10:00:00+00'),
-- 更多数据...

ON CONFLICT (student_id) DO UPDATE SET
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    created_at = EXCLUDED.created_at;

-- =====================================================
-- 第二步：复制 checkin_records 表数据
-- =====================================================

-- 从开发数据库复制的 checkin_records 数据
INSERT INTO checkin_records (
    student_id,
    checkin_date,
    status,
    created_at
) VALUES
-- 这里需要您从开发数据库中获取实际数据
-- 可以在开发数据库中运行以下查询来获取数据：
-- SELECT student_id, checkin_date, status, created_at FROM checkin_records ORDER BY created_at;

-- 示例数据格式：
-- ('AXCF2025010001', '2025-08-25', 'present', '2025-08-25 10:00:00+00'),
-- ('AXCF2025010001', '2025-08-26', 'present', '2025-08-26 10:00:00+00'),
-- 更多数据...

ON CONFLICT (student_id, checkin_date) DO UPDATE SET
    status = EXCLUDED.status,
    created_at = EXCLUDED.created_at;

-- =====================================================
-- 第三步：验证数据复制结果
-- =====================================================

-- 检查 checkin_schedules 表数据
SELECT 
    COUNT(*) as total_schedules,
    COUNT(DISTINCT student_id) as unique_students
FROM checkin_schedules;

-- 检查 checkin_records 表数据
SELECT 
    COUNT(*) as total_records,
    COUNT(DISTINCT student_id) as unique_students,
    COUNT(CASE WHEN status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_count
FROM checkin_records;

-- 检查最近的打卡记录
SELECT 
    student_id,
    checkin_date,
    status,
    created_at
FROM checkin_records 
ORDER BY created_at DESC 
LIMIT 10;

-- =====================================================
-- 使用说明
-- =====================================================

/*
执行步骤：

1. 首先在开发数据库 (https://edoljoofbxinghqidgmr.supabase.co) 中运行以下查询获取数据：

   -- 获取 checkin_schedules 数据
   SELECT 
       'INSERT INTO checkin_schedules (student_id, start_date, end_date, created_at) VALUES' ||
       string_agg(
           '(''' || student_id || ''', ''' || start_date || ''', ''' || end_date || ''', ''' || created_at || ''')',
           ', '
       ) || ';'
   FROM checkin_schedules;

   -- 获取 checkin_records 数据
   SELECT 
       'INSERT INTO checkin_records (student_id, checkin_date, status, created_at) VALUES' ||
       string_agg(
           '(''' || student_id || ''', ''' || checkin_date || ''', ''' || status || ''', ''' || created_at || ''')',
           ', '
       ) || ';'
   FROM checkin_records;

2. 将生成的 INSERT 语句复制到本文件中替换示例数据

3. 在生产数据库中执行完整的脚本

4. 运行验证查询确认数据复制成功
*/
