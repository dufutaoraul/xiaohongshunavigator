-- 第1步：移除外键约束和诊断问题
-- 这步是安全的，不会删除数据

-- 检查当前约束
SELECT 'current_constraints' as step,
       tc.table_name,
       tc.constraint_name,
       tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name IN ('checkin_records', 'checkin_schedules')
  AND tc.constraint_type = 'FOREIGN KEY';

-- 移除外键约束
ALTER TABLE checkin_records DROP CONSTRAINT IF EXISTS checkin_records_student_id_fkey;
ALTER TABLE checkin_schedules DROP CONSTRAINT IF EXISTS checkin_schedules_student_id_fkey;

-- 检查数据状况
SELECT 'users_count' as info, COUNT(*) as count FROM users;
SELECT 'checkin_records_count' as info, COUNT(*) as count FROM checkin_records;

-- 检查孤立数据
SELECT 'orphaned_records' as info,
       cr.student_id,
       COUNT(*) as record_count
FROM checkin_records cr
LEFT JOIN users u ON cr.student_id = u.student_id
WHERE u.student_id IS NULL
GROUP BY cr.student_id;